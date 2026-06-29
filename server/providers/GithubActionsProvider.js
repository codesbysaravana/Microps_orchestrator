require('dotenv').config();
const { buildBus } = require('../utils/eventBus');

const GITHUB_PAT = process.env.GITHUB_PAT;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const WORKFLOW_ID = process.env.GITHUB_WORKFLOW_ID || 'builder.yml';

//to send to github runner
const HEADERS = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${GITHUB_PAT}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'MicrOps-Orchestrator'
};

async function triggerGitHubWorkflow(tenantScript) {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`;

    const response = await fetch(url, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
            ref: 'main', //or master by user
            inputs: {
                tenantScript: tenantScript
            }
        })
    });

    if (response.status !== 204) {
        const errText = await response.text();
        throw new Error(`GitHub Actions rejected Trigger with (${response.status}): ${errText}`);
    }

    console.log('[PROVIDER (shh secret)] Successfully dispatched GitHub Actions workflow!');
}

async function getLatestWorkflowRun() {
    await new Promise(r => setTimeout(r, 3000));

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/runs?event=workflow_dispatch&per_page=1`;

    const response = await fetch(url, {
        headers: HEADERS
    });
    const data = await response.json();

    if (data.workflow_runs && data.workflow_runs.length > 0) {
        return data.workflow_runs[0];
    }
    return null;
}

async function pollWorkflowRun(runId, jobId) {
    const runUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}`;
    const jobsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}/jobs`;
    
    const seenSteps = new Set();

    while (true) {
        const res = await fetch(runUrl, { headers: HEADERS });
        const run = await res.json();

        console.log(`[PROVIDER] GitHub Run #${run.run_number} status: ${run.status} (${run.conclusion || 'running'})`);

        // Fetch detailed jobs & step status
        try {
            const jobsRes = await fetch(jobsUrl, { headers: HEADERS });
            if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                if (jobsData.jobs && jobsData.jobs.length > 0) {
                    const job = jobsData.jobs[0];
                    if (job.steps) {
                        for (const step of job.steps) {
                            if (step.status === 'completed' && !seenSteps.has(step.number)) {
                                seenSteps.add(step.number);
                                buildBus.emit('build-progress', {
                                    jobId,
                                    message: `[GitHub Runner] Step completed: ${step.name} (${step.conclusion})`
                                });
                            } else if (step.status === 'in_progress' && !seenSteps.has('exec_' + step.number)) {
                                seenSteps.add('exec_' + step.number);
                                buildBus.emit('build-progress', {
                                    jobId,
                                    message: `[GitHub Runner] Step executing: ${step.name}...`
                                });
                            }
                        }
                    }

                    // If completed, attempt to fetch the tail logs of the job
                    if (run.status === 'completed' && run.conclusion !== 'success') {
                        const logUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/jobs/${job.id}/logs`;
                        const logRes = await fetch(logUrl, { headers: HEADERS });
                        if (logRes.ok) {
                            const rawLogs = await logRes.text();
                            // Clean timestamps and extract last 15 lines
                            const tailLogs = rawLogs.split('\n').slice(-15).join('\n');
                            buildBus.emit('build-progress', {
                                jobId,
                                message: `\n[Runner Terminal Tail Logs]:\n${tailLogs}\n`
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[PROVIDER] Error fetching job logs:', err.message);
        }

        if (run.status === 'completed') {
            return {
                buildNumber: run.run_number,
                result: run.conclusion === 'success' ? 'SUCCESS' : 'FAILURE',
                duration: Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000),
                url: run.html_url
            };
        }

        // Poll every 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function runBuildPipeline(tenantScript, jobId) {
    console.log('[PROVIDER] Triggering ephemeral build container via GitHub Actions...');
    buildBus.emit('build-progress', { jobId, message: '[GitHub Runner] Dispatching ephemeral container build...' });
    await triggerGitHubWorkflow(tenantScript);

    console.log('[PROVIDER] Locating GitHub workflow run instance...');
    const run = await getLatestWorkflowRun();

    if (!run) {
        throw new Error('Failed to locate triggered GitHub Actions workflow run.');
    }

    console.log(`[PROVIDER] Attached to GitHub Run #${run.run_number}. Monitoring execution...`);
    buildBus.emit('build-progress', { jobId, message: `[GitHub Runner] Attached to VM Run #${run.run_number}. Streaming step progress...` });
    
    const finalStatus = await pollWorkflowRun(run.id, jobId);

    return finalStatus;
}

module.exports = { runBuildPipeline };