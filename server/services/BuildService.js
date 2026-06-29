const { Queue, Worker } = require('bullmq');
//const { runBuildPipeline } = require('../providers/JenkinsProvider');
const { runBuildPipeline } = require('../providers/GithubActionsProvider');
const { projectsDB } = require('../repository/projectRepository');
const { deployServiceECS } = require('./DeployService');
const { redisConnection } = require('../db/redis');
const { runPreflightAnalysis } = require('../services/PreflightService');

const { buildBus } = require('../utils/eventBus');

require('dotenv').config();

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ECR_REGISTRY_URL = process.env.ECR_REGISTRY_URL || '688567265418.dkr.ecr.ap-southeast-2.amazonaws.com';

// Initializing the Job Queue with Redis
const buildQueue = new Queue('tenant-builds', { connection: redisConnection });

const buildInitializer = async (userId, repoUrl, branch, buildCommand, projectName) => {
    console.log(`[API] Received deployment request for ${projectName}`);

    buildBus.emit('build-progress', {
        userId: userId,
        message: '<------ Running Pre-Flight Intelligence Scanner ------>'
    });

    const preflightObj = await runPreflightAnalysis(repoUrl, projectName); //returns object

    buildBus.emit('build-progress', {
        userId: userId,
        message: preflightObj.report
    });

    if (!preflightObj.success) { //if any blockers found then false
        buildBus.emit('build-progress', {
            userId: userId,
            message: '❌ Pre-Flight Blockers detected. Deployment halted to save build minutes.'
        });
        return { status: "Halted", reason: "Pre-flight failed" };
    }

    buildBus.emit('build-progress', { //this the data inside listener
        message: '<------ Starting Build Stage ------>'
    });

    const language = 'javascript';
    const framework = preflightObj.framework;
    const installCommand = 'npm install';

    // Save initial state to DB before doing any heavy lifting
    const dbresponse = await projectsDB(userId, repoUrl, branch, language, framework, installCommand, buildCommand, projectName);
    console.log("[DB] Project tracking initialized:", dbresponse);

    const uniqueJobId = `build-${Date.now()}`;

    // create and Throwing of the job into the Redis Queue (BullMQ)
    const job = await buildQueue.add('execute-build', {
        userId,
        repoUrl,
        branch,
        buildCommand,
        projectName,
        jobId: uniqueJobId
    });

    buildBus.emit('build-progress', { //this the data inside listener
        jobId: job.id,
        message: '<------ Building Docker Image ------>'
    });

    console.log(`[API] Job added to queue! Queue ID: ${job.id}`);

    // Return immediately to the user frontend
    return JSON.stringify({
        status: "queued",
        jobId: job.id,
        internalId: uniqueJobId,
        message: "Build is waiting in queue."
    });
};

//Dynamic Script Genrator (jenkins/GithubActions for now)
function sanitizeCommand(cmd) {
    // Basic sanitization: strip out characters that could be used for shell injection (; | & $ > < ` \n)
    // Allow alphanumeric, spaces, dashes, dots, equals, and basic slashes.
    return cmd.replace(/[;&|$><`\n]/g, '');
}

function generateTenantScript(repoUrl, branch, buildCommand, projectName, uniqueJobId, userId) {
    const safeBuildCommand = sanitizeCommand(buildCommand);
    return `
#!/bin/bash
set -e # Stop on first error

echo "====== MicrOps Orchestrator: Initializing Workspace ======"
WORKSPACE_DIR="tenant-workspace-${uniqueJobId}"
git clone --branch ${branch} ${repoUrl} $WORKSPACE_DIR
cd $WORKSPACE_DIR

echo "Workspace:"
pwd
ls -la

echo "====== MicrOps Orchestrator: Executing User Build Commands ======"
${safeBuildCommand}

echo "====== MicrOps Orchestrator: Building Docker Image ======"

docker build --pull \
-t microps-registry/${projectName}:${uniqueJobId} .

echo "====== MicrOps Orchestrator: Logging into AWS ECR ======"

aws ecr get-login-password --region ${AWS_REGION} \
| docker login \
--username AWS \
--password-stdin ${ECR_REGISTRY_URL}

# Push to the central ECR vault. We tag the image with the userId to maintain secure multi-tenant organization (also appending microps-hq here)
echo "====== MicrOps Orchestrator: Tagging Image ======"

docker tag \
microps-registry/${projectName}:${uniqueJobId} \
${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${uniqueJobId}

echo "====== MicrOps Orchestrator: Pushing Image ======"

docker push \
${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${uniqueJobId}

echo "====== MicrOps Orchestrator: Cleaning Up Workspace ======"
echo "====== MicrOps Orchestrator: Cleaning Docker ======"

docker image rm \
${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${uniqueJobId} || true

docker image rm \
microps-registry/${projectName}:${uniqueJobId} || true

cd ..
rm -rf $WORKSPACE_DIR
echo "Build & Push completed successfully!"
`;
} //remember im using hardcoded ECR registry url

//MAIN bullmq orchestration 
const buildWorker = new Worker('tenant-builds', async (job) => {
    const { repoUrl, branch, buildCommand, projectName, jobId, userId } = job.data;

    console.log(`\n[WORKER] Starting background processing for Job ID: ${jobId}`);

    try {
        const tenantScript = generateTenantScript(repoUrl, branch, buildCommand, projectName, jobId, userId);
        buildBus.emit('build-progress', {
            jobId: jobId,
            message: '<------ Build running started by the worker------>'
        });
        const finalStatus = await runBuildPipeline(tenantScript, jobId);


        if (finalStatus.result === 'SUCCESS') {
            console.log(`[WORKER] Build successful for ${projectName}!`);

            buildBus.emit('build-progress', {
                jobId: jobId,
                message: '<------ Build Successful by the worker------>'
            });

            const imageURI = `${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${jobId}`;

            await deployServiceECS(userId, projectName, imageURI);

            return finalStatus;
        } else {
            throw new Error(`Cloud Container Build Failed with status: ${finalStatus.result}`);
        }

    } catch (error) {
        console.error(`[WORKER] 🚨 Error processing job ${jobId}:`, error.message);
        throw error;
    }
}, { connection: redisConnection });


module.exports = { buildInitializer };

/* 
What imageURI becomes
Suppose:

userId = 42
projectName = todo-api
uniqueJobId = 8f3d12 
*/

