const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk.toString());
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log("Starting Security & Edge Case Tests...");

    // Test 1: Malformed JSON on /signup
    try {
        console.log("\n[Test 1] Malformed JSON on /signup");
        const res1 = await request({
            hostname: HOST, port: PORT, path: '/signup', method: 'POST'
        }, "{ invalid_json: true ");
        console.log(`Status: ${res1.status}, Body: ${res1.body}`);
    } catch (e) { console.error(e.message); }

    // Test 2: Missing Token on /build (should return 401 and not crash)
    try {
        console.log("\n[Test 2] Missing Token on /build");
        const res2 = await request({
            hostname: HOST, port: PORT, path: '/build', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({ repoUrl: 'test', branch: 'main', buildCommand: 'npm i', projectName: 'test' }));
        console.log(`Status: ${res2.status}, Body: ${res2.body}`);
    } catch (e) { console.error(e.message); }

    // Test 3: Large Payload (DoS attempt) on /login
    try {
        console.log("\n[Test 3] Large Payload on /login");
        const largeData = 'A'.repeat(2 * 1024 * 1024); // 2MB string
        const res3 = await request({
            hostname: HOST, port: PORT, path: '/login', method: 'POST'
        }, largeData);
        console.log(`Status: ${res3.status}, Body: ${res3.body}`);
    } catch (e) {
        console.log(`Connection likely closed due to size limit: ${e.message}`);
    }

    // Test 4: Directory Traversal on static files
    try {
        console.log("\n[Test 4] Directory Traversal attempt");
        const res4 = await request({
            hostname: HOST, port: PORT, path: '/../../../../windows/system32/cmd.exe', method: 'GET'
        });
        console.log(`Status: ${res4.status} (Should not read outside client dir)`);
    } catch (e) { console.error(e.message); }

    console.log("\nTests Complete.");
}

runTests();
