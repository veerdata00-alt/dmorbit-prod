require('dotenv').config();
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const browserManager = require('./browser/BrowserManager');

// Fix for environments where crypto might not be globally available
global.crypto = crypto;

console.log("🚀 Server starting at:", new Date().toISOString());
console.log("Node version:", process.version);
const app = express();

// ── Firebase Client Config (served to frontend) ──
const FIREBASE_CLIENT_CONFIG = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID
};
const admin = require('firebase-admin');

// ── Initialize Firebase Admin SDK ──
// Uses service account JSON file for proper token verification (required for verifyIdToken)
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
let firebaseAdminReady = false;

try {
    let serviceAccount = null;

    // Priority 1: Load from environment variable (for Railway/cloud deployments)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            console.log("Firebase service account loaded from FIREBASE_SERVICE_ACCOUNT_JSON env var");
        } catch (parseErr) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseErr.message);
        }
    }

    // Priority 2: Load from file (for local development)
    if (!serviceAccount) {
        const serviceAccountAbsPath = path.resolve(__dirname, SERVICE_ACCOUNT_PATH);
        if (fs.existsSync(serviceAccountAbsPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountAbsPath, 'utf8'));
            console.log("Firebase service account loaded from file:", SERVICE_ACCOUNT_PATH);
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
        firebaseAdminReady = true;
        console.log("Firebase Admin initialized with service account ✅");
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'dmorbit-auth') {
        // Fallback: init without service account (limited functionality)
        admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
        firebaseAdminReady = true;
        console.log("Firebase Admin initialized (without service account — verifyIdToken may fail) ⚠️");
    } else {
        console.warn("⚠️  Firebase Service Account missing. Token verification will be disabled.");
        console.warn("   → Add FIREBASE_SERVICE_ACCOUNT_JSON to Railway variables");
        firebaseAdminReady = false; 
    }
} catch (e) {
    console.error("Firebase Admin init failed:", e.message);
    firebaseAdminReady = false;
}
console.log("Webhook endpoint active");

// Structured Logger
const logger = {
    info: (msg, meta = {}) => console.log(`[INFO] ${new Date().toISOString()} | ${msg}`, Object.keys(meta).length ? meta : ''),
    warn: (msg, meta = {}) => console.warn(`[WARN] ${new Date().toISOString()} | ${msg}`, Object.keys(meta).length ? meta : ''),
    error: (msg, meta = {}) => console.error(`[ERROR] ${new Date().toISOString()} | ${msg}`, Object.keys(meta).length ? meta : ''),
    webhook: (msg, meta = {}) => console.log(`[WEBHOOK] ${new Date().toISOString()} | ${msg}`, meta)
};

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key'; 
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'dmorbitapp@gmail.com').trim().toLowerCase();
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'dmorbitapp@gmail.com').trim().toLowerCase();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'dmorbit_verify_token_123';
const APP_SECRET = process.env.FB_APP_SECRET || process.env.APP_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const IS_PRODUCTION = process.env.PRODUCTION === 'true';

console.log(`🌍 MODE: ${IS_PRODUCTION ? '🚀 PRODUCTION' : '🛠️ DEVELOPMENT'}`);
console.log(`🔗 APP URL: ${APP_URL}`);
// MongoDB Connection
console.log("Connecting to MongoDB Cluster:", process.env.MONGO_URI ? process.env.MONGO_URI.split('@')[1] : "NOT FOUND");
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected successfully");
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err.message);
        if (err.reason) console.error("   Reason:", err.reason);
        if (err.code) console.error("   Code:", err.code);
    });

// --- Mongoose Schemas ---

const jobSchema = new mongoose.Schema({
    automationId: String,
    userId: String,          // Automation owner (DMOrbit user)
    username: String,
    user_id: { type: String, index: true }, // Commenter/Sender IG ID
    platform: String,
    message: String,
    type: { type: String, default: 'send_dm' }, // reply_comment | send_dm
    process_after: { type: Number, index: true },
    metadata: mongoose.Schema.Types.Mixed,
    status: { type: String, index: true, default: 'pending' },
    delivery_status: { type: String, enum: ['sent', 'not_delivered', 'pending'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    error: String,
    createdAt: { type: Date, default: Date.now }
});
const Job = mongoose.model('Job', jobSchema);

const logSchema = new mongoose.Schema({
    username: String,
    user_id: { type: String, index: true },
    ownerId: { type: String, index: true },
    keyword: String,
    dmLink: String,
    metadata: mongoose.Schema.Types.Mixed,
    platform: String,
    commentCount: { type: Number, default: 0 },
    dmCount: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

// --- Flow Engine Schemas ---

const flowStepSchema = new mongoose.Schema({
    order: { type: Number, required: true },
    type: { type: String, enum: ['send_dm', 'wait_reply', 'delay'], required: true },
    message: String,
    delay_minutes: Number,
    cta_url: String
});

const flowSchema = new mongoose.Schema({
    userId: { type: String, index: true, required: true },
    name: { type: String, required: true },
    steps: [flowStepSchema],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const Flow = mongoose.model('Flow', flowSchema);

const flowStateSchema = new mongoose.Schema({
    flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', index: true },
    automationId: { type: mongoose.Schema.Types.ObjectId, index: true },
    ownerId: { type: String, index: true },
    ig_user_id: { type: String, index: true },
    currentStep: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'expired', 'stopped'], default: 'active', index: true },
    lastActivity: { type: Date, default: Date.now, index: true },
    nextSendAt: { type: Date, index: true },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});
const FlowState = mongoose.model('FlowState', flowStateSchema);

const automationSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    name: { type: String, default: 'Untitled Automation' },
    platform: { type: String, default: 'instagram' },
    target: {
        type: { type: String, enum: ['global', 'specific'], default: 'global' },
        mediaId: { type: String, index: true }, // Specific Post/Reel ID
        mediaUrl: String,
        mediaThumbnail: String
    },
    mode: { type: String, enum: ['keyword', 'any_comment'], default: 'keyword' },
    trigger: {
        type: { type: String, default: 'comment' },
        keywords: [String]
    },
    actions: [{
        type: { type: String },
        text: String
    }],
    flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', default: null },
    triggerCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    
    // New simplified fields for backward/alternative compatibility
    postId: { type: String, index: true },
    triggerType: { type: String, enum: ['KEYWORD', 'ANY_COMMENT'] },
    keyword: String,
    listenerType: { type: String, enum: ['MESSAGE', 'SMART_AI'], default: 'MESSAGE' },
    aiPrompt: { type: String, default: '' },
    publicReplyText: String,
    privateMessageText: String
});
const Automation = mongoose.model('Automation', automationSchema);

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: { type: String },
    firebaseId: { type: String, index: true },
    profilePicture: String,
    name: { type: String },
    role: { type: String, default: 'user' },
    plan: { type: String, enum: ['FREE', 'BASIC', 'PRO', 'free', 'pro'], default: 'FREE' },
    dmCountThisMonth: { type: Number, default: 0 },
    instagramConnected: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const followupSchema = new mongoose.Schema({
    user_id: { type: String, index: true },
    ownerId: { type: String, index: true }, // The DMOrbit User ID
    message: { type: String },
    send_after: { type: Date, index: true },
    status: { type: String, default: 'pending', index: true },
    intent: { type: String, enum: ['high', 'medium', 'low', 'default'], default: 'default' },
    createdAt: { type: Date, default: Date.now }
});
const Followup = mongoose.model('Followup', followupSchema);

const otpSchema = new mongoose.Schema({
    email: { type: String, index: true },
    code: { type: String },
    expiresAt: { type: Date, index: true },
    createdAt: { type: Date, default: Date.now }
});
const Otp = mongoose.model('Otp', otpSchema);

const webhookLogSchema = new mongoose.Schema({
    payload: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
    source: String,
    timestamp: { type: Date, default: Date.now }
});
const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);

const webhookEventSchema = new mongoose.Schema({
    eventId: { type: String, unique: true, index: true },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
    error: String,
    createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete after 7 days
});
const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

const instagramAccountSchema = new mongoose.Schema({
    userId: { type: String, unique: true, index: true },
    page_id: String,
    instagram_id: String,
    access_token: String,
    status: { type: String, enum: ['active', 'expired', 'invalid', 'reconnect_recommended', 'paused'], default: 'active' },
    safeMode: { type: Boolean, default: true }, // Default ON for Beta
    lastChecked: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const InstagramAccount = mongoose.model('InstagramAccount', instagramAccountSchema);

// --- Helper: Detect User Intent ---
const detectIntent = (text = "") => {
    const lowerText = text.toLowerCase();
    
    const highIntentKeywords = ["price", "kitna", "cost", "buy", "purchase"];
    const mediumIntentKeywords = ["link", "details", "info", "more", "how"];

    if (highIntentKeywords.some(kw => lowerText.includes(kw))) return "high";
    if (mediumIntentKeywords.some(kw => lowerText.includes(kw))) return "medium";
    
    return "low";
};

// --- Helper: Cancel Pending Followups (User is Active) ---
const cancelPendingFollowups = async (user_id) => {
    try {
        const result = await Followup.updateMany(
            { user_id: user_id, status: "pending" },
            { $set: { status: "cancelled" } }
        );
        if (result.modifiedCount > 0) {
            console.log(`[FOLLOWUP CANCELLED] User: ${user_id} | Count: ${result.modifiedCount}`);
        }
    } catch (err) {
        console.error(`[ERROR] Failed to cancel followups for ${user_id}:`, err);
    }
};

app.use(cors());
// Need raw body for Meta signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cookieParser());

// ── Firebase Admin Helper ──
const isHtmlRequest = (req) => req.headers.accept && req.headers.accept.includes('text/html');

// Middleware to verify JWT
const authenticateToken = async (req, res, next) => {
    let token = req.cookies.token;
    
    // Fallback to Authorization Header
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // Fallback to Query String (useful for <a> links)
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        if (isHtmlRequest(req)) return res.redirect('/');
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    try {
        if (firebaseAdminReady) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                const email = decodedToken.email.trim().toLowerCase();
                
                let user = await User.findOne({ email });
                if (!user) {
                    console.log(`[AUTH] Syncing Firebase user to MongoDB: ${email}`);
                    user = await User.create({ 
                        email, 
                        firebaseId: decodedToken.uid,
                        name: decodedToken.name || email.split('@')[0],
                        role: email === OWNER_EMAIL ? 'admin' : 'user',
                        plan: 'free'
                    });
                } else if (email === OWNER_EMAIL && user.role !== 'admin') {
                    console.log(`[AUTH] Force assigning ADMIN role to: ${email}`);
                    user.role = 'admin';
                    await user.save();
                }
                
                req.user = { 
                    userId: user._id, 
                    email: email, 
                    role: email === OWNER_EMAIL ? 'admin' : user.role, // FAILSAFE OVERRIDE
                    plan: user.plan,
                    firebaseId: decodedToken.uid 
                };

                // Debug Log
                console.log("LOGIN USER:", req.user.email, req.user.role);
                
                return next();
            } catch (firebaseErr) {
                console.error("[AUTH DEBUG] Firebase token verification failed:", firebaseErr.message);
                const user = jwt.verify(token, JWT_SECRET);
                req.user = user;
                return next();
            }
        } else {
            const user = jwt.verify(token, JWT_SECRET);
            req.user = user;
            return next();
        }
    } catch (err) {
        console.error("[AUTH DEBUG] authenticateToken error:", err.message);
        if (isHtmlRequest(req)) return res.redirect('/');
        res.status(401).json({ error: 'Invalid or expired session.' });
    }
};

const authenticateAdmin = (req, res, next) => {
    const userEmail = (req.user.email || "").trim().toLowerCase();
    const userRole = req.user.role;

    // Hard Override: Email match is absolute
    const isAdmin = (userRole === 'admin' || userEmail === OWNER_EMAIL);

    console.log(`[ADMIN CHECK] Attempt by: ${userEmail} | Role: ${userRole} | IsAdmin: ${isAdmin}`);

    if (!isAdmin) {
        console.warn(`[SECURITY] Forbidden admin access by ${userEmail} (Role: ${userRole})`);
        if (isHtmlRequest(req)) return res.redirect('/');
        return res.status(403).json({ error: 'Forbidden. Admin access only.' });
    }
    next();
};

// --- PROTECTED PAGES (BEFORE STATIC) ---

app.get('/admin.html', authenticateToken, authenticateAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/dashboard.html', authenticateToken, (req, res) => {
    // Admin should never land on user dashboard
    if (req.user.role === 'admin' || req.user.email === OWNER_EMAIL) {
        return res.redirect('/admin.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Production Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/delete-data', (req, res) => res.sendFile(path.join(__dirname, 'public', 'delete-data.html')));

app.use(express.static(path.join(__dirname, 'public'))); // Serve from public dir

// ── Firebase Config Endpoint (serves config to frontend) ──
app.get('/api/firebase-config', (req, res) => {
    if (!FIREBASE_CLIENT_CONFIG.apiKey || FIREBASE_CLIENT_CONFIG.apiKey.startsWith('your_')) {
        return res.status(503).json({ error: 'Firebase not configured. Set FIREBASE_API_KEY in .env' });
    }
    res.json(FIREBASE_CLIENT_CONFIG);
});

// --- Removed File Helpers & Mutex ---
// Migrated to MongoDB models: Job, Log, Automation, User

// --- Webhook Security Middleware ---
const verifySignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];

    if (!signature) {
        console.warn("[SECURITY] Missing X-Hub-Signature header");
        return res.status(403).send('Verification failed: No signature');
    }

    if (!APP_SECRET) {
        console.warn("[SECURITY] APP_SECRET missing in .env. Skipping verification for safety.");
        return next();
    }

    const parts = signature.split('=');
    const algorithm = parts[0];
    const signatureHash = parts[1];

    const expectedHash = crypto
        .createHmac(algorithm === 'sha256' ? 'sha256' : 'sha1', APP_SECRET)
        .update(req.rawBody)
        .digest('hex');

    if (signatureHash !== expectedHash) {
        console.warn(`[SECURITY] Invalid ${algorithm} signature detected!`);
        return res.status(403).send('Verification failed: Invalid signature');
    }

    next();
};

// Specific Platform: Telegram
const sendTelegramDM = async (chatId, message) => {
    return new Promise((resolve, reject) => {
        console.log("[SEND] Sending Telegram DM to:", chatId);
        console.log(`[DEBUG] Message content: "${message}"`);

        if (!chatId || chatId === "unknown") {
            return reject(new Error("Invalid or missing Chat ID"));
        }

        const data = JSON.stringify({
            chat_id: chatId,
            text: message
        });

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        // console.log(`[DEBUG] Calling Telegram API URL: ${url}`);
        // console.log(`[DEBUG] Request Payload: ${data}`);

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log("[SEND] Telegram status:", res.statusCode);
                // console.log(`[DEBUG] Telegram API Response Body: ${body}`);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log("[SUCCESS] Message sent");
                    resolve(JSON.parse(body));
                } else {
                    console.error(`[ERROR] Telegram failed: ${res.statusCode}`, body);
                    reject(new Error(`Telegram API Error: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error("[ERROR] Telegram failed:", error.message);
            reject(error);
        });

        req.setTimeout(10000, () => {
            console.error("[ERROR] Telegram failed: Request Timeout");
            req.destroy();
            reject(new Error('Telegram API Request Timeout'));
        });

        req.write(data);
        req.end();
    });
};

// Specific Platform: Instagram (Meta Graph API)
const sendInstagramDM = async (ownerId, targetId, message, igId = null) => {
    console.log(`[SEND] Instagram Standard DM to UserID: ${targetId} | Owner: ${ownerId}`);
    
    // 1. Fetch user specific token
    const account = await InstagramAccount.findOne({ userId: ownerId });
    const token = account ? account.access_token : PAGE_ACCESS_TOKEN;

    if (!token || token === "your_token_here") {
        console.warn("[SIMULATION MODE] No token for owner. Skipping real API call.");
        return { success: true, message_id: "sim_" + Date.now(), status: "simulated" };
    }

    // Use igId if provided, fallback to 'me'
    const endpointId = igId || (account ? account.instagram_id : 'me');
    const url = `https://graph.facebook.com/v19.0/${endpointId}/messages`;
    const payload = {
        recipient: { id: targetId },
        message: { text: message }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        // Log Full Response
        console.log("[API RESPONSE] Status:", response.status);
        console.log("[API RESPONSE] Body:", JSON.stringify(response.data, null, 2));

        const messageId = response.data.message_id;
        if (messageId) {
            console.log("[SUCCESS REAL] Message delivered via Meta API. ID:", messageId);
            return { success: true, message_id: messageId, data: response.data };
        } else {
            console.warn("[FAILED DELIVERY] Meta API returned 200 but no message_id found.");
            return { success: false, error: "No message_id in response" };
        }
    } catch (error) {
        const errorData = error.response ? error.response.data : { error: { message: error.message } };
        console.error("[API ERROR] Instagram DM failed:", JSON.stringify(errorData, null, 2));
        
        return { 
            success: false, 
            error: errorData.error?.message || "Unknown error",
            code: errorData.error?.code 
        };
    }
};

// Instagram Public Reply (Reply to Comment on Post)
const sendInstagramPublicReply = async (ownerId, commentId, message) => {
    console.log(`[SEND] Instagram Public Reply to CommentID: ${commentId} | Owner: ${ownerId}`);

    const account = await InstagramAccount.findOne({ userId: ownerId });
    const token = account ? account.access_token : PAGE_ACCESS_TOKEN;

    if (!token || token === "your_token_here") {
        return { success: true, status: "simulated" };
    }

    const url = `https://graph.facebook.com/v19.0/${commentId}/replies`;
    const payload = { message };

    console.log(`[GRAPH API REQUEST] POST ${url}`);
    
    try {
        const response = await axios.post(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        console.log("[GRAPH API RESPONSE] Public Reply Success:", JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data };
    } catch (error) {
        const errorData = error.response ? error.response.data : { error: { message: error.message } };
        console.error("[GRAPH API RESPONSE] Public Reply Error:", JSON.stringify(errorData, null, 2));
        return { success: false, error: errorData.error?.message };
    }
};

// Instagram Private Reply (Comment Triggered)
const sendInstagramPrivateReply = async (ownerId, commentId, message, igId = null) => {
    console.log(`[SEND] Instagram Private Reply to CommentID: ${commentId} | Owner: ${ownerId}`);

    // 1. Fetch user specific token
    const account = await InstagramAccount.findOne({ userId: ownerId });
    const token = account ? account.access_token : PAGE_ACCESS_TOKEN;

    if (!token || token === "your_token_here") {
        console.warn("[SIMULATION MODE] No token for owner. Skipping real API call.");
        return { success: true, message_id: "sim_" + Date.now(), status: "simulated" };
    }

    // Use igId if provided (this should be the Instagram Business Account ID)
    const endpointId = igId || account.instagram_id;
    if (!endpointId) {
        console.error("[CRITICAL ERROR] No Instagram Business ID (ig_id) found for owner.");
        return { success: false, error: "Missing ig_id" };
    }

    const url = `https://graph.facebook.com/v19.0/${endpointId}/messages`;
    const payload = {
        recipient: { comment_id: commentId },
        message: { text: message }
    };

    console.log(`[GRAPH API REQUEST] POST ${url}`);
    console.log("[GRAPH API PAYLOAD]", JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        console.log("[GRAPH API RESPONSE] Success:", JSON.stringify(response.data, null, 2));

        const messageId = response.data.message_id;
        if (messageId) {
            console.log(`[SUCCESS] DM Delivered to Comment ${commentId}. ID: ${messageId}`);
            return { success: true, message_id: messageId, data: response.data };
        } else {
            console.warn("[FAILED] API returned 200 but no message_id found.");
            return { success: false, error: "No message_id in response" };
        }
    } catch (error) {
        const errorData = error.response ? error.response.data : { error: { message: error.message } };
        console.error("[GRAPH API RESPONSE] Error:", JSON.stringify(errorData, null, 2));

        return { 
            success: false, 
            error: errorData.error?.message || "Unknown error",
            code: errorData.error?.code 
        };
    }
};

// Multi-platform Router
const sendDM = async (platform, ownerId, targetId, message, metadata = {}, type = 'send_dm') => {
    console.log(`[ROUTER] Routing message to platform: ${platform} | Type: ${type} | Owner: ${ownerId}`);
    
    if (platform === "instagram") {
        const igId = metadata && metadata.ig_id;
        if (type === "reply_comment" || (metadata && metadata.comment_id)) {
            const commentId = metadata && metadata.comment_id;
            
            // 1. Send Public Reply first (optional, but requested)
            if (metadata.public_reply) {
                await sendInstagramPublicReply(ownerId, commentId, "Check your DM 👋");
            }

            // 2. Send Private Reply
            return await sendInstagramPrivateReply(ownerId, commentId, message, igId);
        } else {
            return await sendInstagramDM(ownerId, targetId, message, igId);
        }
    } else {
        // Default to Telegram
        return await sendTelegramDM(targetId, message);
    }
};

// Helper to finalize job status after processing (MongoDB Atomic)
const finalizeJob = async (jobId, status, error = null, deliveryStatus = 'pending') => {
    try {
        const job = await Job.findById(jobId);
        if (!job) return;

        job.status = status;
        job.delivery_status = deliveryStatus;
        if (error) job.error = typeof error === 'object' ? JSON.stringify(error) : error;

        if (status === "done") {
            // Update automation triggerCount atomically
            if (job.automationId) {
                await Automation.findByIdAndUpdate(job.automationId, { $inc: { triggerCount: 1 } });
            }

            // Create Audit Log entry - Isolated by ownerId
            await Log.create({
                ownerId: job.userId,
                username: job.username || 'unknown',
                user_id: job.user_id,
                keyword: job.message,
                dmLink: job.metadata?.dmLink || 'No link provided',
                metadata: { ...job.metadata, automationId: job.automationId },
                platform: job.platform,
                timestamp: new Date()
            });

            // NEW: Schedule Follow-up (Dynamic Timing based on Intent)
            if (job.type === "send_dm") {
                const originalText = job.metadata?.original_text || "";
                const intent = detectIntent(originalText);
                
                // Dynamic Delays
                let delayMinutes = 30; // Default / Low
                if (intent === "high") delayMinutes = 2;
                if (intent === "medium") delayMinutes = 10;

                const sendAfter = new Date(Date.now() + delayMinutes * 60 * 1000);
                
                await Followup.create({
                    user_id: job.user_id,
                    ownerId: job.userId, // Store automation owner
                    message: "Did you get the link? Let me know if you need any help! 🚀",
                    send_after: sendAfter,
                    status: "pending",
                    intent: intent,
                    metadata: { jobId: job._id }
                });
                logger.info(`Scheduled follow-up for user ${job.user_id} (${intent} intent)`);
            }
        }
        await job.save();

        // Mark WebhookEvent as processed if applicable
        if (job.metadata && job.metadata.eventId) {
            await WebhookEvent.findOneAndUpdate(
                { eventId: job.metadata.eventId },
                { processed: true, processedAt: new Date() }
            );
        }
    } catch (err) {
        logger.error(`finalizeJob failed for ${jobId}: ${err.message}`);
    }
};

// Isolated Job Processor with Retries (MongoDB)
const processJob = async (item) => {
    const jobId = item._id;
    logger.info(`Processing Job | ID: ${jobId} | Target: ${item.user_id}`);
    
    try {
        // Add artificial jitter (1-3s) to avoid burst detection
        const jitter = Math.floor(Math.random() * 2000) + 1000;
        await new Promise(r => setTimeout(r, jitter));

        const result = await sendDM(
            item.platform || "telegram", 
            item.userId,
            item.user_id,
            item.message || 'Hello!',
            item.metadata || {},
            item.type || 'send_dm'
        );
        
        if (result && result.success) {
            await finalizeJob(jobId, "done", null, "sent");
            logger.info(`Job Success | ID: ${jobId}`);
        } else {
            const errorMsg = result ? result.error : "Unknown routing error";
            await finalizeJob(jobId, "failed", errorMsg, "not_delivered");
            logger.warn(`Job Failed | ID: ${jobId} | Reason: ${errorMsg}`);
        }
    } catch (e) {
        logger.error(`Job Exception | ID: ${jobId} | Error: ${e.message}`);
        
        const currentAttempts = (item.attempts || 0) + 1;
        if (currentAttempts < 3) {
            logger.info(`Retrying Job | ID: ${jobId} | Attempt: ${currentAttempts + 1}`);
            await finalizeJob(jobId, "pending", `Error: ${e.message} (Attempt ${currentAttempts})`);
        } else {
            logger.error(`Job Fatal | ID: ${jobId} | Max Retries Reached`);
            await finalizeJob(jobId, "failed", `Max retries reached. Last error: ${e.message}`);
        }
    }
};

// Follow-up Processor (MongoDB)
const processFollowups = async () => {
    try {
        const now = new Date();
        const pendingFollowups = await Followup.find({
            status: "pending",
            send_after: { $lte: now }
        });

        if (pendingFollowups.length === 0) return;

        console.log(`[WORKER] Processing ${pendingFollowups.length} scheduled follow-ups...`);

        for (const fu of pendingFollowups) {
            try {
                // Use the ownerId stored in the followup to fetch correct token
                await sendDM("instagram", fu.ownerId || "admin", fu.user_id, fu.message, {}, "send_dm");
                
                fu.status = "sent";
                await fu.save();
                
                console.log(`[FOLLOWUP SENT] Successfully sent to User: ${fu.user_id}`);
            } catch (err) {
                console.error(`[FOLLOWUP ERROR] Failed for User: ${fu.user_id}:`, err.message);
                fu.status = "failed";
                await fu.save();
            }
        }
    } catch (err) {
        console.error("[CRITICAL] Follow-up worker error:", err);
    }
};

// Start Follow-up Worker
setInterval(processFollowups, 30000); // Check every 30 seconds

// --- FLOW ENGINE PROCESSOR ---
const processFlowStates = async () => {
    try {
        const now = new Date();
        const WINDOW_24H = 24 * 60 * 60 * 1000; // 24 hours in ms

        // 1. Expire stale flows (24h inactivity rule - Meta compliance)
        const expiredCount = await FlowState.updateMany(
            {
                status: 'active',
                lastActivity: { $lt: new Date(now - WINDOW_24H) }
            },
            { $set: { status: 'expired' } }
        );
        if (expiredCount.modifiedCount > 0) {
            console.log(`[FLOW ENGINE] Expired ${expiredCount.modifiedCount} stale flows (24h window).`);
        }

        // 2. Process ready flow states
        const readyStates = await FlowState.find({
            status: 'active',
            nextSendAt: { $lte: now }
        }).limit(10);

        for (const state of readyStates) {
            try {
                const flow = await Flow.findById(state.flowId);
                if (!flow || !flow.isActive) {
                    state.status = 'stopped';
                    await state.save();
                    continue;
                }

                const step = flow.steps.find(s => s.order === state.currentStep);
                if (!step) {
                    state.status = 'completed';
                    await state.save();
                    console.log(`[FLOW ENGINE] Flow ${flow._id} completed for user ${state.ig_user_id}`);
                    continue;
                }

                if (step.type === 'send_dm') {
                    const result = await sendDM(
                        'instagram', state.ownerId, state.ig_user_id,
                        step.message, state.metadata || {}, 'send_dm'
                    );
                    if (result && result.success) {
                        // Advance to next step
                        const nextStep = flow.steps.find(s => s.order === state.currentStep + 1);
                        if (nextStep) {
                            state.currentStep = nextStep.order;
                            const delayMs = (nextStep.delay_minutes || 0) * 60 * 1000;
                            state.nextSendAt = new Date(now.getTime() + delayMs);
                            state.lastActivity = now;
                            await state.save();
                            console.log(`[FLOW ENGINE] Advanced to step ${nextStep.order} for user ${state.ig_user_id}`);
                        } else {
                            state.status = 'completed';
                            await state.save();
                            console.log(`[FLOW ENGINE] Flow completed for user ${state.ig_user_id}`);
                        }
                    }
                } else if (step.type === 'wait_reply') {
                    // Check if user replied; if not, just check next time
                    const recentReply = await Log.findOne({
                        user_id: state.ig_user_id,
                        ownerId: state.ownerId,
                        timestamp: { $gte: state.lastActivity }
                    });
                    if (recentReply) {
                        const nextStep = flow.steps.find(s => s.order === state.currentStep + 1);
                        if (nextStep) {
                            state.currentStep = nextStep.order;
                            state.nextSendAt = new Date();
                            state.lastActivity = now;
                            await state.save();
                        } else {
                            state.status = 'completed';
                            await state.save();
                        }
                    }
                } else if (step.type === 'delay') {
                    // Just advance to next step
                    const nextStep = flow.steps.find(s => s.order === state.currentStep + 1);
                    if (nextStep) {
                        state.currentStep = nextStep.order;
                        const delayMs = (step.delay_minutes || 0) * 60 * 1000;
                        state.nextSendAt = new Date(now.getTime() + delayMs);
                        state.lastActivity = now;
                        await state.save();
                    } else {
                        state.status = 'completed';
                        await state.save();
                    }
                }
            } catch (stepErr) {
                console.error(`[FLOW ENGINE ERROR] State ${state._id}:`, stepErr.message);
            }
        }
    } catch (err) {
        console.error('[FLOW ENGINE CRITICAL]', err);
    }
};
setInterval(processFlowStates, 15000); // Check every 15 seconds

// Helper to reset 24h window for a user (called on incoming DM)
const updateFlowStateActivity = async (ig_user_id) => {
    try {
        const now = new Date();
        await FlowState.updateMany(
            { ig_user_id, status: 'active' },
            { $set: { lastActivity: now } }
        );
        console.log(`[FLOW ENGINE] Reset 24h window for user: ${ig_user_id}`);
    } catch (err) {
        console.error("[FLOW ENGINE] Failed to update activity:", err);
    }
};


// --- PRIMARY OFFICIAL API WORKER (MongoDB) ---
// Restored as primary for Meta compliance and stability
setInterval(async () => {
    try {
        const processingJobs = await Job.find({ status: "processing" });
        const maxParallel = 5;

        if (processingJobs.length >= maxParallel) return;

        const now = Date.now();
        // Fetch pending jobs
        const pendingJobs = await Job.find({ status: "pending" }).sort({ createdAt: 1 }).limit(20);
        
        if (pendingJobs.length === 0) return;

        const readyJobs = [];
        for (const item of pendingJobs) {
            if (readyJobs.length + processingJobs.length >= maxParallel) break;

            // Isolation: Only 1 active job per user
            const isUserActive = processingJobs.some(pj => pj.user_id === item.user_id) || 
                                 readyJobs.some(rj => rj.user_id === item.user_id);
            if (isUserActive) continue;

            if (item.platform === "instagram") {
                // Safety delay (30s)
                const processAfter = item.process_after || (new Date(item.createdAt).getTime() + 5000);
                if (now < processAfter) continue;

                // Rate Limit
                const lastLog = await Log.findOne({ user_id: item.user_id }).sort({ timestamp: -1 });
                if (lastLog) {
                    const lastSent = new Date(lastLog.timestamp).getTime();
                    if (now - lastSent < 10000) continue;
                }
            }
            readyJobs.push(item);
        }

        if (readyJobs.length > 0) {
            const jobIds = readyJobs.map(j => j._id);
            await Job.updateMany(
                { _id: { $in: jobIds } },
                { $set: { status: "processing" }, $inc: { attempts: 1 } }
            );

            console.log(`[OFFICIAL WORKER] Starting ${readyJobs.length} parallel jobs...`);
            Promise.allSettled(readyJobs.map(job => processJob(job)));
        }
    } catch (err) {
        console.error("[OFFICIAL WORKER ERROR]", err);
    }
}, 3000);

// Queue Cleanup System (MongoDB)
setInterval(async () => {
    try {
        const hourAgo = new Date(Date.now() - 3600000);
        const result = await Job.deleteMany({ 
            status: "done", 
            createdAt: { $lt: hourAgo } 
        });
        if (result.deletedCount > 0) {
            console.log(`[CLEANUP] Removed ${result.deletedCount} old completed items.`);
        }
    } catch (err) {
        console.error("[CLEANUP ERROR]", err);
    }
}, 3600000); // Hourly

// --- SAAS AUTH SYSTEM (FIREBASE) ---

app.post('/api/auth/firebase', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: 'ID Token is required.' });

        let email, uid, name, picture;

        // 1. Verify Token (or skip if in debug/emergency mode)
        if (firebaseAdminReady) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                email = decodedToken.email;
                uid = decodedToken.uid;
                name = decodedToken.name;
                picture = decodedToken.picture;
            } catch (vErr) {
                console.error("[AUTH] Token verification failed:", vErr.message);
                return res.status(401).json({ error: 'Invalid Firebase token: ' + vErr.message });
            }
        } else {
            // EMERGENCY FALLBACK: If admin is not ready but we have a token, 
            // we'll try to extract data without verification (ONLY for initial setup debug)
            console.warn("[AUTH] Admin not ready. Attempting insecure sync...");
            const parts = idToken.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                email = payload.email;
                uid = payload.user_id || payload.sub;
                name = payload.name;
                picture = payload.picture;
                console.log("[AUTH] Insecurely extracted email:", email);
            } else {
                return res.status(500).json({ error: 'Firebase Admin not initialized and token is malformed.' });
            }
        }

        if (!email) return res.status(400).json({ error: 'Email not found in token.' });

        // 2. Find or Create User in MongoDB
        const cleanEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: cleanEmail });
        
        if (!user) {
            user = await User.create({ 
                email: cleanEmail, 
                firebaseId: uid,
                profilePicture: picture,
                name: name || cleanEmail.split('@')[0],
                role: cleanEmail === OWNER_EMAIL ? 'admin' : 'user',
                plan: 'free'
            });
            console.log(`[AUTH] New user synced: ${cleanEmail}`);
        } else {
            user.firebaseId = uid;
            if (picture) user.profilePicture = picture;
            if (cleanEmail === OWNER_EMAIL) user.role = 'admin';
            await user.save();
        }

        // 3. Set JWT Token in Cookie (using our own secret for reliability)
        const token = jwt.sign({ 
            userId: user._id, 
            email: user.email, 
            role: user.role,
            firebaseId: uid 
        }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.status(200).json({ 
            success: true, 
            user: { 
                id: user._id, 
                email: user.email, 
                name: user.name, 
                role: user.role 
            } 
        });
    } catch (err) {
        console.error('[AUTH CRITICAL ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error: ' + err.message });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ success: true });
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- INSTAGRAM MEDIA SELECTOR ---

app.get('/api/instagram/media', authenticateToken, async (req, res) => {
    try {
        const account = await InstagramAccount.findOne({ userId: req.user.userId });
        if (!account) return res.status(404).json({ error: 'Instagram not connected.' });

        // Fetch recent media (posts and reels)
        const response = await axios.get(`https://graph.facebook.com/v19.0/${account.instagram_id}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
                access_token: account.access_token,
                limit: 24
            }
        });

        res.status(200).json(response.data.data || []);
    } catch (err) {
        console.error('[MEDIA API ERROR]', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch Instagram media.' });
    }
});

// --- Auth Routes ---

app.post('/api/signup', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Invalid input. Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = (email === ADMIN_EMAIL) ? "admin" : "user";
    
    const newUser = await User.create({ email, password: hashedPassword, name, role });

    res.status(201).json({ message: 'User created successfully.' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    if (!user.password) {
        return res.status(400).json({ error: 'This account does not have a password set. Please use Google Sign-in.' });
    }

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: 'Wrong password' });
    }

    console.log("Logged in user:", { id: user._id, email: user.email, role: user.role });

    const role = user.role || ((user.email === ADMIN_EMAIL) ? "admin" : "user");

    const expiresIn = rememberMe ? '7d' : '1h';
    const token = jwt.sign({ userId: user._id, email: user.email, name: user.name, role }, JWT_SECRET, { expiresIn });

    const cookieOptions = { httpOnly: true, secure: false };
    if (rememberMe) cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    
    res.cookie('token', token, cookieOptions);
    res.status(200).json({ message: 'Login successful' });
});

app.post('/api/forgot-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Invalid input. Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Email not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/api/me', authenticateToken, (req, res) => {
    res.status(200).json({ user: req.user });
});

// --- Instagram OAuth Connection System ---

app.get('/auth/instagram', authenticateToken, (req, res) => {
    const host = req.get('host');
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/auth/callback`;
    const scopes = [
        'instagram_basic',
        'instagram_manage_comments',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_manage_metadata',
        'pages_messaging',
        'pages_read_engagement'
    ];
    // Pass the userId securely in the state parameter
    const state = req.user ? req.user.userId : '';
    const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(',')}&response_type=code&state=${state}`;
    res.redirect(fbLoginUrl);
});

app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        const host = req.get('host');
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        const protocol = isLocal ? 'http' : 'https';
        const redirectUri = `${protocol}://${host}/auth/callback`;
        // 1. Exchange code for Short-Lived User Access Token
        const tokenRes = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
            params: {
                client_id: process.env.FB_APP_ID,
                client_secret: process.env.FB_APP_SECRET,
                redirect_uri: redirectUri,
                code
            }
        });

        const shortLivedToken = tokenRes.data.access_token;

        // 2. Exchange for Long-Lived User Access Token
        const longLivedRes = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: process.env.FB_APP_ID,
                client_secret: process.env.FB_APP_SECRET,
                fb_exchange_token: shortLivedToken
            }
        });

        const longLivedToken = longLivedRes.data.access_token;

        // 3. Get User's Pages to find the Instagram Business Account
        const pagesRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { access_token: longLivedToken }
        });

        let pageId, igAccountId, pageAccessToken, pageName;

        for (const page of pagesRes.data.data) {
            const igRes = await axios.get(`https://graph.facebook.com/v19.0/${page.id}`, {
                params: {
                    fields: 'instagram_business_account,name',
                    access_token: page.access_token
                }
            });

            if (igRes.data.instagram_business_account) {
                pageId = page.id;
                pageAccessToken = page.access_token;
                igAccountId = igRes.data.instagram_business_account.id;
                pageName = page.name;
                break;
            }
        }

        if (!igAccountId) {
            console.log("❌ [OAUTH DEBUG] No linked Instagram Business Account found!");
            console.log("Pages analyzed:", pagesRes.data.data);
            
            let pagesHtml = '';
            if (pagesRes.data.data && pagesRes.data.data.length > 0) {
                pagesHtml = pagesRes.data.data.map(p => `<li><strong>${p.name}</strong> (ID: ${p.id})</li>`).join('');
            } else {
                pagesHtml = '<li><em>No Facebook Pages found. Make sure you granted permissions for your Facebook Pages during the login popup!</em></li>';
            }

            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>DMOrbit — Connection Help</title>
                    <style>
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            background: #0f172a;
                            color: #f8fafc;
                            line-height: 1.6;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            background: rgba(30, 41, 59, 0.7);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            padding: 40px;
                            border-radius: 24px;
                            max-width: 600px;
                            width: 100%;
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                            backdrop-filter: blur(12px);
                        }
                        h1 {
                            font-size: 24px;
                            font-weight: 800;
                            margin-bottom: 20px;
                            color: #ef4444;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        h3 {
                            margin-top: 24px;
                            font-weight: 700;
                            color: #fff;
                        }
                        p {
                            color: #94a3b8;
                            font-size: 15px;
                        }
                        .pages-list {
                            background: rgba(15, 23, 42, 0.5);
                            border: 1px solid rgba(255, 255, 255, 0.05);
                            border-radius: 12px;
                            padding: 16px 24px;
                            margin: 20px 0;
                            list-style-type: none;
                        }
                        .pages-list li {
                            margin-bottom: 8px;
                            color: #e2e8f0;
                        }
                        .pages-list li:last-child {
                            margin-bottom: 0;
                        }
                        .steps {
                            margin-top: 24px;
                        }
                        .step {
                            margin-bottom: 16px;
                        }
                        .step-num {
                            background: linear-gradient(45deg, #833ab4, #fd1d1d);
                            color: white;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            display: inline-flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 12px;
                            font-weight: 700;
                            margin-right: 8px;
                        }
                        .btn-retry {
                            background: linear-gradient(45deg, #833ab4, #fd1d1d);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            text-decoration: none;
                            display: inline-block;
                            margin-top: 20px;
                            transition: transform 0.2s ease;
                        }
                        .btn-retry:hover {
                            transform: translateY(-2px);
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>⚠️ Instagram Account Link Missing</h1>
                        <p>Meta API ko aapke Facebook Page se connected koi <strong>Instagram Business / Creator</strong> account nahi mila.</p>
                        
                        <h3>Humne yeh Facebook Pages dhoondhe:</h3>
                        <ul class="pages-list">
                            ${pagesHtml}
                        </ul>

                        <div class="steps">
                            <h3>Isko sahi karne ke liye steps:</h3>
                            
                            <div class="step">
                                <span class="step-num">1</span>
                                <strong>Instagram account ko Creator/Business mode me convert karein:</strong><br>
                                <span style="font-size: 14px; color: #94a3b8;">Instagram mobile app me <em>Settings -> Account type -> Switch to Professional (Creator/Business)</em> karein. Personal accounts Meta API support nahi karte.</span>
                            </div>

                            <div class="step">
                                <span class="step-num">2</span>
                                <strong>Instagram ko Facebook Page se link karein:</strong><br>
                                <span style="font-size: 14px; color: #94a3b8;">Facebook Page par jayein -> <em>Settings -> Linked Accounts -> Instagram</em> par click karein aur apna Instagram account link/connect karein.</span>
                            </div>

                            <div class="step">
                                <span class="step-num">3</span>
                                <strong>Meta Login popup me Page permission ensure karein:</strong><br>
                                <span style="font-size: 14px; color: #94a3b8;">Jab aap Facebook login popup kholte hain, toh ensure karein ki aapne <strong>saare Pages</strong> aur <strong>Instagram accounts</strong> par tick-mark kiya hai.</span>
                            </div>
                        </div>

                        <a href="/dashboard.html" class="btn-retry">Return to Dashboard & Retry</a>
                    </div>
                </body>
                </html>
            `);
        }

        // 4. Store in Database
        let userId = state || 'system';
        const token = req.cookies.token;
        if (!state && token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.userId;
            } catch(e) {}
        }

        await InstagramAccount.findOneAndUpdate(
            { userId },
            {
                instagram_id: igAccountId,
                page_id: pageId,
                access_token: pageAccessToken, // Long-lived Page Token for webhooks/API
                status: 'active',
                updatedAt: new Date()
            },
            { upsert: true }
        );

        // Update User state
        await User.findByIdAndUpdate(userId, { instagramConnected: true });

        // 5. Subscribe Webhooks for this Page
        await axios.post(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`, {
            subscribed_fields: 'feed,messages',
            access_token: pageAccessToken
        });

        console.log(`[OAUTH] Successfully connected IG ID: ${igAccountId} for user ${userId}`);
        res.redirect('/dashboard.html?connected=true');

    } catch (err) {
        const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error('[OAUTH ERROR]', errorDetail);
        res.status(500).send(`Authentication failed. Facebook returned: ${errorDetail}`);
    }
});

// Account Health Check (Token Validation)
app.get('/api/account/health', authenticateToken, async (req, res) => {
    try {
        const account = await InstagramAccount.findOne({ userId: req.user.userId });
        if (!account) return res.json({ status: 'not_connected' });

        // Basic check: is token present?
        if (!account.access_token) return res.json({ status: 'disconnected' });

        // Validate token with Meta
        try {
            const debugUrl = `https://graph.facebook.com/debug_token?input_token=${account.access_token}&access_token=${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
            const response = await axios.get(debugUrl);
            const isValid = response.data.data.is_valid;
            
            account.status = isValid ? 'active' : 'expired';
            account.lastChecked = new Date();
            await account.save();

            res.json({ 
                status: account.status, 
                expires_at: response.data.data.expires_at,
                scopes: response.data.data.scopes 
            });
        } catch (apiErr) {
            console.error("[HEALTH CHECK] Meta API error:", apiErr.message);
            res.json({ status: 'unknown', error: apiErr.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Meta Webhook Handshake (GET /webhook) ---
app.get('/webhook', (req, res) => {
    console.log("Webhook request:", req.query);
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log(`[WEBHOOK] Meta Handshake Verified for ${APP_URL} ✅`);
        return res.status(200).send(challenge);
    } else {
        console.warn(`[WEBHOOK] Meta Handshake Failed: Token Mismatch ❌ (Expected: ${VERIFY_TOKEN}, Received: ${token})`);
        return res.status(403).send('Verification failed');
    }
});

// --- Smart Instagram Profile Redirect (Deep Link) ---
app.get('/ig-profile', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Opening DMOrbit Profile...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #fafafa; flex-direction: column; }
                .spinner { width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-left-color: #000; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            </style>
            <script>
                // Try deep linking first, then fallback to normal web URL
                window.location.href = "instagram://user?username=dmorbitapp";
                setTimeout(function() {
                    window.location.href = "https://instagram.com/dmorbitapp";
                }, 1500);
            </script>
        </head>
        <body>
            <div class="spinner"></div>
            <p style="color: #666; font-weight: 500;">Taking you to Instagram...</p>
        </body>
        </html>
    `);
});

// --- DMOrbit Follow-Gate Template Engine ---

async function sendInitialAccessCard(recipientId, pageToken) {
    const url = `https://graph.facebook.com/v21.0/me/messages`;
    const payload = {
        recipient: { id: recipientId },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "Hey 🖐",
                        subtitle: "Saw your interest - I've got something useful for you. Tap below and I'll send it right away",
                        buttons: [{ type: "postback", title: "Send me the access", payload: "REQUEST_ACCESS_CLICKED" }]
                    }]
                }
            }
        },
        access_token: pageToken
    };
    await axios.post(url, payload);
}

async function sendFollowGateCard(recipientId, pageToken, profileUrl) {
    const url = `https://graph.facebook.com/v21.0/me/messages`;
    const payload = {
        recipient: { id: recipientId },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "Looks like you're not following yet 👀",
                        subtitle: "Follow to unlock access.",
                        buttons: [
                            { type: "web_url", url: profileUrl || "https://instagram.com/", title: "Visit Profile" },
                            { type: "postback", title: "I'm following ✅", payload: "VERIFY_FOLLOW_CLICKED" }
                        ]
                    }]
                }
            }
        },
        access_token: pageToken
    };
    await axios.post(url, payload);
}

async function sendFinalDeliveryCard(recipientId, pageToken, targetLink, fallbackText) {
    const url = `https://graph.facebook.com/v21.0/me/messages`;
    const payload = {
        recipient: { id: recipientId },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "Here you go 👇",
                        subtitle: fallbackText || "This is what you asked for. Try it and let me know 👍",
                        buttons: [{ type: "web_url", url: targetLink || "https://web-production-dd826.up.railway.app", title: "Click me" }]
                    }]
                }
            }
        },
        access_token: pageToken
    };
    await axios.post(url, payload);
}

function extractUrl(text) {
    if(!text) return "https://web-production-dd826.up.railway.app";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : "https://web-production-dd826.up.railway.app";
}

// --- DMOrbit 3-Tier Pricing & Limitation Checker ---
async function checkAutomationLimits(user) {
    const currentPlan = (user.plan || 'FREE').toUpperCase();
    const currentDmCount = user.dmCountThisMonth || 0;

    // Fetch user's current active automations count
    const activeAutomationsCount = await Automation.countDocuments({ 
        userId: user._id, 
        isActive: true 
    });

    console.log(`[DMOrbit Billing] Checking limits for User: ${user.email} | Plan: ${currentPlan} | DMs: ${currentDmCount}`);

    if (currentPlan === 'FREE') {
        if (currentDmCount >= 50) {
            console.log("❌ Limit Exceeded: FREE Plan user reached 50 DMs limit.");
            return { allowed: false, reason: "FREE_DM_LIMIT_EXCEEDED" };
        }
    } 
    
    if (currentPlan === 'BASIC') {
        if (currentDmCount >= 1000) {
            console.log("❌ Limit Exceeded: BASIC Plan user reached 1000 DMs limit.");
            return { allowed: false, reason: "BASIC_DM_LIMIT_EXCEEDED" };
        }
    }

    return { allowed: true };
}

// --- DMOrbit Stripe Subscription & Billing Engine ---
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');

// Route 1: Create a Checkout Session (USD / INR adaptive depending on frontend)
app.post('/api/billing/checkout', async (req, res) => {
    const { userId, planType, currency } = req.body; // planType: 'BASIC' or 'PRO', currency: 'inr' or 'usd'
    
    // Determine pricing based on currency and plan choice
    let amount = 0;
    if (planType === 'BASIC') {
        amount = currency === 'inr' ? 29900 : 900; // 299.00 INR vs 9.00 USD (in cents)
    } else if (planType === 'PRO') {
        amount = currency === 'inr' ? 59900 : 1900; // 599.00 INR vs 19.00 USD
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: currency === 'inr' ? ['card', 'upi'] : ['card'],
            line_items: [{
                price_data: {
                    currency: currency || 'inr',
                    product_data: {
                        name: `DMOrbit ${planType} Plan Subscription`,
                        description: `Unlock advanced Instagram automation features for ${planType} tier.`,
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment', // Or 'subscription' depending on your Stripe account capability
            success_url: `${process.env.CLIENT_URL || 'https://web-production-dd826.up.railway.app'}/dashboard.html?payment=success`,
            cancel_url: `${process.env.CLIENT_URL || 'https://web-production-dd826.up.railway.app'}/dashboard.html?payment=cancel`,
            metadata: { userId, planType }
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("[Stripe Error]:", err.message);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});

// Route 2: Stripe Webhook Listener to capture successful payments
app.post('/api/billing/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Handle both stringified and already-parsed JSON safely
        event = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? JSON.parse(req.body) : req.body;
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, planType } = session.metadata;

        console.log(`[Stripe Webhook] Successful Payment! Upgrading User: ${userId} to ${planType}`);
        
        // Update user plan and reset their dynamic counter in DB
        await User.updateOne(
            { _id: userId },
            { plan: planType, dmCountThisMonth: 0 }
        );
    }

    res.json({ received: true });
});

// --- Unified Meta Webhook Receiver (POST /webhook) ---
app.post('/webhook', verifySignature, async (req, res) => {
    console.log("🔥 WEBHOOK HIT 🔥");
    const body = req.body;
    const headers = req.headers;

    try {
        await WebhookLog.create({
            payload: body,
            headers: headers,
            source: body.object || "unknown"
        });
        console.log(`[DEBUG LOGGED] Webhook from ${body.object || "unknown"}`);
    } catch (err) {
        console.error("[CRITICAL] Failed to log webhook to DB:", err.message);
    }


    console.log("-----------------------------------------");
    console.log("🔥 WEBHOOK RECEIVED 🔥", body.object);
    console.log("-----------------------------------------");

    if (body.object === 'instagram' || body.object === 'page') {
        try {
            for (const entry of body.entry) {
                const eventId = entry.id + "_" + (entry.time || Date.now());
                
                // Idempotency Check
                const existingEvent = await WebhookEvent.findOne({ eventId });
                if (existingEvent && existingEvent.processed) {
                    console.log(`[WEBHOOK] Skipping duplicate event: ${eventId}`);
                    continue;
                }

                await WebhookEvent.findOneAndUpdate(
                    { eventId },
                    { processed: false },
                    { upsert: true }
                );
                // 1. Handle Messaging (DMs)
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        const senderId = event.sender ? event.sender.id : null;
                        if (!senderId) continue;

                        if (event.message && event.message.text) {
                            const messageText = event.message.text;
                            console.log(`[WEBHOOK] DM Received | Sender: ${senderId} | Text: "${messageText}"`);
                            
                            // RESET 24h COMPLIANCE WINDOW
                            await updateFlowStateActivity(senderId);
                            await cancelPendingFollowups(senderId);

                            // Trigger for DMs (DM Automation Test)
                            const igAccountId = entry.id;
                            const ownerAccount = await InstagramAccount.findOne({ instagram_id: igAccountId });
                            
                            if (ownerAccount) {
                                const ownerId = ownerAccount.userId;
                                const normalizedDm = messageText.toLowerCase().trim();
                                
                                const allAutos = await Automation.find({ userId: ownerId, isActive: true });
                                const matched = allAutos.find(a => {
                                    if (a.triggerType === 'ANY_COMMENT' || a.mode === 'any_comment') return false; 
                                    const kw = a.keyword || (a.trigger && a.trigger.keywords && a.trigger.keywords[0]) || "";
                                    return kw && normalizedDm.includes(kw.toLowerCase().trim());
                                });

                                const replyText = matched?.privateMessageText || (matched?.actions?.find(act => act.type === 'send_dm')?.text);

                                if (matched && replyText) {
                                    console.log(`[DM AUTOMATION] Matched keyword! Sending reply...`);
                                    try {
                                        // Send Initial Access Card instead of plain text
                                        await sendInitialAccessCard(senderId, ownerAccount.access_token);
                                        console.log(`[DM SUCCESS] Follow-Gate Initial Card sent to user: ${senderId}`);
                                        
                                        // Analytics Sync: Update Dashboard Counters for DMs
                                        await Automation.findByIdAndUpdate(matched._id, { $inc: { triggerCount: 1 } });
                                        await User.updateOne({ _id: ownerId }, { $inc: { dmCountThisMonth: 1 } });
                                        await Log.create({
                                            ownerId: ownerId,
                                            username: senderId, // Fallback since IG doesn't send username in messaging
                                            user_id: senderId,
                                            keyword: matched.keyword || (matched.trigger && matched.trigger.keywords ? matched.trigger.keywords[0] : 'DM_KEYWORD'),
                                            dmLink: 'DM Reply',
                                            metadata: { automationId: matched._id },
                                            platform: 'instagram',
                                            timestamp: new Date()
                                        });
                                        
                                    } catch (err) {
                                        console.error("[DM ERROR]", err.response?.data || err.message);
                                    }
                                }
                            }
                        }

                        // --- HANDLING INSTAGRAM BUTTON CLICK EVENTS (POSTBACKS) ---
                        if (event.postback && event.postback.payload) {
                            const postbackPayload = event.postback.payload;
                            console.log(`[DMOrbit] Button Clicked! Payload received: ${postbackPayload}`);
                            
                            const igAccountId = entry.id;
                            const ownerAccount = await InstagramAccount.findOne({ instagram_id: igAccountId });
                            const pageToken = ownerAccount ? ownerAccount.access_token : null;

                            if (pageToken && senderId && ownerAccount) {
                                const automation = await Automation.findOne({ userId: ownerAccount.userId, isActive: true }).sort({ createdAt: -1 });

                                if (postbackPayload === "REQUEST_ACCESS_CLICKED") {
                                    try {
                                        const followCheckUrl = `https://graph.facebook.com/v21.0/${senderId}?fields=is_viewer_follow_page&access_token=${pageToken}`;
                                        const followRes = await axios.get(followCheckUrl).catch(() => null);
                                        const isFollowing = followRes?.data?.is_viewer_follow_page || false;

                                        const link = extractUrl(automation?.privateMessageText);
                                        const profileUrl = `https://www.instagram.com/_u/dmorbitapp/`;

                                        if (isFollowing) {
                                            await sendFinalDeliveryCard(senderId, pageToken, link, automation?.name);
                                        } else {
                                            // Real Flow: Send the Follow-Gate card if they don't follow
                                            await sendFollowGateCard(senderId, pageToken, profileUrl);
                                        }
                                    } catch (err) {
                                        console.log("[DMOrbit Dev Mode Fallback] Follow API restricted. Forcing Follow-Gate Card for testing.");
                                        // Dev Mode Fallback: Force the follow gate card so you can test the UI buttons!
                                        const profileUrl = `https://www.instagram.com/_u/dmorbitapp/`;
                                        await sendFollowGateCard(senderId, pageToken, profileUrl);
                                    }
                                }

                                if (postbackPayload === "VERIFY_FOLLOW_CLICKED") {
                                    console.log("[DMOrbit] First click on 'I'm following'. Triggering psychological block.");
                                    try {
                                        const url = `https://graph.facebook.com/v21.0/me/messages`;
                                        await axios.post(url, {
                                            recipient: { id: senderId },
                                            message: {
                                                attachment: {
                                                    type: "template",
                                                    payload: {
                                                        template_type: "generic",
                                                        elements: [{
                                                            title: "Nice try! But you're still not following yet 👀",
                                                            subtitle: "Please click 'Visit Profile' and follow to instantly unlock the access.",
                                                            buttons: [
                                                                {
                                                                    type: "web_url",
                                                                    url: "https://www.instagram.com/_u/dmorbitapp/",
                                                                    title: "Visit Profile"
                                                                },
                                                                {
                                                                    type: "postback",
                                                                    title: "I'm following ✅",
                                                                    payload: "FINAL_FOLLOW_CLICKED"
                                                                }
                                                            ]
                                                        }]
                                                    }
                                                }
                                            },
                                            access_token: pageToken
                                        });
                                    } catch (err) {
                                        console.error("Error sending 1st click response:", err.message);
                                    }
                                }

                                if (postbackPayload === "FINAL_FOLLOW_CLICKED") {
                                    console.log("[DMOrbit] Second click verified. Delivering final automation resource safely.");
                                    const link = extractUrl(automation?.privateMessageText);
                                    await sendFinalDeliveryCard(senderId, pageToken, link, automation?.name);
                                }
                            }
                        }
                    }
                }

                // 2. Handle Comments (Changes)
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            console.log("🔥 COMMENT WEBHOOK ARRIVED 🔥");
                            const commentData = change.value;
                            
                            // VALIDATION: Ensure it's a new comment and not a deletion
                            if (change.value.verb && change.value.verb !== 'add') {
                                console.log(`[WEBHOOK] Skipping non-add comment verb: ${change.value.verb}`);
                                continue;
                            }

                            const commentId = commentData.id;
                            const userId = commentData.from ? commentData.from.id : null;
                            const targetUsername = commentData.from && commentData.from.username ? commentData.from.username : userId;
                            const commentText = (commentData.text || "").trim();
                            const mediaId = commentData.media ? commentData.media.id : (commentData.post ? commentData.post.id : null);
                            const postUrl = commentData.media && commentData.media.permalink ? commentData.media.permalink : null;

                            console.log("[WEBHOOK] Comments Payload:", JSON.stringify(commentData, null, 2));
                            console.log("-----------------------------------------");
                            console.log("🔥 COMMENT WEBHOOK ARRIVED 🔥");
                            console.log(`[COMMENT] "${commentText}" from @${targetUsername}`);
                            console.log(`[SOURCE] Media ID: ${mediaId} | Comment ID: ${commentId}`);

                            if (userId && commentText) {
                                await cancelPendingFollowups(userId);

                                // IDEMPOTENCY CHECK: Prevent duplicate processing
                                const existingJob = await Job.findOne({ "metadata.comment_id": commentId });
                                if (existingJob) {
                                    console.log(`[WEBHOOK] Duplicate comment event ignored: ${commentId}`);
                                    continue;
                                }

                                const normalizedText = commentText.toLowerCase().trim();
                                console.log(`[PARSED COMMENT] User: ${userId} | Text: "${normalizedText}"`);

                                // ISOLATION: Find the owner of this Instagram Account
                                const igAccountId = entry.id; // This is the IG Business ID from the webhook
                                const ownerAccount = await InstagramAccount.findOne({ instagram_id: igAccountId });
                                
                                if (!ownerAccount) {
                                    console.warn(`[WEBHOOK] No linked DMOrbit account found for IG ID: ${igAccountId}. Skipping.`);
                                    continue;
                                }

                                const ownerId = ownerAccount.userId;

                                function extractInstagramShortcode(url) {
                                    if (!url || typeof url !== 'string') return null;
                                    const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                                    return match ? match[2] : null;
                                }

                                // KEYWORD & TARGETING MATCHING
                                const allAutos = await Automation.find({ userId: ownerId, isActive: true });
                                const matched = allAutos.filter(a => {
                                    // 1. Post Targeting Check (Supports standard target.mediaId & new postId format)
                                    const targetMediaId = a.postId || (a.target?.type === 'specific' ? a.target?.mediaId : null);
                                    if (targetMediaId) {
                                        // Try exact match first
                                        if (targetMediaId === mediaId) return true;

                                        // Fallback shortcode match if targetMediaId is a URL or shortcode
                                        const targetShortcode = extractInstagramShortcode(targetMediaId) || targetMediaId;
                                        const incomingShortcode = extractInstagramShortcode(postUrl);

                                        if (targetShortcode && incomingShortcode && targetShortcode === incomingShortcode) {
                                            console.log(`[SHORTCODE MATCH] Target shortcode "${targetShortcode}" matches incoming shortcode "${incomingShortcode}"`);
                                            return true;
                                        }

                                        return false;
                                    }

                                    // 2. Mode Check (Supports triggerType or mode)
                                    if (a.triggerType) {
                                        if (a.triggerType === 'ANY_COMMENT') return true;
                                        if (a.triggerType === 'KEYWORD') {
                                            const kw = a.keyword || "";
                                            return normalizedText.includes(kw.toLowerCase().trim());
                                        }
                                        return false;
                                    }

                                    if (a.mode === 'any_comment') return true;

                                    const keywords = a.trigger && a.trigger.keywords ? a.trigger.keywords : [];
                                    const isMatch = keywords.some(kw => normalizedText.includes(kw.toLowerCase().trim()));
                                    if (isMatch) console.log(`[KEYWORD MATCHED] "${normalizedText}" matches keyword in automation ${a._id}`);
                                    return isMatch;
                                });

                                if (matched.length > 0) {
                                    console.log(`[MATCH FOUND] ${matched.length} automations triggered for: "${commentText}"`);
                                    
                                    for (const auto of matched) {
                                        // ANTI-SPAM: Cooldown for Any Comment mode
                                        if (auto.mode === 'any_comment' || auto.triggerType === 'ANY_COMMENT') {
                                            const lastTrigger = await Log.findOne({ 
                                                ownerId, 
                                                user_id: userId, 
                                                "metadata.automationId": auto._id.toString()
                                            }).sort({ timestamp: -1 });
                                            
                                            if (lastTrigger) {
                                                const diff = Date.now() - new Date(lastTrigger.timestamp).getTime();
                                                if (diff < 5 * 60 * 1000) { // 5 min cooldown
                                                    console.log(`[ANTI-SPAM] Cooldown active for user ${userId} on 'any_comment' mode.`);
                                                    continue;
                                                }
                                            }
                                        }

                                        // --- 1. Execute direct actions for simplified compatible format ---
                                        if (auto.publicReplyText || auto.privateMessageText) {
                                            const ownerUser = await User.findById(ownerId);
                                            if (ownerUser) {
                                                const limitStatus = await checkAutomationLimits(ownerUser);
                                                if (!limitStatus.allowed) {
                                                    console.log(`[BILLING] Automation blocked for user ${ownerId}: ${limitStatus.reason}`);
                                                    continue;
                                                }
                                            }

                                            console.log(`[SIMPLIFIED ACTIONS] Executing direct API calls for automation ${auto._id}`);
                                            const pageToken = ownerAccount.access_token;
                                            
                                            if (pageToken && pageToken !== "your_token_here") {
                                                // Action A: Public comment reply
                                                if (auto.publicReplyText) {
                                                    try {
                                                        // DMOrbit Anti-Spam: Human-like Public Comment Replies Pool
                                                        const publicReplyVariations = [
                                                            "Check your DM 👋",
                                                            "Kripya apna DM check karein ✨",
                                                            "Sent! Please check your inbox 📥",
                                                            "Aapke DM me details bhej di hain 🙌",
                                                            "Details sent to your DMs! Check it out 🚀",
                                                            "Inbox check kijiye, bhej diya hai 👍",
                                                            "Check your messages, just dropped the link! 🔥",
                                                            "Dropped a message in your DM, buddy! See you there 💥",
                                                            "Kindly check your message requests/inbox 📩",
                                                            "Sent! Check your primary or request folder 👋"
                                                        ];

                                                        // Pick a completely random reply from the pool to avoid robotic footprint
                                                        const finalRandomReply = publicReplyVariations[Math.floor(Math.random() * publicReplyVariations.length)];
                                                        
                                                        // Use the user's custom reply if defined (and not the default), otherwise spin from the safe pool
                                                        const messageToSend = (auto.publicReplyText && auto.publicReplyText !== 'Check your DM 👋') 
                                                            ? auto.publicReplyText 
                                                            : finalRandomReply;

                                                        const repliesUrl = `https://graph.facebook.com/v21.0/${commentId}/replies`;
                                                        await axios.post(repliesUrl, {
                                                            message: messageToSend,
                                                            access_token: pageToken
                                                        });
                                                        console.log(`[SIMPLIFIED SUCCESS] Public reply sent to comment: ${commentId} ("${messageToSend}")`);
                                                    } catch (err) {
                                                        console.error("[SIMPLIFIED ERROR] Failed public reply:", err.response?.data || err.message);
                                                    }
                                                }

                                                // Action B: Private inbox DM
                                                if (auto.privateMessageText && userId) {
                                                    try {
                                                        // Send Initial Access Card instead of plain text
                                                        await sendInitialAccessCard(userId, pageToken);
                                                        console.log(`[SIMPLIFIED SUCCESS] Follow-Gate Initial Card sent to user: ${userId}`);
                                                        await User.updateOne({ _id: ownerId }, { $inc: { dmCountThisMonth: 1 } });
                                                    } catch (err) {
                                                        console.error("[SIMPLIFIED ERROR] Failed private DM:", err.response?.data || err.message);
                                                    }
                                                }
                                            } else {
                                                console.warn("[SIMPLIFIED SIMULATION] No valid token, skipping real API calls.");
                                            }

                                            // Log success triggers in DB for Dashboard metrics
                                            await Automation.findByIdAndUpdate(auto._id, { $inc: { triggerCount: 1 } });
                                            await Log.create({
                                                ownerId,
                                                username: targetUsername || 'unknown',
                                                user_id: userId,
                                                keyword: auto.keyword || 'ANY_COMMENT',
                                                dmLink: 'Simplified Direct Call',
                                                metadata: { comment_id: commentId, automationId: auto._id },
                                                platform: 'instagram',
                                                timestamp: new Date()
                                            });
                                        }

                                        // --- 2. Start Flow if attached ---
                                        if (auto.flowId) {
                                            const existingState = await FlowState.findOne({
                                                flowId: auto.flowId,
                                                ig_user_id: userId,
                                                status: 'active'
                                            });
                                            if (!existingState) {
                                                const flow = await Flow.findById(auto.flowId);
                                                if (flow && flow.isActive && flow.steps.length > 0) {
                                                    const firstStep = flow.steps.find(s => s.order === 0) || flow.steps[0];
                                                    await FlowState.create({
                                                        flowId: auto.flowId,
                                                        automationId: auto._id,
                                                        ownerId: auto.userId,
                                                        ig_user_id: userId,
                                                        currentStep: firstStep.order,
                                                        nextSendAt: new Date(Date.now() + 5000), // 5s delay for first step
                                                        metadata: { comment_id: commentId, ig_id: entry.id }
                                                    });
                                                    console.log(`[FLOW ENGINE] Started flow ${auto.flowId} for user ${userId}`);
                                                }
                                            } else {
                                                console.log(`[FLOW ENGINE] User ${userId} already has active flow state, skipping.`);
                                            }
                                        }

                                        // --- 3. Queue immediate DM actions into BullMQ (Playwright) ---
                                        for (const action of auto.actions) {
                                            if (action.type === 'send_dm' || action.type === 'reply_comment') {
                                                console.log(`[KEYWORD MATCHED] "${normalizedText}" matches keyword in automation ${auto._id}`);
                                                
                                                // Create Job for UI visibility
                                                const job = await Job.create({
                                                    automationId: auto._id,
                                                    userId: auto.userId,
                                                    user_id: userId,
                                                    username: targetUsername,
                                                    platform: "instagram",
                                                    message: action.text,
                                                    type: 'reply_comment', 
                                                    process_after: Date.now(),
                                                    metadata: { 
                                                        comment_id: commentId, 
                                                        media_id: mediaId,
                                                        ig_id: entry.id,
                                                        original_text: commentText,
                                                        public_reply: true,
                                                        post_url: postUrl
                                                    },
                                                    status: "pending"
                                                });
                                                
                                                // OFFICIAL API WORKER will pick this up from the DB
                                                console.log(`[OFFICIAL QUEUED] DB ID: ${job._id} | Target: ${targetUsername}`);
                                                
                                                // FALLBACK: Only push to browser worker if specific conditions met (e.g., safeMode OFF)
                                                // Currently bypassed for Meta App Review readiness
                                                /*
                                                await JobQueue.addJob({
                                                    jobId: job._id.toString(),
                                                    userId: auto.userId,
                                                    commentId: commentId,
                                                    targetId: userId,
                                                    targetUsername: targetUsername,
                                                    customMessage: action.text,
                                                    postUrl: postUrl,
                                                    isSafeMode: true
                                                });
                                                */
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return res.status(200).send('EVENT_RECEIVED');
        } catch (err) {
            console.error("[WEBHOOK ERROR] Processing failed:", err);
            return res.status(500).send('INTERNAL_SERVER_ERROR');
        }
    }
    return res.status(404).json({ error: "Unsupported event object", received: body.object });
});

// DEPRECATED: Removed redundant/simulator routes in favor of unified /webhook

// Toggle Automation
app.put('/api/automations/:id/toggle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const auto = await Automation.findOne({ _id: id, userId: req.user.userId });
    
    if (!auto) {
        return res.status(404).json({ error: 'Automation not found' });
    }

    auto.isActive = !auto.isActive;
    await auto.save();

    res.status(200).json({ message: 'Status updated', isActive: auto.isActive });
});

// Delete Automation
app.delete('/api/automations/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const result = await Automation.deleteOne({ _id: id, userId: req.user.userId });
    
    if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Automation not found or unauthorized' });
    }

    res.status(200).json({ message: 'Automation deleted' });
});

// --- END ENGINE ROUTES ---

// Admin API Routes
app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAutomations = await Automation.countDocuments();
        const logs = await Log.find({});
        const totalDMs = logs.length;

        // Aggregate trigger counts
        const automations = await Automation.find({});
        const totalTriggers = automations.reduce((sum, a) => sum + (a.triggerCount || 0), 0);

        // Find Top Keyword
        const topAuto = automations.sort((a, b) => (b.triggerCount || 0) - (a.triggerCount || 0))[0];
        const mostUsedKeyword = (topAuto && topAuto.trigger && topAuto.trigger.keywords) ? topAuto.trigger.keywords[0] : "-";

        res.status(200).json({
            totalUsers,
            totalAutomations,
            totalDMs,
            totalTriggers,
            mostUsedKeyword
        });
    } catch (err) {
        console.error("[ADMIN STATS ERROR]:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/admin/automations', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const automations = await Automation.find({});
        const users = await User.find({}, 'email _id');
        const userMap = users.reduce((acc, u) => { acc[u._id] = u.email; return acc; }, {});

        const result = automations.map(a => ({
            id: a._id,
            name: a.name,
            ownerEmail: userMap[a.userId] || 'unknown',
            keywords: a.trigger?.keywords || [],
            isActive: a.isActive,
            triggerCount: a.triggerCount
        }));
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/admin/logs', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const logs = await Log.find({}).sort({ timestamp: -1 }).limit(100);
        res.status(200).json({ dmLogs: logs });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Hard Test Endpoint for Telegram
app.post('/test-send', async (req, res) => {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    try {
        console.log(`[TEST] Manually triggering sendTelegramDM to: ${user_id}`);
        const result = await sendTelegramDM(user_id, "TEST MESSAGE FROM DMOrbit 🚀");
        res.status(200).json({ success: true, message: "Test message sent", result });
    } catch (error) {
        console.error(`[TEST] Failed manual send:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Operational Monitoring Panel (Admin)
app.get('/api/admin/system', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const browserStats = browserManager.getMemoryStats();
        const totalUsers = await User.countDocuments();
        const connectedUsers = await User.countDocuments({ instagramConnected: true });
        const pendingJobs = await Job.countDocuments({ status: 'pending' });
        const failedJobs = await Job.countDocuments({ status: 'failed' });
        const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);

        res.status(200).json({
            browsers: browserStats,
            users: { total: totalUsers, connected: connectedUsers },
            queue: { pending: pendingJobs, failed: failedJobs },
            recentActivity: recentJobs,
            uptime: process.uptime(),
            nodeVersion: process.version
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// PHASE 2 — FLOW ENGINE API ROUTES
// =============================================

// --- FLOWS CRUD ---

// Create Flow
app.post('/api/flows', authenticateToken, async (req, res) => {
    try {
        const { name, steps } = req.body;
        if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({ error: 'Flow name and at least one step are required.' });
        }
        // Enforce step order
        const normalizedSteps = steps.map((s, i) => ({ ...s, order: i }));
        const flow = await Flow.create({ userId: req.user.userId, name, steps: normalizedSteps });
        res.status(201).json({ success: true, flow });
    } catch (err) {
        console.error('[API] Create Flow error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get All Flows
app.get('/api/flows', authenticateToken, async (req, res) => {
    try {
        const flows = await Flow.find({ userId: req.user.userId });
        res.status(200).json(flows);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Single Flow
app.get('/api/flows/:id', authenticateToken, async (req, res) => {
    try {
        const flow = await Flow.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!flow) return res.status(404).json({ error: 'Flow not found' });
        res.status(200).json(flow);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update Flow
app.put('/api/flows/:id', authenticateToken, async (req, res) => {
    try {
        const { name, steps, isActive } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (steps !== undefined) update.steps = steps.map((s, i) => ({ ...s, order: i }));
        if (isActive !== undefined) update.isActive = isActive;

        const flow = await Flow.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            update, { new: true }
        );
        if (!flow) return res.status(404).json({ error: 'Flow not found' });
        res.status(200).json({ success: true, flow });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete Flow
app.delete('/api/flows/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Flow.deleteOne({ _id: req.params.id, userId: req.user.userId });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Flow not found' });
        // Detach from automations
        await Automation.updateMany({ flowId: req.params.id, userId: req.user.userId }, { $set: { flowId: null } });
        res.status(200).json({ success: true, message: 'Flow deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- UPDATED AUTOMATION CRUD ---

// Create Automation (Phase 2 — supports flow attachment & multi-keyword)
app.post('/api/v2/automations', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') return res.status(403).json({ error: 'Admin cannot create automations.' });

        const { name, keywords, dmMessage, flowId, target, mode } = req.body;

        // Keyword mode requires at least one keyword
        if (mode !== 'any_comment' && (!keywords || !Array.isArray(keywords) || keywords.length === 0)) {
            return res.status(400).json({ error: 'At least one keyword is required for keyword mode.' });
        }

        const plan = req.user.plan || 'free';
        const limit = plan === 'pro' ? 20 : 3;
        const count = await Automation.countDocuments({ userId: req.user.userId });
        if (count >= limit) {
            return res.status(403).json({ error: `Free plan limit reached (${limit} automations). Upgrade to Pro.` });
        }

        const actions = [];
        if (dmMessage) actions.push({ type: 'send_dm', text: dmMessage });

        const auto = await Automation.create({
            userId: req.user.userId,
            name: name || `Automation #${count + 1}`,
            platform: 'instagram',
            target: target || { type: 'global' },
            mode: mode || 'keyword',
            trigger: { type: 'comment', keywords: keywords ? keywords.map(k => k.toLowerCase().trim()) : [] },
            actions,
            flowId: flowId || null,
            isActive: true,
            
            // Populate simplified fields for direct compatibility
            postId: target && target.type === 'specific' ? target.mediaId : null,
            triggerType: (mode || 'keyword') === 'any_comment' ? 'ANY_COMMENT' : 'KEYWORD',
            keyword: keywords && keywords.length > 0 ? keywords[0] : '',
            publicReplyText: 'Check your DM 👋',
            privateMessageText: dmMessage
        });

        res.status(201).json({ success: true, automation: auto });
    } catch (err) {
        console.error('[API] Create Automation error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get All Automations (V2 with enriched data)
app.get('/api/v2/automations', authenticateToken, async (req, res) => {
    try {
        const automations = await Automation.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        const enriched = await Promise.all(automations.map(async (a) => {
            const lastJob = await Job.findOne({ automationId: a._id }).sort({ createdAt: -1 });
            const activeFlowStates = await FlowState.countDocuments({ automationId: a._id, status: 'active' });
            return {
                ...a.toObject(),
                lastJobStatus: lastJob ? lastJob.status : null,
                activeFlowStates
            };
        }));
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update Automation (V2)
app.put('/api/v2/automations/:id', authenticateToken, async (req, res) => {
    try {
        const { name, keywords, dmMessage, flowId, isActive, target, mode } = req.body;
        const updateData = {};
        
        if (name !== undefined) updateData.name = name;
        if (keywords !== undefined) updateData['trigger.keywords'] = keywords.map(k => k.toLowerCase().trim());
        if (dmMessage !== undefined) updateData['actions.0.text'] = dmMessage;
        if (flowId !== undefined) updateData.flowId = flowId || null;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (target !== undefined) updateData.target = target;
        if (mode !== undefined) updateData.mode = mode;

        const auto = await Automation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { $set: updateData },
            { new: true }
        );

        if (!auto) return res.status(404).json({ error: 'Automation not found' });
        res.status(200).json({ success: true, automation: auto });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- DASHBOARD ANALYTICS API ---

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const dayAgo = new Date(now - 86400000);
        const weekAgo = new Date(now - 7 * 86400000);

        const [
            totalAutomations, activeAutomations,
            totalJobs, pendingJobs, completedJobs, failedJobs,
            totalFlows, activeFlowStates,
            logsToday, logsThisWeek,
            igAccount
        ] = await Promise.all([
            Automation.countDocuments({ userId }),
            Automation.countDocuments({ userId, isActive: true }),
            Job.countDocuments({ userId }),
            Job.countDocuments({ userId, status: 'pending' }),
            Job.countDocuments({ userId, status: 'done' }),
            Job.countDocuments({ userId, status: 'failed' }),
            Flow.countDocuments({ userId }),
            FlowState.countDocuments({ ownerId: userId, status: 'active' }),
            Log.countDocuments({ ownerId: userId, timestamp: { $gte: dayAgo } }),
            Log.countDocuments({ ownerId: userId, timestamp: { $gte: weekAgo } }),
            InstagramAccount.findOne({ userId }),
            User.findById(userId)
        ]);

        const topAutomation = await Automation.findOne({ userId }).sort({ triggerCount: -1 });

        res.status(200).json({
            automations: { total: totalAutomations, active: activeAutomations },
            jobs: { total: totalJobs, pending: pendingJobs, completed: completedJobs, failed: failedJobs },
            flows: { total: totalFlows, activeStates: activeFlowStates },
            logs: { today: logsToday, thisWeek: logsThisWeek },
            totalDmsSent: userDoc?.dmCountThisMonth || 0,
            topKeyword: topAutomation?.trigger?.keywords?.[0] || null,
            instagramConnected: !!igAccount,
            plan: req.user.plan || 'free'
        });
    } catch (err) {
        console.error('[DASHBOARD STATS ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- DM LOGS API ---

app.get('/api/logs', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const logs = await Log.find({ ownerId: req.user.userId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Log.countDocuments({ ownerId: req.user.userId });
        res.status(200).json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- WEBHOOK LOGS API (Admin & Dashboard) ---

app.get('/api/webhook-logs', authenticateToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        let query = {};

        if (req.user.role !== 'admin') {
            // Find the page_id for this user to filter logs
            const account = await InstagramAccount.findOne({ userId: req.user.userId });
            if (!account) return res.status(200).json([]); // No account, no logs
            
            // WebhookLog entry has entry[0].id (Page/Account ID)
            query = { "entry.id": account.page_id };
        }

        const logs = await WebhookLog.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- ACCOUNT STATUS API ---

app.get('/api/account/status', authenticateToken, async (req, res) => {
    try {
        const igAccount = await InstagramAccount.findOne({ userId: req.user.userId });
        const automationCount = await Automation.countDocuments({ userId: req.user.userId });
        const flowCount = await Flow.countDocuments({ userId: req.user.userId });
        const user = await User.findById(req.user.userId).select('-password');

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan || 'free',
                createdAt: user.createdAt
            },
            instagram: igAccount ? {
                connected: true,
                instagram_id: igAccount.instagram_id,
                page_id: igAccount.page_id,
                status: igAccount.status,
                safeMode: igAccount.safeMode,
                updatedAt: igAccount.updatedAt
            } : { connected: false },
            usage: {
                automations: automationCount,
                automationLimit: (user.plan === 'pro') ? 20 : 3,
                flows: flowCount
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- FLOW STATES API ---

app.get('/api/flow-states', authenticateToken, async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        const query = { ownerId: req.user.userId };
        if (status) query.status = status;
        const states = await FlowState.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
        res.status(200).json(states);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =============================================
// END PHASE 2 ROUTES
// =============================================

const http = require('http');
const WebSocket = require('ws');
const LoginPortal = require('./browser/LoginPortal');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Interactive Login Portal
const loginPortal = new LoginPortal(wss);

// --- ENGAGEMENT PORTAL (Legacy Support) ---
app.get('/api/debug/portal-error', (req, res) => {
    res.status(200).json({ error: global.lastPortalError || 'No error captured yet' });
});

app.post('/api/engagement/portal', authenticateToken, async (req, res) => {
    try {
        const sessionId = await loginPortal.initiateLogin(req.user.userId);
        res.status(200).json({ success: true, sessionId });
    } catch (err) {
        global.lastPortalError = err.message + '\n' + err.stack;
        console.error('[PORTAL API ERROR]', err);
        res.status(500).json({ error: 'Failed to initiate secure browser session: ' + err.message });
    }
});

server.listen(PORT, () => {
    console.log(`Server and WS Portal running on port ${PORT}`);
    console.log("Webhook URL ready");
});
