const { authorize } = require('../utils/authorize');
const { buildInitializer } = require('../services/BuildService');
const { buildBus } = require('../utils/eventBus');

const handleBuildandDeploy = (req, res) => {
    let body = '';
    console.log("Hit systems 1.0");
    req.on('data', (chunk) => {
        body = body + chunk.toString();
        if (body.length > 1e6) req.destroy();
    });

    req.on('end', async () => {
        try {
            const clientRes = JSON.parse(body);
            const { repoUrl, branch, buildCommand, projectName } = clientRes;
            /* const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1]; //get space after Bearer */

            const user = await authorize(req); //w

            if (!user) {
                res.writeHead(401, { "content-Type": "text/plain" });
                res.end("Unauthorized User");
                return;
            }

            const userId = user.userId; //from jwt token alone as we signned with these id and pass

            await buildInitializer(userId, repoUrl, branch, buildCommand, projectName);
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end("Build Started");
        } catch (err) {
            console.log(err);
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });

            res.end("Server Error");
        }
    })
}

const handleBuildStream = (req, res) => { //listen for evetns and push to browser
    try {
        const listener = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }

        buildBus.on('build-progress', listener);

        req.on("close", () => {
            buildBus.off('build-progress', listener);
        });

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
    } catch (err) {
        console.log(err);
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end("Server Error");
    }
}

module.exports = { handleBuildandDeploy, handleBuildStream }