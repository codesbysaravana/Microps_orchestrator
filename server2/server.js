const { createServer } = require("node:http");
const { connectNotion } = require("./services/NotionService");

const PORT = '5000';

const server = createServer((req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*'); // Or 'http://localhost:3000'
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log(req.url);
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);

    if(req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end('Success Server Breach Bastardo');
    }

    else if(req.url === '/') {
        res.writeHead(200);
        res.end("Welcome to Notion Connnector");
    }

    else if(req.url === "/connect" && req.method === "POST") {
        let data = '';

        req.on('data', (chunk) => {
            data = data + chunk.toString();
        });

        req.on('end', async () => {
            try {
                const datason = await JSON.parse(data);
                console.log(datason);
                console.log(datason.notionDB);

                const responseNotion = await connectNotion(datason.notionToken, datason.notionDB);
                const stringRes = await JSON.stringify(responseNotion);
                res.writeHead(200, {'Content-Type': 'text/json'});
                res.end(stringRes);
            } catch (err) {
                console.log(err);
                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.end("Error");
            }
        })
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log("PORT running");
})

//res.writeHead(201, {'Content-Type': 'text/plain'});
//res.end("Build Started");

/* res.writeHead(200, {
    'Content-Type': 'application/json'
});

res.end(JSON.stringify({
    success: true,
    message: 'Connected'
})); */