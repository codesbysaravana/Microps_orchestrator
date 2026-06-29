const { createServer } = require('node:http');

const { handleSignup } = require('./controllers/authController');
const { handleLogin } = require('./controllers/authController');
const { handleBuildandDeploy } = require('./controllers/buildController');
const { handleAiChat } = require('./controllers/chatController');
const { handleBuildStream } = require('./controllers/buildController');

//require is strictly for importing JavaScript and JSON.
const fs = require('fs');
//wont work const htmldocument = require("./index.html");
const path = require('path');

const hostName = 'localhost';
const PORT = 5000;

const server = createServer((req, res) => {

    console.log(req.method, req.url);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); //added after failed jwt sign

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return; //every preflight request (cors preflight request must end)

    } else if (req.url === '/health') {
        res.writeHead(200, { "Content-Type": 'text/plain' });
        res.end("Welcome to MicrOps");
    } else if (req.url === '/signup' && req.method === 'POST') {
        handleSignup(req, res);

    } else if (req.url === '/login' && req.method === 'POST') {
        handleLogin(req, res);

    } else if (req.url === "/build" && req.method === "POST") {
        handleBuildandDeploy(req, res);

    } else if (req.url === "/chat" && req.method === "POST") {
        handleAiChat(req, res);

    } else if (req.url.startsWith('/build/stream') && req.method === 'GET') {
        handleBuildStream(req, res);

    } else { //SPA refresh FALLBACK 
        if (req.method !== 'GET') {
            res.writeHead(404, { 'Content-type': 'text/plain' });
            res.end("Not Found");
            return;
        }

        return;

        /* let cleanUrl = req.url.split('?')[0];
        cleanUrl = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');

        let filePath = path.join(__dirname, '../client', cleanUrl === '/' || cleanUrl === '\\' ? 'index.html' : cleanUrl);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                filePath = path.join(__dirname, '../client/index.html');
            }

            const ext = path.extname(filePath);
            let contentType = 'text/html';
            switch (ext) {
                case '.js': contentType = 'text/javascript'; break;
                case '.css': contentType = 'text/css'; break;
                case '.json': contentType = 'application/json'; break;
                case '.png': contentType = 'image/png'; break;
                case '.jpg': contentType = 'image/jpg'; break;
                case '.svg': contentType = 'image/svg+xml'; break;
            }

            fs.readFile(filePath, (readErr, content) => {
                if (readErr) {
                    res.writeHead(500);
                    res.end(`Server Error: ${readErr.code}`);
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }); */
    }
});

server.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
}); //server binded t0 0.0.0.0 so every intereface of ipv4, v6 all checked