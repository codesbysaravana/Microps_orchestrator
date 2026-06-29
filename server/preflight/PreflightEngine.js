// server/preflight/PreflightEngine.js
// Single Responsibility: Orchestrates Scanner & Detectors, calculates cost, formats final report.
const { scanRepository } = require('./Scanner');
const { detectorPlugins } = require('./Detectors');

async function runPreflightAnalysis(repoUrl, projectName) {
    const startTime = Date.now();
    const blockers = [];
    let warnings = [];

    // 1. Scan repo file tree once
    const { owner, repo, fileSet } = await scanRepository(repoUrl);

    if (fileSet.size === 0) {
        blockers.push(`Could not fetch file tree for repository ${repoUrl}. Check if repo is public or URL is valid.`);
        return {
            success: false,
            report: `❌ Pre-Flight Analysis Failed: Repository unreachable or empty.`,
            framework: "Unknown",
            requiredEnvVars: []
        };
    }

    // 2. Run Detectors to find active runtime
    let activeDetection = null;
    for (const plugin of detectorPlugins) {
        if (plugin.canDetect(fileSet)) {
            activeDetection = await plugin.detect(owner, repo, fileSet);
            break;
        }
    }

    // Default fallback if no known runtime detected
    if (!activeDetection) {
        activeDetection = {
            runtime: "Docker Custom",
            framework: "Custom Runtime (Dockerfile)",
            detectedPort: 3000,
            requiredEnvVars: ["PORT"],
            warnings: ["No recognized dependency file (package.json, go.mod, etc.) found. Relying on custom build."],
            computeCostMonthly: 11.40,
            computeSpec: "0.25 vCPU / 512MB Fargate Spot"
        };
    }

    if (!fileSet.has("Dockerfile")) {
        activeDetection.warnings.push("No custom Dockerfile detected. MicrOps will generate standard buildpack container.");
    }

    warnings = warnings.concat(activeDetection.warnings || []);

    // 3. Compute Cost Oracle
    const computeMonthly = activeDetection.computeCostMonthly;
    const ecrAndAlbMonthly = 3.28;
    const totalEstimatedCost = (computeMonthly + ecrAndAlbMonthly).toFixed(2);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    // 4. Format Output Report
    const report = [
        `✈️ Pre-Flight Intelligence Report (${durationSec}s)`,
        `  🟢 Architecture Radar:`,
        `    • Detected Runtime: ${activeDetection.runtime} (${activeDetection.framework})`,
        `    • Target Container Port: ${activeDetection.detectedPort} ✅`,
        ``,
        `  💡 Environment Variable Audit:`,
        `    • Required Vars Detected: [ ${activeDetection.requiredEnvVars.join(", ")} ]`,
        blockers.length > 0 ? `  🔴 Blockers:\n` + blockers.map(b => `    • ${b}`).join("\n") : "",
        warnings.length > 0 ? `  🟡 Suggestions:\n` + warnings.map(w => `    • ${w}`).join("\n") : "",
        ``,
        `  💰 Cost Oracle (Pre-Deploy Estimate):`,
        `    • Compute (${activeDetection.computeSpec}): ~$${computeMonthly.toFixed(2)}/mo`,
        `    • ECR Storage & ALB Subdomain Routing:        ~$${ecrAndAlbMonthly}/mo`,
        `    ──────────────────────────────────────────────────────────`,
        `    📊 Total Estimated Monthly Cost: $${totalEstimatedCost}/month`
    ].filter(Boolean).join("\n");

    return {
        success: blockers.length === 0,
        report,
        framework: activeDetection.framework,
        requiredEnvVars: activeDetection.requiredEnvVars
    };
}

module.exports = { runPreflightAnalysis };
