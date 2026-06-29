const { pool } = require('../db/pg');

/**
 * Staff Engineer Tip:
 * Run database migrations sequentially inside a single orchestrator function.
 * This guarantees parent tables (like users) exist before child tables (like projects)
 * try to create Foreign Key references.
 */
const createUserTable = async () => {
    console.log("Creating users table...");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Users table ready.");
};

const createProjectsTable = async () => {
    console.log("⏳ Creating projects table...");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            repo_url TEXT NOT NULL,
            branch VARCHAR(255) DEFAULT 'main',
            language VARCHAR(100),
            framework VARCHAR(100),
            install_command TEXT,
            build_command TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Projects table ready.");
};

const createPipelinesTable = async () => {
    console.log("Creating pipelines table...");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pipelines (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            provider VARCHAR(100) NOT NULL,
            external_pipeline_id VARCHAR(255),
            external_pipeline_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Pipelines table ready.");
};

const createBuildsTable = async () => {
    console.log("Creating builds table...");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS builds (
            id SERIAL PRIMARY KEY,
            pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
            external_build_id VARCHAR(255),
            build_number INTEGER,
            status VARCHAR(50) DEFAULT 'QUEUED',
            duration BIGINT,
            build_url TEXT,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Builds table ready.");
};

const createIndexes = async () => {
    console.log("Creating performance indexes...");
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_pipelines_project_id ON pipelines(project_id);
        CREATE INDEX IF NOT EXISTS idx_builds_pipeline_id ON builds(pipeline_id);
    `);
    console.log("Performance indexes ready.");
};

const runDatabaseSetup = async () => {
    try {
        console.log("Starting Database Setup Suite...\n");
        await createUserTable();
        await createProjectsTable();
        await createPipelinesTable();
        await createBuildsTable();
        await createIndexes();
        console.log("\nAll tables and indexes successfully created!");
    } catch (err) {
        console.error("Migration Error:", err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
};

runDatabaseSetup();