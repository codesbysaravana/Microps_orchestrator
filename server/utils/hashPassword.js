const bcrypt = require('bcrypt');

async function hashPass(password) {
    const salt = 12;
    const hashed = await bcrypt.hash(password, salt);
    
    return hashed;
}

module.exports = {hashPass};