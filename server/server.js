const { createServer } = require('node:http');
const { jenkinsInit } = require('./services/BuildJenkins');
const { chatModel } = require('./services/OllamaService');
const { createJWT } = require('./utils/jwt');
const { authorize } = require('./utils/authorize')
const { signup } = require('./services/SignUp');

const hostName = 'localhost';
const PORT = 5000;

const server = createServer((req, res) => {

    console.log(req.method, req.url);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); //added after failed jwt sign

    if(req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if(req.url === '/' || req.url === '/health') {
        res.writeHead(200, {"Content-Type": 'text/plain'});
        res.end("Welcome to MicrOps");
    } else if (req.url === '/signup' && req.method === 'POST') {
        console.log("Login");
        let body = '';

        req.on('data', (chunk) => {
            body = body + chunk.toString();
        })

        req.on('end', async () => {
            const data = JSON.parse(body);
            const { name, email, password } = data;
            const response = await signup(name, email, password);
            if (response) {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({success: true}));
            } else {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Signup failed');
            }
        })
    } else if(req.url === '/login' && req.method === 'POST') {
        console.log("Logging In Start");
        let body = '';
        req.on('data', (chunk) => {
            body = body + chunk.toString();
        })

        req.on('end', async () => {
            try {
                const creds = JSON.parse(body);
                const {username, password} = creds;
                console.log(creds);
                const token = await createJWT(username, password);
                if(token === "Invalid") {
                    res.writeHead(401, {'Content-Type': 'text/plain'});
                    res.end("Invalid Credentials");
                } else {
                    console.log(token); //just checking
                    res.writeHead(201, {'Content-Type': 'text/plain'});
                    res.end(token);
                }
            } catch (err) {
                console.log(err);
            }
        });
        
    } else if(req.url === "/build" && req.method === "POST") {
        let body = '';
        console.log("Hit systems 1.0");
        req.on('data', (chunk) => {
            body = body + chunk.toString();
        });

        req.on('end', async () => {
            try {
                const clientRes = JSON.parse(body);
                const{repoUrl, branch, buildCommand, projectName} = clientRes;
                /* const authHeader = req.headers.authorization;
                const token = authHeader.split(" ")[1]; //get space after Bearer */
                
                const user = await authorize(req); //w
                
                if(!user) {
                    res.writeHead(401, {"content-Type": "text/plain"});
                    res.sendDate("Unauthorized User");
                }

                const userId = user.userId; //from jwt token alone as we signned with these id and pass

                await jenkinsInit(userId, repoUrl, branch, buildCommand, projectName);
                res.writeHead(201, {'Content-Type': 'text/plain'});
                res.end("Build Started");
            } catch (err) {
                console.log(err);
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });

                res.end("Server Error");
            }
        })
    } else if(req.url === "/chat" && req.method === "POST") {
        let body = '';
        console.log("Hit Systems");
        req.on('data', (chunk) => {
            body = body + chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { prompt } = JSON.parse(body);
                const streamed = await chatModel(prompt);
                res.writeHead(201, {'Content-type': 'text/plain'});
                res.end(streamed);
            } catch (err) {
                console.log(err);
                res.writeHead(400, {'Content-type': 'text/plain'});
                res.end("Invalid");
            }

        });
    } else {
        res.writeHead(404, {'Content-type': 'text/plain'});
        res.end("Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
}); //server binded t0 0.0.0.0 so every intereface of ipv4, v6 all checked