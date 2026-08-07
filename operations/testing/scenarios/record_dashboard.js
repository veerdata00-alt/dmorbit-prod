const { BrowserManager } = require('../../browser/playwright/setup');
const { resetDbState } = require('./db_seeder');

/**
 * Automates the DMOrbit Dashboard to record a video for Meta App Review.
 * @param {string} userId - The user ID to reset DB state for
 */
async function recordDashboardSetup(userId) {
    if (!userId) {
        console.error('❌ Error: userId is required for recording scenario.');
        process.exit(1);
    }

    console.log(`\n🎬 Starting Dashboard Recording Scenario for user ${userId}...`);
    
    // 1. Wipe DB to ensure a clean state
    const dbClean = await resetDbState(userId);
    if (!dbClean) process.exit(1);

    const manager = new BrowserManager();

    try {
        // 2. Launch browser with video recording ON
        const page = await manager.launch({ recordVideo: true, scenarioName: 'Dashboard_Setup' });

        // 3. Navigate to localhost
        console.log('🌐 Navigating to localhost:3000...');
        await page.goto('http://localhost:3000');
        
        // --- TODO: Authentication Bypass / Login Flow ---
        // (For production usage, inject a dev token into localStorage here, 
        // or execute a headless login flow if a test account is provided).
        
        // 4. Simulate User Journey for "instagram_manage_messages" permission
        console.log('🤖 Automating UI interactions...');
        
        // Example UI interactions (to be refined based on actual DOM selectors):
        // await page.click('text=Log in');
        // await page.waitForURL('**/campaigns');
        
        // await page.click('text=Create Campaign');
        // await page.fill('input[placeholder="Enter keyword"]', 'pdf');
        // await page.fill('textarea[placeholder="DM Reply"]', 'Here is your file!');
        // await page.click('text=Save & Activate');
        
        // Wait for visual confirmation toast
        // await page.waitForSelector('text=Campaign Activated');

        // Allow 2 seconds at the end for the video to capture the final state
        await page.waitForTimeout(2000);
        console.log('✅ Scenario completed successfully.');

    } catch (error) {
        await manager.rescue(error.message);
    } finally {
        await manager.close();
    }
}

module.exports = { recordDashboardSetup };

// Allow executing directly via CLI
if (require.main === module) {
    const userId = process.argv[2];
    recordDashboardSetup(userId);
}
