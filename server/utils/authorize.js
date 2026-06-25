const jwt = require("jsonwebtoken");
require("dotenv").config();

const authorize = (req) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    console.log(req.headers.authorization.split(" ")[1]);
    if(!authHeader) {
        return false;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.decode(token, process.env.JWT_SECRET);
        console.log("DECODED: "+decoded);
        return decoded;
    } catch (err) {
        console.log(err);
        console.log("Unauthorzied User");
    }
}

module.exports = { authorize };