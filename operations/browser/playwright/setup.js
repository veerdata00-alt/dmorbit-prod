const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

class BrowserManager {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    /**
     * Launch a new Chromium browser context, optionally with video recording enabled.
     * @param {Object} options 
     * @param {boolean} options.recordVideo 
     * @param {string} options.scenarioName 
     */
    async launch(options = {}) {
        const { recordVideo, scenarioName = 'default_scenario' } = options;

        this.browser = await chromium.launch({
            headless: true, // Run headful for debugging if needed: headless: false
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const contextOptions = {
            viewport: { width: 1920, height: 1080 }
        };

        if (recordVideo) {
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
            const videoDir = path.join(__dirname, `../../evidence/archive/${dateStr}_${scenarioName}`);
            fs.mkdirSync(videoDir, { recursive: true });
            
            contextOptions.recordVideo = {
                dir: videoDir,
                size: { width: 1920, height: 1080 }
            };
            console.log(`🎥 Video recording enabled. Saving to: ${videoDir}`);
        }

        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
        return this.page;
    }

    /**
     * Closes the browser gracefully, ensuring videos are flushed and saved.
     */
    async close() {
        if (this.page) await this.page.close();
        if (this.context) await this.context.close();
        if (this.browser) await this.browser.close();
        console.log('✅ Browser closed successfully.');
    }

    /**
     * Emergency rescue to capture a trace or screenshot before closing if something fails.
     */
    async rescue(errorMsg) {
        console.error(`❌ Rescue Triggered: ${errorMsg}`);
        if (this.page) {
            const failPath = path.join(__dirname, `../../evidence/failed_step_${Date.now()}.png`);
            await this.page.screenshot({ path: failPath, fullPage: true });
            console.log(`📸 Failure screenshot saved to: ${failPath}`);
        }
        await this.close();
    }
}

module.exports = { BrowserManager };
