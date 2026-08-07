const fs = require('fs');

const code = fs.readFileSync('c:\\Users\\BBC IT HUB\\DMorbit\\server.js', 'utf8');
const lines = code.split('\n');

const routes = [];
const endpoints = ['app.get', 'app.post', 'app.put', 'app.delete', 'app.patch', 'app.use'];

lines.forEach((line, i) => {
    for (let ep of endpoints) {
        if (line.includes(ep)) {
            routes.push(`${i + 1}: ${line.trim()}`);
            break;
        }
    }
});

fs.writeFileSync('c:\\Users\\BBC IT HUB\\DMorbit\\scratch\\routes_audit.txt', routes.join('\n'));
console.log(`Found ${routes.length} routes. Written to scratch/routes_audit.txt`);
