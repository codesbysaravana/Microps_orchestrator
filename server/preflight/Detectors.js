// server/preflight/Detectors.js
// Single Responsibility: Houses clean language & framework detector plugins following the Open/Closed Principle.
const { fetchFileContent } = require('./Scanner');

const NodeDetector = {
    name: "Node.js",
    canDetect: (fileSet) => fileSet.has("package.json"),
    detect: async (owner, repo, fileSet) => {
        let framework = "Node.js (Generic)";
        let detectedPort = 3000;
        const requiredEnvVars = new Set(["PORT"]);
        const warnings = [];

        const content = await fetchFileContent(owner, repo, "package.json");
        if (content) {
            try {
                const pkg = JSON.parse(content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };

                if (deps['next']) framework = "Next.js (SSR)";
                else if (deps['express']) framework = "Express.js API";
                else if (deps['react']) framework = "React SPA";
                else if (deps['@nestjs/core']) framework = "NestJS Enterprise API";

                if (deps['pg'] || deps['pg-pool'] || deps['sequelize'] || deps['prisma'] || deps['@prisma/client']) {
                    requiredEnvVars.add("DATABASE_URL");
                }
                if (deps['redis'] || deps['ioredis'] || deps['bullmq']) {
                    requiredEnvVars.add("REDIS_HOST");
                    requiredEnvVars.add("REDIS_PORT");
                }
                if (deps['jsonwebtoken']) {
                    requiredEnvVars.add("JWT_SECRET");
                }

                const scriptsStr = JSON.stringify(pkg.scripts || {});
                if (scriptsStr.includes("8080")) {
                    detectedPort = 8080;
                    warnings.push("Detected Port 8080 in scripts. MicrOps ALB auto-routes to Port 3000 by default.");
                }
            } catch (err) {
                warnings.push("Could not parse package.json JSON.");
            }
        }

        return {
            runtime: "Node.js",
            framework,
            detectedPort,
            requiredEnvVars: Array.from(requiredEnvVars),
            warnings,
            computeCostMonthly: 11.40, // 0.25 vCPU / 512MB RAM
            computeSpec: "0.25 vCPU / 512MB Fargate Spot"
        };
    }
};

const PythonDetector = {
    name: "Python",
    canDetect: (fileSet) => fileSet.has("requirements.txt") || fileSet.has("pyproject.toml") || fileSet.has("Pipfile"),
    detect: async (owner, repo, fileSet) => {
        let framework = "Python (Generic)";
        const requiredEnvVars = new Set(["PORT"]);
        const warnings = [];

        let content = null;
        if (fileSet.has("requirements.txt")) content = await fetchFileContent(owner, repo, "requirements.txt");
        else if (fileSet.has("pyproject.toml")) content = await fetchFileContent(owner, repo, "pyproject.toml");

        if (content) {
            const lower = content.toLowerCase();
            if (lower.includes("fastapi")) framework = "FastAPI";
            else if (lower.includes("flask")) framework = "Flask";
            else if (lower.includes("django")) framework = "Django";

            if (lower.includes("psycopg") || lower.includes("asyncpg") || lower.includes("sqlalchemy")) {
                requiredEnvVars.add("DATABASE_URL");
            }
            if (lower.includes("redis")) {
                requiredEnvVars.add("REDIS_URL");
            }
        }

        return {
            runtime: "Python",
            framework,
            detectedPort: 3000,
            requiredEnvVars: Array.from(requiredEnvVars),
            warnings,
            computeCostMonthly: 11.40,
            computeSpec: "0.25 vCPU / 512MB Fargate Spot"
        };
    }
};

const GoDetector = {
    name: "Go",
    canDetect: (fileSet) => fileSet.has("go.mod"),
    detect: async (owner, repo, fileSet) => {
        let framework = "Go (Generic)";
        const requiredEnvVars = new Set(["PORT"]);
        const warnings = [];

        const content = await fetchFileContent(owner, repo, "go.mod");
        if (content) {
            const lower = content.toLowerCase();
            if (lower.includes("gin-gonic/gin")) framework = "Gin HTTP";
            else if (lower.includes("gofiber/fiber")) framework = "Fiber";
            else if (lower.includes("labstack/echo")) framework = "Echo";

            if (lower.includes("gorm") || lower.includes("pgx") || lower.includes("lib/pq")) {
                requiredEnvVars.add("DATABASE_URL");
            }
        }

        return {
            runtime: "Go",
            framework,
            detectedPort: 3000,
            requiredEnvVars: Array.from(requiredEnvVars),
            warnings,
            computeCostMonthly: 11.40,
            computeSpec: "0.25 vCPU / 512MB Fargate Spot"
        };
    }
};

const JavaDetector = {
    name: "Java",
    canDetect: (fileSet) => fileSet.has("pom.xml") || fileSet.has("build.gradle"),
    detect: async (owner, repo, fileSet) => {
        let framework = "Java (Generic)";
        const requiredEnvVars = new Set(["PORT"]);
        const warnings = [];

        if (fileSet.has("pom.xml")) {
            const content = await fetchFileContent(owner, repo, "pom.xml");
            if (content && content.toLowerCase().includes("spring-boot")) {
                framework = "Spring Boot";
                requiredEnvVars.add("SPRING_DATASOURCE_URL");
            }
        }

        return {
            runtime: "Java",
            framework,
            detectedPort: 8080,
            requiredEnvVars: Array.from(requiredEnvVars),
            warnings: ["Java runtimes typically require higher RAM allocations."],
            computeCostMonthly: 18.20, // 0.5 vCPU / 1GB RAM
            computeSpec: "0.5 vCPU / 1GB Fargate Spot"
        };
    }
};

// Open/Closed Principle: Add new detectors (Rust, Ruby, PHP) to this list anytime!
const detectorPlugins = [NodeDetector, PythonDetector, GoDetector, JavaDetector];

module.exports = { detectorPlugins };
