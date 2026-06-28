//store projects
async function projectsDB(userId, repoUrl, branch, language, framework, installCommand, buildCommand, projectName) {
    const date = new Date();

    const projectStore = await pool.query(`
    INSERT INTO projects
    (user_id, name, repo_url, branch, language, framework, install_command, build_command, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id
    `, [userId, projectName, repoUrl, branch, language, framework, installCommand, buildCommand]
    )

    console.log(projectStore.rows[0]);
    return projectStore.rows[0];
}


async function fetchProjects(userId, projectsId) {

    try {
        const user = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
        if (user.rows.length === 0) {
            console.log("false");
            return false;
        }

        const project = await pool.query(`SELECT id FROM projects WHERE id = $1`, [projectsId]);
        if (project.rows.length === 0) {
            console.log("false");
            return false;
        }

        console.log(project);
        return project;

    } catch (err) {
        console.log("false");
        console.log(err);
        return false;
    }
}

module.exports = { projectsDB, fetchProjects }