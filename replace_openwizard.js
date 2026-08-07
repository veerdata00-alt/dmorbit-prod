const fs = require('fs');
let code = fs.readFileSync('public/dashboard.js', 'utf8');

code = code.replace(/window\.openWizard\(\)/g, "window.switchTab('builder')");

fs.writeFileSync('public/dashboard.js', code, 'utf8');
