const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { getCrumb } = require('../utils/getJenkinsCrumb');
const { projectsDB } = require('../repository/projectRepository');
const { deployServiceECS } = require('./DeployService');

require('dotenv').config();

const JENKINS_URL = process.env.JENKINS_URL || 'http://localhost:8080';
const JENKINS_WORKER_JOB = 'MicrOps-Worker'; // The single generic concurrent job

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ECR_REGISTRY_URL = process.env.ECR_REGISTRY_URL || '688567265418.dkr.ecr.ap-southeast-2.amazonaws.com';

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || "54.252.243.208",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    maxRetriesPerRequest: null,
});

// 2. Initialize the Job Queue
const buildQueue = new Queue('tenant-builds', { connection: redisConnection });

const jenkinsInit = async (userId, repoUrl, branch, buildCommand, projectName) => {
    console.log(`[API] Received deployment request for ${projectName}`);

    const language = 'javascript';
    const framework = 'nodejs';
    const installCommand = 'npm install';

    // Save initial state to DB before doing any heavy lifting
    const dbresponse = await projectsDB(userId, repoUrl, branch, language, framework, installCommand, buildCommand, projectName);
    console.log("[DB] Project tracking initialized:", dbresponse);

    const uniqueJobId = `build-${Date.now()}`;

    // Throw the job into the Redis Queue (BullMQ)
    const job = await buildQueue.add('execute-build', {
        userId,
        repoUrl,
        branch,
        buildCommand,
        projectName,
        jobId: uniqueJobId
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

/**
 * ------------------------------------------------------------------
 * DYNAMIC SCRIPT GENERATOR
 * Node dictates exact terminal commands for Jenkins to run.
 * ------------------------------------------------------------------
 */
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
}

//MAIN bullmq orchestration 
const buildWorker = new Worker('tenant-builds', async (job) => {
    const { repoUrl, branch, buildCommand, projectName, jobId, userId } = job.data;

    console.log(`\n[WORKER] Starting background processing for Job ID: ${jobId}`);

    try {
        const { crumb, cookie } = await getCrumb();

        const tenantScript = generateTenantScript(repoUrl, branch, buildCommand, projectName, jobId, userId);

        const queueUrl = await triggerJenkinsWorker(tenantScript, crumb, cookie);

        if (!queueUrl) throw new Error("Failed to queue job in Jenkins");

        console.log(`[WORKER] Waiting for Jenkins to assign build node...`);
        const executable = await pollQueue(queueUrl, crumb, cookie);

        console.log(`[WORKER] Jenkins assigned Build #${executable.number}. Monitoring execution...`);
        const finalStatus = await pollBuild(executable.url, crumb, cookie);

        if (finalStatus.result === 'SUCCESS') {
            console.log(`[WORKER] ✅ Build successful for ${projectName}!`);

            const imageURI = `${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${jobId}`;
            await deployServiceECS(userId, projectName, imageURI);

            return finalStatus;
        } else {
            throw new Error(`Jenkins Build Failed with status: ${finalStatus.result}`);
        }

    } catch (error) {
        console.error(`[WORKER] 🚨 Error processing job ${jobId}:`, error.message);
        throw error;
    }
}, { connection: redisConnection });


//jenkins API login
const getAuthHeader = () => {
    const username = process.env.JENKINS_API_USER;
    const token = process.env.JENKINS_API_KEY;
    return Buffer.from(`${username}:${token}`).toString('base64');
};

//first script to run on jenkins
async function triggerJenkinsWorker(tenantScript, crumb, cookie) {
    const params = new URLSearchParams();
    params.append('TENANT_SCRIPT', tenantScript);

    const res = await fetch(`${JENKINS_URL}/job/${JENKINS_WORKER_JOB}/buildWithParameters`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${getAuthHeader()}`,
            [crumb.crumbRequestField]: crumb.crumb,
            'Cookie': cookie,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    if (res.status !== 201) {
        console.error("Jenkins rejected trigger:", res.status, await res.text());
        return null;
    }

    return res.headers.get("location");
}

async function pollQueue(queueUrl, crumb, cookie) {
    while (true) {
        const res = await fetch(`${queueUrl}api/json`, {
            headers: {
                'Authorization': `Basic ${getAuthHeader()}`,
                [crumb.crumbRequestField]: crumb.crumb,
                'Cookie': cookie
            }
        });
        const data = await res.json();

        if (data.executable) {
            return data.executable;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function pollBuild(buildUrl, crumb, cookie) {
    while (true) {
        const res = await fetch(`${buildUrl}api/json`, {
            headers: {
                "Authorization": `Basic ${getAuthHeader()}`,
                [crumb.crumbRequestField]: crumb.crumb,
                "Cookie": cookie
            }
        });
        const build = await res.json();

        if (!build.building) {
            return {
                buildNumber: build.number,
                result: build.result,
                duration: build.duration,
                url: build.url
            };
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

module.exports = { jenkinsInit };





/* 
What imageURI becomes
Suppose:

userId = 42
projectName = todo-api
uniqueJobId = 8f3d12 
*/