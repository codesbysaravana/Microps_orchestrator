const { chatModel } = require('../services/OllamaService');

const handleAiChat = (req, res) => {
    let body = '';
    console.log("Hit Systems");
    req.on('data', (chunk) => {
        body = body + chunk.toString();
        if (body.length > 1e6) req.destroy();
    });

    req.on('end', async () => {
        try {
            const { prompt } = JSON.parse(body);
            const streamed = await chatModel(prompt);
            res.writeHead(201, { 'Content-type': 'text/plain' });
            res.end(streamed);
        } catch (err) {
            console.log(err);
            res.writeHead(400, { 'Content-type': 'text/plain' });
            res.end("Invalid");
        }

    });
}

module.exports = { handleAiChat }