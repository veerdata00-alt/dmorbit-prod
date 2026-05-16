const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

class BrowserManager {
    constructor() {
        this.profilesDir = path.join(__dirname, '..', 'data', 'browser_profiles');
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
        
        // Track running browser contexts to allow idle shutdown
        this.activeContexts = new Map();
        
        // Memory monitoring
        this.stats = {
            launches: 0,
            closures: 0
        };
    }

    getProfilePath(userId) {
        return path.join(this.profilesDir, `user_${userId}`);
    }

    async getOrCreateSession(userId) {
        // If already running, return it and reset idle timer
        if (this.activeContexts.has(userId)) {
            const session = this.activeContexts.get(userId);
            this._resetIdleTimer(userId);
            return session;
        }

        console.log(`[BROWSER] Launching lightweight temporary session for user ${userId}`);
        this.stats.launches++;

        const userDataDir = this.getProfilePath(userId);

        // Low RAM Optimized Launch
        const context = await chromium.launchPersistentContext(userDataDir, {
            headless: true, // Always headless for low RAM
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Highly reduces memory, but slightly less stable. Great for Free Tier.
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ]
        });

        const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

        const session = {
            context,
            page,
            userId,
            isClosing: false
        };

        this.activeContexts.set(userId, session);
        this._resetIdleTimer(userId);

        return session;
    }

    _resetIdleTimer(userId) {
        const session = this.activeContexts.get(userId);
        if (!session) return;

        if (session.idleTimer) {
            clearTimeout(session.idleTimer);
        }

        // Close browser after 2 minutes of inactivity to save RAM
        session.idleTimer = setTimeout(async () => {
            console.log(`[BROWSER] Idle timeout reached for user ${userId}. Shutting down to save RAM.`);
            await this.closeSession(userId);
        }, 2 * 60 * 1000); 
    }

    async closeSession(userId) {
        const session = this.activeContexts.get(userId);
        if (!session || session.isClosing) return;

        session.isClosing = true;
        if (session.idleTimer) clearTimeout(session.idleTimer);

        try {
            await session.context.close();
            console.log(`[BROWSER] Successfully closed session for user ${userId}. RAM freed.`);
        } catch (e) {
            console.error(`[BROWSER] Error closing session for user ${userId}:`, e.message);
        } finally {
            this.activeContexts.delete(userId);
            this.stats.closures++;
        }
    }

    async closeAll() {
        console.log(`[BROWSER] Emergency shutdown of all active sessions...`);
        const promises = [];
        for (const userId of this.activeContexts.keys()) {
            promises.push(this.closeSession(userId));
        }
        await Promise.all(promises);
    }

    getMemoryStats() {
        return {
            activeBrowsers: this.activeContexts.size,
            estimatedRamMB: this.activeContexts.size * 120, // rough estimate: ~120MB per lightweight headless chromium
            totalLaunches: this.stats.launches,
            totalClosures: this.stats.closures
        };
    }
}

module.exports = new BrowserManager();
