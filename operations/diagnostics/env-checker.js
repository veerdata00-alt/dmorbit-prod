const fs = require('fs');
const path = require('path');

function checkEnvFile(envPath) {
    console.log(`\n🔍 Checking Environment File: ${envPath}`);
    
    if (!fs.existsSync(envPath)) {
        console.error(`❌ ERROR: Env file not found at ${envPath}`);
        return false;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let hasErrors = false;

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Ignore empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) return;

        // Check for proper format KEY=VALUE
        if (!trimmed.includes('=')) {
            console.error(`⚠️ Line ${index + 1}: Malformed line (no '=' found) -> ${line}`);
            hasErrors = true;
            return;
        }

        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');

        // Check for trailing spaces
        if (value.endsWith(' ') || value.endsWith('\r')) {
            console.error(`⚠️ Line ${index + 1}: Trailing whitespace or carriage return found in key '${key}'`);
            hasErrors = true;
        }

        // Specific Critical Check: FB_APP_SECRET should never have spaces
        if (key === 'FB_APP_SECRET' || key === 'APP_SECRET') {
            if (value !== value.trim()) {
                console.error(`❌ CRITICAL ERROR: App Secret has whitespace! This will break webhook signatures.`);
                hasErrors = true;
            }
        }
    });

    if (!hasErrors) {
        console.log(`✅ Environment file looks clean!`);
        return true;
    } else {
        console.error(`❌ Found issues in ${envPath}. Please fix them.`);
        return false;
    }
}

module.exports = {
    checkEnvFile
};
