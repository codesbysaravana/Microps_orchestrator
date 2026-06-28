//for checking the hash
const bcrypt = require('bcrypt');

const jwt = require("jsonwebtoken");
const { fetchUser } = require('../repository/userRepository');
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

async function createJWT(username, password) { //since fetchUser is a async func it returns a promise
    const user = await fetchUser(username);
    //console.log(JWT_SECRET);

    if (user === null) {
        return "Invalid";
    }
    //    console.log(username);
    //  console.log(user.email);  
    //console.log(password);
    //console.log(user.password_hash);
    const match = await bcrypt.compare(password, user.password_hash); //fetched password and current password
    if (!match) {
        return "Invalid";
    } else {
        const token = jwt.sign(
            {
                userId: user.id, //id fetch from db
                //password: user.password_hash,
                email: user.email,
                role: "USER",
            },
            JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return token;

    }

    return "Invalid";
}

module.exports = { createJWT };

//create JWT  super secret key
// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

//make sure THEJWT PAYLOAD HAS THE USERID FOR EXTRACTING IT FOR THE DB

