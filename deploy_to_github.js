/**
 * DMOrbit GitHub Deploy Script
 * Uploads ALL local files to GitHub → triggers Railway auto-redeploy
 * Usage: node deploy_to_github.js YOUR_GITHUB_TOKEN
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.argv[2];
const REPO_NAME = 'dmorbit-prod';
const OWNER = 'veerdata00-alt';

if (!GITHUB_TOKEN) {
    console.error('\n❌ GitHub token required!\n');
    console.log('Steps:');
    console.log('1. Go to: https://github.com/settings/tokens/new');
    console.log('2. Note: "deploy", Expiry: 7 days, Scope: repo ✓');
    console.log('3. Generate token → copy it');
    console.log('4. Run: node deploy_to_github.js ghp_YOUR_TOKEN\n');
    process.exit(1);
}

function getAllFiles(dirPath, baseDir) {
    const files = fs.readdirSync(dirPath);
    let arrayOfFiles = [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['node_modules', '.git', 'scratch', 'data', '.gemini'].includes(file)) {
                arrayOfFiles = arrayOfFiles.concat(getAllFiles(fullPath, baseDir));
            }
        } else {
            // Exclude .env, tokens, and large binary images
            if (!file.startsWith('.env') && !file.endsWith('.png') && file !== '.github_token') {
                arrayOfFiles.push(fullPath.replace(/\\/g, '/').replace(baseDir.replace(/\\/g, '/') + '/', ''));
            }
        }
    });
    return arrayOfFiles;
}

const FILES = getAllFiles('C:/Users/BBC IT HUB/DMorbit', 'C:/Users/BBC IT HUB/DMorbit');
console.log(`Found ${FILES.length} files to deploy.`);

function apiRequest(method, urlPath, body = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null;
        const req = https.request({
            hostname: 'api.github.com',
            path: urlPath,
            method,
            headers: {
                'Authorization': 'token ' + GITHUB_TOKEN,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DMOrbit-Deploy',
                ...(bodyStr ? {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(bodyStr)
                } : {})
            }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
                catch (e) { resolve({ status: res.statusCode, data: { raw: d } }); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

async function uploadFile(localRelPath, remoteRelPath) {
    const localFullPath = path.join('C:/Users/BBC IT HUB/DMorbit', localRelPath);
    
    // Check file exists
    if (!fs.existsSync(localFullPath)) {
        console.log(`  ⚠ SKIP (not found locally): ${localRelPath}`);
        return;
    }

    const content = fs.readFileSync(localFullPath, 'utf8');
    const encoded = Buffer.from(content).toString('base64');

    // Get current SHA if file exists on GitHub
    let sha;
    const existing = await apiRequest('GET', `/repos/${OWNER}/${REPO_NAME}/contents/${remoteRelPath}`);
    if (existing.status === 200) sha = existing.data.sha;
    else if (existing.status === 404) sha = undefined; // new file
    else if (existing.status === 401) { 
        console.error('  ❌ AUTH FAILED - Token invalid!');
        process.exit(1);
    }

    // Upload
    const payload = {
        message: `deploy: sync ${path.basename(remoteRelPath)} from local`,
        content: encoded,
        ...(sha ? { sha } : {})
    };

    const result = await apiRequest('PUT', `/repos/${OWNER}/${REPO_NAME}/contents/${remoteRelPath}`, payload);

    if (result.status === 200 || result.status === 201) {
        const localKb = (content.length / 1024).toFixed(1);
        console.log(`  ✅ ${remoteRelPath} (${localKb}KB)`);
    } else {
        console.error(`  ❌ FAILED: ${remoteRelPath} → ${result.status}: ${result.data.message || JSON.stringify(result.data).slice(0, 100)}`);
    }
}

async function main() {
    // Verify token
    console.log('\n🔐 Verifying GitHub token...');
    const me = await apiRequest('GET', '/user');
    if (me.status === 401) {
        console.error('❌ Invalid token. Generate a new one at: https://github.com/settings/tokens/new');
        process.exit(1);
    }
    console.log(`✅ Authenticated as: ${me.data.login}`);
    console.log(`📦 Target repo: ${OWNER}/${REPO_NAME}\n`);

    console.log('🚀 Uploading files...\n');
    
    for (const file of FILES) {
        await uploadFile(file, file);
    }

    console.log(`\n✨ Deploy complete!`);
    console.log(`🔗 Repo: https://github.com/${OWNER}/${REPO_NAME}`);
    console.log(`🚀 Railway will auto-redeploy in ~2 minutes`);
    console.log(`🌐 Live: https://web-production-dd826.up.railway.app/\n`);
}

main().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
});
