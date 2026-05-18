const crypto = require('crypto');
const browserManager = require('./BrowserManager');
const User = require('mongoose').model('User');
const InstagramAccount = require('mongoose').model('InstagramAccount'); // Optional if we still use this model

class LoginPortal {
    constructor(wss) {
        this.wss = wss;
        this.activeStreams = new Map(); // sessionId -> { page, context, interval, userId }

        this.wss.on('connection', (ws, req) => {
            console.log('[PORTAL] New WebSocket connection attempt...');
            
            let currentSessionId = null;

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.type === 'init') {
                        currentSessionId = data.sessionId;
                        if (this.activeStreams.has(currentSessionId)) {
                            this.activeStreams.get(currentSessionId).ws = ws;
                            console.log(`[PORTAL] Stream ${currentSessionId} connected via WS.`);
                            this.startStreaming(currentSessionId);
                        } else {
                            ws.send(JSON.stringify({ type: 'error', message: 'Invalid session ID' }));
                            ws.close();
                        }
                    } 
                    
                    else if (data.type === 'interaction') {
                        const stream = this.activeStreams.get(currentSessionId);
                        if (!stream) return;
                        
                        const { action, payload } = data;
                        
                        if (action === 'click') {
                            await stream.page.mouse.click(payload.x, payload.y);
                        } else if (action === 'type') {
                            // Typing handled character by character or as string
                            if (payload.key.length === 1) {
                                await stream.page.keyboard.type(payload.key);
                            } else {
                                await stream.page.keyboard.press(payload.key);
                            }
                        }
                    }
                } catch (e) {
                    console.error('[PORTAL] WS Message Error:', e.message);
                }
            });

            ws.on('close', () => {
                if (currentSessionId) {
                    this.stopStreaming(currentSessionId);
                    console.log(`[PORTAL] Stream ${currentSessionId} disconnected.`);
                }
            });
        });
    }

    async initiateLogin(userId) {
        const sessionId = crypto.randomUUID();
        console.log(`[PORTAL] Initiating login for user ${userId}. Session: ${sessionId}`);

        try {
            // Get or launch a persistent session for this user
            const session = await browserManager.getOrCreateSession(userId);
            const page = session.page;

            this.activeStreams.set(sessionId, {
                userId,
                page,
                context: session.context,
                ws: null,
                streamInterval: null,
                checkInterval: null
            });

            // Navigate to Instagram Login
            await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 60000 });

            // Start background login detection
            this.startLoginDetection(sessionId);

            return sessionId;

        } catch (error) {
            console.error('[PORTAL] Failed to initiate login:', error.message);
            this.cleanupSession(sessionId);
            throw new Error('Failed to launch browser session.');
        }
    }

    startStreaming(sessionId) {
        const stream = this.activeStreams.get(sessionId);
        if (!stream || !stream.ws) return;

        // Stream screenshots at ~10 FPS
        stream.streamInterval = setInterval(async () => {
            try {
                if (stream.ws.readyState === 1 /* OPEN */) {
                    const buffer = await stream.page.screenshot({ type: 'jpeg', quality: 50 });
                    const base64 = buffer.toString('base64');
                    stream.ws.send(JSON.stringify({ type: 'frame', image: `data:image/jpeg;base64,${base64}` }));
                }
            } catch (e) {
                // Ignore transient screenshot errors while navigating
            }
        }, 100);
    }

    stopStreaming(sessionId) {
        const stream = this.activeStreams.get(sessionId);
        if (stream && stream.streamInterval) {
            clearInterval(stream.streamInterval);
            stream.streamInterval = null;
        }
    }

    startLoginDetection(sessionId) {
        const stream = this.activeStreams.get(sessionId);
        if (!stream) return;

        // Check every 3 seconds if login was successful
        stream.checkInterval = setInterval(async () => {
            try {
                // Detection mechanism: look for Home icon or profile pic (indicates logged in state)
                const isLoggedIn = await stream.page.locator('svg[aria-label="Home"]').isVisible({ timeout: 1000 }).catch(() => false);
                const isSaveInfo = await stream.page.getByRole('button', { name: 'Save info' }).isVisible({ timeout: 1000 }).catch(() => false);
                
                if (isSaveInfo) {
                    console.log(`[PORTAL] Detected 'Save Info' prompt. Auto-clicking...`);
                    await stream.page.getByRole('button', { name: 'Save info' }).click();
                }

                if (isLoggedIn) {
                    console.log(`[PORTAL] Login SUCCESS detected for session ${sessionId}`);
                    
                    // Update User DB
                    await User.findByIdAndUpdate(stream.userId, { instagramConnected: true });
                    
                    // Mark InstagramAccount as active
                    await InstagramAccount.findOneAndUpdate(
                        { userId: stream.userId },
                        { 
                            status: 'active',
                            updatedAt: new Date()
                        },
                        { upsert: true }
                    );

                    if (stream.ws && stream.ws.readyState === 1) {
                        stream.ws.send(JSON.stringify({ type: 'success', message: 'Instagram Connected Successfully!' }));
                    }

                    // Cleanup stream but keep browser session alive for a bit (or let idle timer handle it)
                    this.cleanupSession(sessionId);
                }
            } catch (e) {
                // Silent catch
            }
        }, 3000);
    }

    cleanupSession(sessionId) {
        const stream = this.activeStreams.get(sessionId);
        if (stream) {
            if (stream.streamInterval) clearInterval(stream.streamInterval);
            if (stream.checkInterval) clearInterval(stream.checkInterval);
            if (stream.ws && stream.ws.readyState === 1) stream.ws.close();
            this.activeStreams.delete(sessionId);
            console.log(`[PORTAL] Cleaned up stream session ${sessionId}`);
        }
    }
}

module.exports = LoginPortal;
