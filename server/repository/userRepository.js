const { pool } = require('../db/pg');

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
        return true;
    } catch (err) {
        console.log(err.stack);
        return false;
    }
}


async function fetchUser(email) {
    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 OR name = $1`,
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

module.exports = { createUser, fetchUser }
