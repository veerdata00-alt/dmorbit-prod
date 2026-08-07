#!/usr/bin/env node

const path = require('path');
const { sendWebhook, getPayload } = require('./meta/webhook-engine');
const { checkEnvFile } = require('./diagnostics/env-checker');

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
    console.log(`
🚀 Assistant Operations System (AOS)

Usage:
  node operations/aos.js <command> [args]

Commands:
  webhook:dm <keyword>       Simulates a DM webhook event to localhost
  webhook:comment <keyword>  Simulates a Comment webhook event to localhost
  diag:env                   Checks the .env file for errors and trailing spaces
  review:reset-db <userId>   Wipes DB state for a specific user to prepare for App Review
  review:package             Generates instructions and prepares the Meta App Review ZIP
  browser:record <userId>    Runs Playwright to record the DMOrbit UI setup scenario
  help                       Shows this help message
    `);
}

async function run() {
    if (!command || command === 'help') {
        printHelp();
        process.exit(0);
    }

    if (command === 'webhook:dm') {
        const keyword = args[1] || 'test';
        console.log(`[AOS] Triggering Webhook: DM -> "${keyword}"`);
        const payload = getPayload('dm', keyword);
        await sendWebhook(payload, 'local');
        return;
    }

    if (command === 'webhook:comment') {
        const keyword = args[1] || 'test';
        console.log(`[AOS] Triggering Webhook: Comment -> "${keyword}"`);
        const payload = getPayload('comment', keyword);
        await sendWebhook(payload, 'local');
        return;
    }

    if (command === 'diag:env') {
        const envPath = path.join(__dirname, '../.env');
        checkEnvFile(envPath);
        return;
    }

    if (command === 'review:reset-db') {
        const userId = args[1];
        if (!userId) {
            console.error('❌ User ID is required. Example: npm run aos review:reset-db <userId>');
            process.exit(1);
        }
        const { resetDbState } = require('./testing/scenarios/db_seeder');
        await resetDbState(userId);
        return;
    }

    if (command === 'review:package') {
        const { compilePackage } = require('./meta/app-review/package_compiler');
        compilePackage();
        return;
    }

    if (command === 'browser:record') {
        const userId = args[1];
        if (!userId) {
            console.error('❌ User ID is required. Example: npm run aos browser:record <userId>');
            process.exit(1);
        }
        const { recordDashboardSetup } = require('./testing/scenarios/record_dashboard');
        await recordDashboardSetup(userId);
        return;
    }

    console.error(`❌ Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}

run();
