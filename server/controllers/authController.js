const { signup } = require('../services/SignUp');
const { createJWT } = require('../utils/jwt');

const handleSignup = (req, res) => {
    console.log("Login");
    let body = '';

    req.on('data', (chunk) => {
        body = body + chunk.toString();
        if (body.length > 1e6) req.destroy(); //added security for req limit
    })

    req.on('end', async () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid JSON');
            return;
        }
        const { name, email, password } = data;
        const response = await signup(name, email, password);
        if (response) {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('Signup failed');
        }
    })
}

const handleLogin = (req, res) => {
    console.log("Logging In Start");
    let body = '';
    req.on('data', (chunk) => {
        body = body + chunk.toString();
        if (body.length > 1e6) req.destroy();
    })

    req.on('end', async () => {
        try {
            const creds = JSON.parse(body);
            const { username, password } = creds;
            console.log(creds);
            const token = await createJWT(username, password);
            if (token === "Invalid") {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end("Invalid Credentials");
            } else {
                console.log(token); //just checking
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end(token);
            }
        } catch (err) {
            console.log(err);
        }
    });
}

module.exports = { handleSignup, handleLogin }