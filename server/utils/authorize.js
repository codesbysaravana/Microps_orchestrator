const jwt = require("jsonwebtoken");
require("dotenv").config();

const authorize = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return false;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("VERIFIED USER:", decoded);
        return decoded;
    } catch (err) {
        console.log(err);
        console.log("Unauthorzied User");
    }
}

module.exports = { authorize };