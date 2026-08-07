const fs = require('fs');
const lines = fs.readFileSync('c:\\Users\\BBC IT HUB\\DMorbit\\server.js', 'utf8').split('\n');
const results = [];
lines.forEach((line, i) => {
    if (line.includes('const verifySignature') || line.includes('function verifySignature')) {
        // grab 20 lines
        results.push(lines.slice(Math.max(0, i-2), i+20).join('\n'));
    }
});
fs.writeFileSync('c:\\Users\\BBC IT HUB\\DMorbit\\scratch\\search_results.txt', results.join('\n\n=====\n\n'));
