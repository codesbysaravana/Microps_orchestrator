const { createUser } = require('../db/pg');
const { hashPass } = require('../utils/hashPassword');

const signup = async (name, email, password) => {
    try {
        const hashedPass = await hashPass(password);
        const res = await createUser(name, email, hashedPass);

        if(res) {
            return true;
        } else {
            return false;
        }
    } catch(err) {
        console.log(err);
        return false;
    }
}

module.exports = { signup };    