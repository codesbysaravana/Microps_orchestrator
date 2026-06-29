const { getCrumb } = require('../utils/getJenkinsCrumb');
require('dotenv').config();

const JENKINS_URL = process.env.JENKINS_URL || 'http://localhost:8080';
const JENKINS_WORKER_JOB = 'MicrOps-Worker';

const getAuthHeader = () => {
    const username = process.env.JENKINS_API_USER;
    const token = process.env.JENKINS_API_KEY;
    return Buffer.from(`${username}:${token}`).toString('base64');
};

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

async function runBuildPipeline(tenantScript) {
    const { crumb, cookie } = await getCrumb();
    const queueUrl = await triggerJenkinsWorker(tenantScript, crumb, cookie);

    if (!queueUrl) throw new Error("Failed to queue job in Jenkins");

    console.log(`[PROVIDER] Waiting for Jenkins to assign build node...`);
    const executable = await pollQueue(queueUrl, crumb, cookie);

    console.log(`[PROVIDER] Jenkins assigned Build #${executable.number}. Monitoring execution...`);
    const finalStatus = await pollBuild(executable.url, crumb, cookie);

    return finalStatus;
}

module.exports = { runBuildPipeline };