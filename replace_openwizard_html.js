const fs = require('fs');
let code = fs.readFileSync('public/dashboard.html', 'utf8');

code = code.replace(/window\.openWizard\(\)/g, "window.switchTab('builder')");

fs.writeFileSync('public/dashboard.html', code, 'utf8');
