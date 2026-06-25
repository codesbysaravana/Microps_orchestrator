const { Pool } = require('pg');

// Configure the pool with database credentials
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'microps',
  password: '1111',
  port: 5432,
});

async function queryDatabase() {
  try {
    const res = await pool.query('SELECT NOW()');
    //console.log('Current Time:', res.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.stack);
  } finally {
    await pool.end();
  }
}

async function createUser(name, email, hashedpassword) {
  try {
    const now = new Date();
    
    const result = await pool.query(
      `INSERT INTO users
       (name, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [name, email, hashedpassword]
    )
    //console.log(result);
    fetchUser(email);
    return true;
  } catch (err) {
    console.log(err.stack);
    return false;
  }
}


async function fetchUser(email) {
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    //console.log(result);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];

  } catch (err) {
    console.log(err);
    return null;
  }
}

//user format --> user.rows[0].email

//store
async function projectsDB(userId, repoUrl, branch, language, framework, installCommand, buildCommand, projectName) {
  const date = new Date();

  const projectStore = await pool.query(`
    INSERT INTO projects
    (user_id, name, repo_url, branch, language, framework, install_command, build_command, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id
    `, [userId, projectName, repoUrl, branch, language, framework, installCommand, buildCommand]
  )

  console.log(projectStore.rows[0]);
}


async function fetchProjects(userId, projectsId) {

  try {
    const user = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if(user.rows.length === 0) {
      console.log("false");
      return false;
    }

    const project = await pool.query(`SELECT id FROM projects WHERE id = $1`, [projectsId]);
    if(project.rows.length === 0) {
      console.log("false");
      return false;
    }
    
    console.log(project);
    return project;

  } catch (err)  {
    console.log("false");
    console.log(err);
    return false;
  }
}

//fetchProjects(1, 2);

/* const createDockerTable = () => {
  try {
    const data = await pool.query(`CREATE TABLE docker_images (
        project_id
        image_name
        image_tag
        image_uri
        created_at  
      )`)
  } catch(err) {
    console.log(err);
  }
} */

module.exports = { createUser, fetchUser, projectsDB };