//helper to extract and analyse the complete repo fo the user 

function parseRepoUrl(repoUrl) {
    const cleanedUrl = repoUrl.replace(/\.git$/, ''); //removing the git end 
    const parts = cleanedUrl.split('/'); //splitting 
    const repo = parts.pop();
    const owner = parts.pop();
    console.log(repo);
    console.log(owner);

    return { owner, repo };
}

//parseRepoUrl("https://github.com/codesbysaravana/portfolio");
//goes as portfolio and codesbysaravana

async function runPreflightAnalysis(repoUrl, projectName) {
    const startTime = Date.now();
    const { owner, repo } = parseRepoUrl(repoUrl);

    let framework = "Node.js (Generic)";
    let detectedPort = 3000;
    const blockers = [];
    const requiredEnvVars = new Set(["PORT"]); //why??

    const USER_REPO = `https://api.github.com/repos/${owner}/${repo}/contents`;
    //I Checking user repo
    try { //fetching users package.json to get analysis
        const pkgRes = await fetch(`${USER_REPO}/package.json`, {
            headers: { 'User-Agent': 'MicrOps-Preflight-Engine' } //no headers just  desc
        });

        if (pkgRes.ok) {
            const pkgData = await pkgRes.json();
            console.log(pkgData); //raw json from network req, encoded with base64 string
            const content = Buffer.from(pkgData.content, 'base64').toString('utf-8');
            console.log(content); //decoded with base64 and raw content need to parse this (string)

            const pkg = JSON.parse(content);
            console.log(pkg); //js object to use!
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps['next']) {
                framework = "Next.js (SSR)";
            } else if (deps['express']) {
                framework = "Express.js";
            } else if (deps['react']) {
                framework = "React SPA";
            } else if (deps['@nestjs/core']) {
                framework = "NestJS Enterprise API";
            }

            //Env requirement chaining soon and needing env
            if (deps['pg'] || deps['pg-pool'] || deps['sequelize']) {
                requiredEnvVars.add("DATABASE_URL");
            }
            if (deps['redis'] || deps['ioredis'] || deps['bullmq']) {
                requiredEnvVars.add("REDIS_HOST");
                requiredEnvVars.add("REDIS_PORT");
            }
            if (deps['jsonwebtoken']) {
                requiredEnvVars.add("JWT_SECRET");
            }

            //inspecting ports needed
            const scriptStr = JSON.stringify(pkg.scripts || {}); //gets only "script" from package.json
            if (scriptsStr.includes("8080")) { //microps all routes every  thing to 3000 (gotta change this)
                detectedPort = 8080;
                warnings.push("Detected Port 8080 in scripts. MicrOps ALB auto-routes to Port 3000 by default.");
            }
        } else {
            warnings.push("No package.json found at root. Assuming Dockerfile manages custom runtime.");
        }

        // II. Check if Dockerfile exists in project repo
        const dockerRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/Dockerfile`, {
            headers: { 'User-Agent': 'MicrOps-Preflight-Engine' }
        });
        if (!dockerRes.ok) {
            warnings.push("No custom Dockerfile detected. MicrOps will use standard Nixpacks/Buildpacks.");
        }

    } catch (err) {
        console.log(err);
    }

    //default ECS Fargate spot (0.25 vCPU) and 512MB (if priced? then more)
    const computeMonthly = 11.40;
    const ecrAndAlbMonthly = 3.28;
    const totalEstimatedCost = (computeMonthly + ecrAndAlbMonthly).toFixed(2);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    //making reports for returning
    const report = [
        `✈️ Pre-Flight Intelligence Report (${durationSec}s)`,
        `  🟢 Architecture Radar:`,
        `    • Detected Runtime: ${framework}`,
        `    • Target Container Port: ${detectedPort} ✅`,
        ``,
        `  💡 Environment Variable Audit:`,
        `    • Required Vars Detected in AST: [ ${Array.from(requiredEnvVars).join(", ")} ]`,
        blockers.length > 0 ? `  🔴 Blockers:\n` + blockers.map(b => `    • ${b}`).join("\n") : "",
        warnings.length > 0 ? `  🟡 Suggestions:\n` + warnings.map(w => `    • ${w}`).join("\n") : "",
        ``,
        `  💰 Cost Oracle (Pre-Deploy Estimate):`,
        `    • Compute (0.25 vCPU / 512MB Fargate Spot): ~$${computeMonthly}/mo`,
        `    • ECR Storage & ALB Subdomain Routing:      ~$${ecrAndAlbMonthly}/mo`,
        `    ──────────────────────────────────────────────────────────`,
        `    📊 Total Estimated Monthly Cost: $${totalEstimatedCost}/month`
    ].filter(Boolean).join("\n");

    return {
        success: blockers.length === 0,
        report,
        framework,
        requiredEnvVars: Array.from(requiredEnvVars)
    };

}

runPreflightAnalysis("https://github.com/codesbysaravana/portfolio", "portfolio");

module.exports = { runPreflightAnalysis };