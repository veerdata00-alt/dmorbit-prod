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

// --- CANONICAL DOMAIN REDIRECT ---
// Force traffic from railway domain to dmorbit.in
app.use((req, res, next) => {
    if (req.hostname && req.hostname.endsWith('railway.app')) {
        return res.redirect(301, `https://dmorbit.in${req.originalUrl}`);
    }
    next();
});

// DMOrbit Tier Limits Verification Middleware
async function checkPlanLimits(req, res, next) {
    const { userId } = req.body || req.query;
    if (!userId) return next();
    try {
        const user = await User.findById(userId);
        if (!user) return next();
        
        const limitStatus = await checkAutomationLimits(user);
        if (!limitStatus.allowed) {
            return res.status(403).json({ success: false, message: "Monthly DM limit reached for your plan." });
        }
        next();
    } catch (err) { next(); }
}

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
const APP_SECRET = (process.env.FB_APP_SECRET || process.env.APP_SECRET || '').trim();
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
    priority: { type: String, enum: ['high', 'low'], default: 'low', index: true },
    chargeCredit: { type: Boolean, default: true },
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

// --- DM Session State Tracking ---
const dmSessionSchema = new mongoose.Schema({
    userId: { type: String, index: true },       // The DMOrbit owner
    targetId: { type: String, index: true },     // The follower's IG ID
    automationId: { type: String, index: true },
    mediaId: { type: String },
    currentStep: { type: String, default: 'start' }, 
    lastMessageType: String,
    lastTriggeredAt: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false },
    awaitingFollowCheck: { type: Boolean, default: false },
    warningSent: { type: Boolean, default: false },
    cooldownUntil: Date,
    clickCount: { type: Number, default: 0 },
    processing: { type: Boolean, default: false },
    processingAt: Date
});

// Enforce strictly ONE active session per user+target+automation
dmSessionSchema.index(
    { userId: 1, targetId: 1, automationId: 1 }, 
    { unique: true, partialFilterExpression: { isCompleted: false } }
);

const DMSession = mongoose.model('DMSession', dmSessionSchema);

// --- NEW SAAS DATABASE DRIVEN PLAN SCHEMA ---
const planSchema = new mongoose.Schema({
    planId: { type: String, unique: true }, // 'FREE', 'CREATOR', 'PRO'
    name: String,
    monthlyDMLimit: Number,
    rolloverRules: Boolean,
    topupAllowed: Boolean,
    connectedAccountLimit: Number,
    automationLimit: Number,
    smartBioAccess: Boolean,
    queuePriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    rolloverCapMultiplier: { type: Number, default: 1 },
    price: Number
});
const Plan = mongoose.model('Plan', planSchema);

// --- NEW GLOBAL PLATFORM SETTINGS SCHEMA ---
const globalSettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
});
const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

const automationSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    name: { type: String, default: 'Untitled Automation' },
    platform: { type: String, default: 'instagram' },
    target: {
        type: { type: String, enum: ['global', 'specific', 'multiple'], default: 'global' },
        mediaId: { type: String, index: true }, // Specific Post/Reel ID
        mediaIds: [{ type: String }], // Multi-post targeting
        mediaUrl: String,
        mediaThumbnail: String
    },
    mode: { type: String, enum: ['keyword', 'any_comment'], default: 'keyword' },
    status: { type: String, enum: ['draft', 'active', 'paused', 'deleted'], default: 'active' },
    deletedAt: { type: Date, default: null },
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
    triggerType: { type: String, enum: ['KEYWORD', 'ANY_COMMENT', 'STORY_REPLY', 'STORY_MENTION'] },
    keyword: String,
    listenerType: { type: String, enum: ['MESSAGE', 'SMART_AI'], default: 'MESSAGE' },
    aiPrompt: { type: String, default: '' },
    publicReplyText: String,
    privateMessageText: String,
    
    // Campaign-first fields
    campaignType: { type: String, enum: ['COMMENT_DM', 'COMMENT_REPLY', 'STORY_REPLY', 'DM_KEYWORD', 'STORY_MENTION'] }, // Comment -> DM, Story Reply, DM Keyword, Comment Reply, Story Mention
    templateType: { type: String },
    followGate: { type: Boolean, default: false },
    leadFields: [String],
    excludedPosts: [String],
    targetMediaIds: [String],
    capturePageViews: { type: Number, default: 0 }
});
const Automation = mongoose.model('Automation', automationSchema);

const leadSchema = new mongoose.Schema({
    userId: { type: String, index: true }, // DMOrbit owner ID
    automationId: { type: String, index: true },
    campaignSource: { type: String },
    triggerKeyword: { type: String },
    sourcePost: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    capturedAt: { type: Date, default: Date.now, index: true }
});
const Lead = mongoose.model('Lead', leadSchema);

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: { type: String },
    firebaseId: { type: String, index: true },
    profilePicture: String,
    name: { type: String },
    fullName: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    role: { type: String, default: 'user' },
    plan: { type: String, enum: ['FREE', 'BASIC', 'PRO', 'CREATOR', 'free', 'basic', 'pro', 'creator'], default: 'FREE' },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    subscriptionStatus: { type: String, enum: ['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'], default: null },
    billingCycleStart: { type: Date },
    billingCycleEnd: { type: Date },
    leadQuotaExceeded: { type: Boolean, default: false },
    dmCountThisMonth: { type: Number, default: 0 },
    rolloverDms: { type: Number, default: 0 },
    topups: [{
        credits: { type: Number, required: true },
        purchasedAt: { type: Date, default: Date.now }
    }],
    instagramConnected: { type: Boolean, default: false },
    lastInstagramUsername: { type: String, default: null },
    smartBio: {
        profileImg: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        links: [{
            title: String,
            url: String,
            clicks: { type: Number, default: 0 }
        }]
    },
    suspended: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    featureFlags: { type: [String], default: [] },
    billingCycleResetDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    adminEmail: { type: String, required: true },
    targetUserId: { type: String },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

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

const processedEventSchema = new mongoose.Schema({
    fingerprint: { type: String, unique: true, index: true },
    createdAt: { type: Date, default: Date.now, expires: '1h' } // Auto-delete after 1 hour
});
const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema);

const instagramAccountSchema = new mongoose.Schema({
    userId: { type: String, unique: true, index: true },
    facebookUserId: String, // Store FB User ID to correlate with Meta Data Deletion callback
    page_id: String,
    instagram_id: String,
    access_token: String,
    username: String,
    profile_picture_url: String,
    name: String,
    status: { type: String, enum: ['active', 'expired', 'invalid', 'needs_reconnect', 'rate_limited', 'paused'], default: 'active' },
    safeMode: { type: Boolean, default: true }, // Default ON for Beta
    lastErrorCode: String,
    lastErrorMessage: String,
    lastFailureAt: Date,
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

// Add COOP header to fix Firebase Auth popups
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});
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
        let decoded;
        decoded = jwt.verify(token, JWT_SECRET);

        if (decoded) {
            const dbUser = await User.findById(decoded.userId || decoded.id);
            if (dbUser && (dbUser.suspended || dbUser.banned)) {
                if (isHtmlRequest(req)) return res.redirect('/?error=suspended');
                return res.status(403).json({ error: 'Your account is suspended or banned.' });
            }
            req.user = decoded;
            
            // --- Read-Only Impersonator Block ---
            if (req.user.impersonatorId && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                const allowedPaths = ['/api/admin/impersonate/exit', '/api/instagram/refresh-profile', '/api/logout'];
                if (!allowedPaths.includes(req.path)) {
                    return res.status(403).json({ error: "Read-only mode active: Modifications are disabled during impersonation." });
                }
            }

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//                  ADMIN API ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Admin Dashboard Statistics Widget Aggregates
app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const paidUsers = await User.countDocuments({ plan: { $in: ['CREATOR', 'PRO', 'creator', 'pro', 'BASIC', 'basic'] } });
        const totalAutomations = await Automation.countDocuments({ status: { $ne: 'deleted' } });
        const activeAutomations = await Automation.countDocuments({ isActive: true });
        
        // DMs sent today
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const totalDMs = await Log.countDocuments({ dmCount: { $gt: 0 }, timestamp: { $gte: startOfToday } });
        
        // Failed jobs & queue metrics
        const failedDMs = await Job.countDocuments({ status: 'failed' });
        const queueSize = await Job.countDocuments({ status: 'pending' });
        const delayedJobs = await Job.countDocuments({ status: 'pending', process_after: { $gt: Date.now() } });

        // Meta connection token health summary
        const accounts = await InstagramAccount.find();
        let metaApiHealth = 'GOOD';
        if (accounts.length > 0) {
            const hasExpired = accounts.some(acc => acc.status === 'expired' || acc.status === 'invalid');
            if (hasExpired) metaApiHealth = 'WARNING';
        }

        // Webhook processed health in last hour
        const lastHour = new Date(Date.now() - 3600000);
        const webhookEventsCount = await WebhookEvent.countDocuments({ createdAt: { $gte: lastHour } });
        const webhookHealth = webhookEventsCount > 0 ? 'HEALTHY' : 'INACTIVE';

        // Signup Trend (last 7 days)
        const recentSignupTrend = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setHours(0,0,0,0);
            start.setDate(start.getDate() - i);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            
            const count = await User.countDocuments({ createdAt: { $gte: start, $lt: end } });
            recentSignupTrend.push({
                date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count
            });
        }

        res.json({
            totalUsers,
            paidUsers,
            totalAutomations,
            activeAutomations,
            totalDMs,
            failedDMs,
            queueSize,
            delayedJobs,
            metaApiHealth,
            webhookHealth,
            recentSignupTrend
        });
    } catch (err) {
        logger.error("[ADMIN STATS ERROR]", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. User Management Search and Advanced Filtering
app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { search, plan, igUsername, tokenStatus } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }
        if (plan) {
            query.plan = plan.toUpperCase();
        }
        
        let users = await User.find(query).sort({ createdAt: -1 }).lean();
        
        const accounts = await InstagramAccount.find().lean();
        const accountsMap = {};
        accounts.forEach(acc => {
            accountsMap[acc.userId.toString()] = acc;
        });

        let enrichedUsers = [];
        for (let user of users) {
            const acc = accountsMap[user._id.toString()];
            user.instagramAccount = acc || null;
            user.instagramUsername = acc ? acc.username : null;
            user.tokenHealth = acc ? (acc.status === 'active' ? 'GOOD' : 'Needs Reconnect') : 'not_connected';
            
            user.dmUsage = user.dmCountThisMonth || 0;
            user.rolloverBalance = user.rolloverDms || 0;
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const activeTopups = (user.topups || []).filter(t => new Date(t.purchasedAt) >= ninetyDaysAgo);
            user.topupBalance = activeTopups.reduce((sum, t) => sum + Number(t.credits || 0), 0);
            
            // Stripe Info
            user.stripeCustomerId = user.stripeCustomerId || null;
            user.stripeSubscriptionId = user.stripeSubscriptionId || null;
            user.subscriptionStatus = user.subscriptionStatus || null;
            user.billingCycleEnd = user.billingCycleEnd || user.billingCycleResetDate || null;

            user.automationCount = await Automation.countDocuments({ userId: user._id.toString(), status: { $ne: 'deleted' } });
            user.queueUsage = await Job.countDocuments({ userId: user._id.toString(), status: 'pending' });

            enrichedUsers.push(user);
        }

        if (igUsername) {
            enrichedUsers = enrichedUsers.filter(u => u.instagramUsername && u.instagramUsername.toLowerCase().includes(igUsername.toLowerCase()));
        }
        if (tokenStatus) {
            enrichedUsers = enrichedUsers.filter(u => u.tokenHealth && u.tokenHealth.toLowerCase() === tokenStatus.toLowerCase());
        }

        res.json(enrichedUsers);
    } catch (err) {
        logger.error("[ADMIN USERS ERROR]", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. User Detail Fetch
app.get('/api/admin/users/:userId', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const acc = await InstagramAccount.findOne({ userId: user._id.toString() }).lean();
        user.instagramAccount = acc || null;
        user.instagramUsername = acc ? acc.username : null;
        user.tokenHealth = acc ? (acc.status === 'active' ? 'GOOD' : 'Needs Reconnect') : 'not_connected';
        user.automationCount = await Automation.countDocuments({ userId: user._id.toString(), status: { $ne: 'deleted' } });
        user.queueUsage = await Job.countDocuments({ userId: user._id.toString(), status: 'pending' });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Upgrade / Downgrade User Plan
app.post('/api/admin/users/:userId/plan', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { plan } = req.body;
        if (!['FREE', 'CREATOR', 'PRO'].includes(plan.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid plan. Must be FREE, CREATOR, or PRO.' });
        }
        const user = await User.findByIdAndUpdate(req.params.userId, { plan: plan.toUpperCase() }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Adjust Creator Rollover & Topup Credit Balances
app.post('/api/admin/users/:userId/credits', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { action, amount, type } = req.body; // action: 'add' | 'remove', type: 'rollover' | 'topup'
        const val = Number(amount);
        if (isNaN(val) || val <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (type === 'rollover') {
            if (action === 'add') {
                user.rolloverDms = (user.rolloverDms || 0) + val;
            } else {
                user.rolloverDms = Math.max(0, (user.rolloverDms || 0) - val);
            }
        } else if (type === 'topup') {
            if (action === 'add') {
                user.topups.push({ credits: val, purchasedAt: new Date() });
            } else {
                let remainingToRemove = val;
                for (let i = user.topups.length - 1; i >= 0; i--) {
                    if (user.topups[i].credits > remainingToRemove) {
                        user.topups[i].credits -= remainingToRemove;
                        remainingToRemove = 0;
                        break;
                    } else {
                        remainingToRemove -= user.topups[i].credits;
                        user.topups.splice(i, 1);
                    }
                }
            }
        }
        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Suspend / Ban / Unsuspend User
app.post('/api/admin/users/:userId/suspend', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { suspend, ban } = req.body;
        const updates = {};
        if (suspend !== undefined) updates.suspended = !!suspend;
        if (ban !== undefined) updates.banned = !!ban;
        
        const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Delete Creator Profile & Associated Resources Completely
app.delete('/api/admin/users/:userId', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        await User.findByIdAndDelete(userId);
        await InstagramAccount.deleteMany({ userId });
        await Automation.deleteMany({ userId });
        await Flow.deleteMany({ userId });
        await Job.deleteMany({ userId });
        await Log.deleteMany({ ownerId: userId });
        res.json({ success: true, message: 'User and all resources cleared.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Secure Admin User Impersonation Token Issuer
app.post('/api/admin/users/:userId/impersonate', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        if (req.user.impersonatorId) {
            return res.status(403).json({ error: 'Nested impersonation is not allowed.' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = jwt.sign({ 
            userId: user._id, 
            email: user.email, 
            role: user.role,
            impersonatedBy: req.user.email,
            impersonatorId: req.user.userId || req.user.id
        }, JWT_SECRET, { expiresIn: '15m' });

        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000
        });

        await AuditLog.create({
            action: 'STARTED_IMPERSONATION',
            adminEmail: req.user.email,
            targetUserId: user._id.toString(),
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }).catch(e => console.error("Audit log failed:", e.message));

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/impersonate/exit', authenticateToken, async (req, res) => {
    try {
        if (!req.user.impersonatorId) {
            return res.status(400).json({ error: 'Not in an active impersonation session' });
        }

        const adminUser = await User.findById(req.user.impersonatorId);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ error: 'Failed to restore admin session: Invalid admin' });
        }

        const token = jwt.sign({ 
            userId: adminUser._id, 
            email: adminUser.email, 
            role: 'admin' 
        }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        await AuditLog.create({
            action: 'EXITED_IMPERSONATION',
            adminEmail: adminUser.email,
            targetUserId: req.user.userId,
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }).catch(e => console.error("Audit log failed:", e.message));

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/audit-logs', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { adminEmail, targetUserId, action } = req.query;
        let query = {};
        if (adminEmail) query.adminEmail = adminEmail;
        if (targetUserId) query.targetUserId = targetUserId;
        if (action) query.action = action;

        const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Update Per-User Feature Access Flags
app.post('/api/admin/users/:userId/flags', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { flags } = req.body;
        if (!Array.isArray(flags)) return res.status(400).json({ error: 'flags must be an array of strings' });
        
        const user = await User.findByIdAndUpdate(req.params.userId, { featureFlags: flags }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Database-Driven Plans Manager
app.get('/api/admin/plans', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const plans = await Plan.find().sort({ price: 1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/plans/:planId', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const plan = await Plan.findOneAndUpdate({ planId: req.params.planId.toUpperCase() }, updates, { new: true });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json({ success: true, plan });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Public Plans API (For Dashboard) ---
app.get('/api/public/plans', async (req, res) => {
    try {
        const plans = await Plan.find({}, 'planId name price monthlyDMLimit').sort({ price: 1 });
        res.json({ success: true, plans });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Queue Pause / Resume Control
app.post('/api/admin/queue/control', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { paused } = req.body;
        await GlobalSettings.findOneAndUpdate(
            { key: 'queue_paused' },
            { key: 'queue_paused', value: !!paused },
            { upsert: true }
        );
        res.json({ success: true, paused: !!paused });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. Queue Bulk Retry Failed Jobs
app.post('/api/admin/queue/retry', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const result = await Job.updateMany(
            { status: 'failed' },
            { $set: { status: 'pending', attempts: 0, error: null } }
        );
        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13. Queue Wipe Out Clear
app.post('/api/admin/queue/clear', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.body; // 'failed' | 'pending' | 'all'
        let query = {};
        if (type === 'failed') query.status = 'failed';
        else if (type === 'pending') query.status = 'pending';
        
        const result = await Job.deleteMany(query);
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14. Global settings getters and updates
app.get('/api/admin/settings', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const settingsList = await GlobalSettings.find();
        const settings = {};
        settingsList.forEach(s => {
            settings[s.key] = s.value;
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/settings', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const updates = req.body;
        for (let key of Object.keys(updates)) {
            await GlobalSettings.findOneAndUpdate(
                { key },
                { key, value: updates[key] },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 15. Searchable logs timeline aggregates
app.get('/api/admin/logs', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { type, limit } = req.query; // type: 'webhook' | 'queue' | 'meta' | 'all'
        const maxLimit = Math.min(100, Number(limit) || 50);
        
        let results = [];
        
        if (!type || type === 'all' || type === 'webhook') {
            const webhookLogs = await WebhookLog.find().sort({ timestamp: -1 }).limit(maxLimit).lean();
            webhookLogs.forEach(wl => {
                results.push({
                    time: wl.timestamp,
                    type: 'WEBHOOK',
                    severity: 'INFO',
                    message: `Webhook received from source: ${wl.source || 'unknown'}`,
                    meta: wl.payload
                });
            });
        }
        
        if (!type || type === 'all' || type === 'queue') {
            const queueLogs = await Job.find({ status: { $in: ['done', 'failed', 'processing'] } }).sort({ createdAt: -1 }).limit(maxLimit).lean();
            queueLogs.forEach(ql => {
                results.push({
                    time: ql.createdAt,
                    type: 'QUEUE',
                    severity: ql.status === 'failed' ? 'ERROR' : 'INFO',
                    message: `Job type ${ql.type || 'send_dm'} status is '${ql.status}' for receiver ID ${ql.user_id}`,
                    meta: { error: ql.error, attempts: ql.attempts, delivery: ql.delivery_status }
                });
            });
        }

        if (!type || type === 'all' || type === 'meta') {
            const metaLogs = await Log.find().sort({ timestamp: -1 }).limit(maxLimit).lean();
            metaLogs.forEach(ml => {
                results.push({
                    time: ml.timestamp,
                    type: 'META',
                    severity: 'INFO',
                    message: `DM sent to ${ml.username || 'unknown'} for keyword '${ml.keyword || ''}'`,
                    meta: ml.metadata
                });
            });
        }

        results.sort((a, b) => new Date(b.time) - new Date(a.time));
        res.json(results.slice(0, maxLimit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/dashboard.html', authenticateToken, (req, res) => {
    // Admin should never land on user dashboard
    if (req.user.role === 'admin' || req.user.email === OWNER_EMAIL) {
        return res.redirect('/admin.html');
    }
    const query = req.query.connected ? '?connected=true' : '';
    res.redirect(`/home${query}`);
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
app.get('/google187b8d249eaf18ad.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'google187b8d249eaf18ad.html')));

app.use(express.static(path.join(__dirname, 'frontend/dist/client'))); // Serve React App

// Explicit root route: bypass public/index.html and render React Landing (frontend/src/routes/index.tsx)
app.get('/', (req, res, next) => {
    if (ssrHandler) return ssrHandler(req, res, next);
    next(); // fallback if SSR not loaded yet (cold start race)
});

app.use(express.static(path.join(__dirname, 'public'))); // Serve legacy static files (admin, capture, etc.)

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
        .update(req.rawBody || '')
        .digest('hex');

    if (signatureHash !== expectedHash) {
        console.warn(`[SECURITY] Invalid ${algorithm} signature detected!`);
        console.log(`[DEBUG] Received Signature: ${signatureHash}`);
        console.log(`[DEBUG] Expected Signature: ${expectedHash}`);
        console.log(`[DEBUG] Payload Length: ${req.rawBody ? req.rawBody.length : 0}`);
        console.log(`[DEBUG] Exact Bytes (hex): ${req.rawBody ? req.rawBody.toString('hex') : 'UNDEFINED'}`);
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
// Meta Error Handler for Rate Limits and Token Deaths
const handleMetaError = async (errorData, ownerId) => {
    if (!errorData || !errorData.error) return;
    const errorCode = errorData.error.code;
    const errorMessage = errorData.error.message || "Unknown Meta Error";

    if (errorCode === 190 || errorCode === 102) {
        console.error(`[FATAL TOKEN ERROR] Code ${errorCode}. Flagging account ${ownerId} as needs_reconnect.`);
        await InstagramAccount.findOneAndUpdate(
            { userId: ownerId },
            { 
                status: 'needs_reconnect',
                lastErrorCode: String(errorCode),
                lastErrorMessage: errorMessage,
                lastFailureAt: new Date()
            }
        );
    } else if (errorCode === 4 || errorCode === 17 || errorCode === 32) {
        console.warn(`[RATE LIMIT] Code ${errorCode} hit for account ${ownerId}.`);
        await InstagramAccount.findOneAndUpdate(
            { userId: ownerId },
            { 
                status: 'rate_limited',
                lastErrorCode: String(errorCode),
                lastErrorMessage: errorMessage,
                lastFailureAt: new Date()
            }
        );
    }
};

const sendInstagramDM = async (ownerId, targetId, message, igId = null) => {
    console.log(`[SEND] Instagram Standard DM to UserID: ${targetId} | Owner: ${ownerId}`);
    
    // 1. Fetch user specific token
    const account = await InstagramAccount.findOne({ userId: ownerId, status: 'active' }).sort({ updatedAt: -1 });
    if (!account || account.status !== 'active') {
        console.warn(`[SEND ABORTED] Instagram account is disconnected or inactive for owner: ${ownerId}`);
        return { success: false, error: "Instagram account is disconnected or inactive." };
    }
    const token = account.access_token;

    if (!token || token === "your_token_here") {
        console.warn("[SIMULATION MODE] No token for owner. Skipping real API call.");
        return { success: true, message_id: "sim_" + Date.now(), status: "simulated" };
    }

    // We MUST use Facebook Page ID for Instagram messages
    const endpointId = (account && account.page_id) || 'me';
    const url = `https://graph.facebook.com/v19.0/${endpointId}/messages`;
    
    let messagePayload = { text: message };
    // We allow passing structured payload via message object if metadata is not used directly,
    // but in DMOrbit we define the templateType in the queue job metadata.
    if (typeof message === 'object' && message.attachment) {
        messagePayload = message;
    }

    const payload = {
        recipient: { id: targetId },
        message: messagePayload
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
        
        await handleMetaError(errorData, ownerId);

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

    const account = await InstagramAccount.findOne({ userId: ownerId, status: 'active' }).sort({ updatedAt: -1 });
    if (!account || account.status !== 'active') {
        console.warn(`[SEND ABORTED] Instagram account is disconnected or inactive for owner: ${ownerId}`);
        return { success: false, error: "Instagram account is disconnected or inactive." };
    }
    const token = account.access_token;

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
        
        await handleMetaError(errorData, ownerId);
        
        return { 
            success: false, 
            error: errorData.error?.message || "Unknown error",
            code: errorData.error?.code 
        };
    }
};

// Instagram Private Reply (Comment Triggered)
const sendInstagramPrivateReply = async (ownerId, commentId, message, igId = null) => {
    console.log(`[SEND] Instagram Private Reply to CommentID: ${commentId} | Owner: ${ownerId}`);

    // 1. Fetch user specific token
    const account = await InstagramAccount.findOne({ userId: ownerId, status: 'active' }).sort({ updatedAt: -1 });
    if (!account || account.status !== 'active') {
        console.warn(`[SEND ABORTED] Instagram account is disconnected or inactive for owner: ${ownerId}`);
        return { success: false, error: "Instagram account is disconnected or inactive." };
    }
    const token = account.access_token;

    if (!token || token === "your_token_here") {
        console.warn("[SIMULATION MODE] No token for owner. Skipping real API call.");
        return { success: true, message_id: "sim_" + Date.now(), status: "simulated" };
    }

    // Use Page ID (page_id) or 'me' as required by Meta Send API, NOT Instagram Business Account ID (instagram_id)
    const endpointId = (account && account.page_id) || 'me';
    const url = `https://graph.facebook.com/v19.0/${endpointId}/messages`;
    
    let messagePayload = { text: message };
    if (typeof message === 'object' && message.attachment) {
        messagePayload = message;
    }

    const payload = {
        recipient: { comment_id: commentId },
        message: messagePayload
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

        await handleMetaError(errorData, ownerId);

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
        
        let finalMessage = message;
        if (metadata && metadata.templateType === 'initial_access') {
            const fallbackLink = metadata.targetLink || process.env.CLIENT_URL || "https://dmorbit.in";
            finalMessage = {
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
            };
        } else if (metadata && metadata.templateType === 'final_delivery') {
            const fallbackText = metadata.fallbackText || "This is what you asked for. Try it and let me know 👍";
            const targetLink = metadata.targetLink || process.env.CLIENT_URL || "https://dmorbit.in";
            finalMessage = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "Here you go 👇",
                            subtitle: fallbackText,
                            buttons: [{ type: "web_url", url: targetLink, title: "Click me" }]
                        }]
                    }
                }
            };
        } else if (metadata && metadata.templateType === 'follow_gate') {
            const profileUrl = metadata.profileUrl || "https://www.instagram.com/_u/dmorbitapp/";
            finalMessage = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "Looks like you're not following yet 👀",
                            subtitle: "Follow to unlock access.",
                            buttons: [
                                { type: "web_url", url: profileUrl, title: "Visit Profile" },
                                { type: "postback", title: "I'm following ✅", payload: "VERIFY_FOLLOW_CLICKED" }
                            ]
                        }]
                    }
                }
            };
        } else if (metadata && metadata.templateType === 'nice_try') {
            const profileUrl = metadata.profileUrl || "https://www.instagram.com/_u/dmorbitapp/";
            finalMessage = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "Nice try! But you're still not following yet 👀",
                            subtitle: "Please click 'Visit Profile' and follow to instantly unlock the access.",
                            buttons: [
                                { type: "web_url", url: profileUrl, title: "Visit Profile" },
                                { type: "postback", title: "I'm following ✅", payload: "VERIFY_FOLLOW_CLICKED" }
                            ]
                        }]
                    }
                }
            };
        }

        if (type === "reply_comment" || (metadata && metadata.comment_id)) {
            const commentId = metadata && metadata.comment_id;
            
            // 1. Send Public Reply first (optional, but requested)
            if (metadata.public_reply) {
                let replyText = metadata.public_reply_text || "Check your DM 👋";
                
                // NEW: Randomized Reply System (Category-Specific Pools)
                // If the frontend passed a JSON array of replies, randomly pick one to avoid spam
                if (replyText.startsWith('[') && replyText.endsWith(']')) {
                    try {
                        const arr = JSON.parse(replyText);
                        if (Array.isArray(arr) && arr.length > 0) {
                            replyText = arr[Math.floor(Math.random() * arr.length)];
                        }
                    } catch (e) {
                        console.warn("[QUEUE ENGINE] Failed to parse randomized public reply array. Using raw string.");
                    }
                }
                
                await sendInstagramPublicReply(ownerId, commentId, replyText);
            }

            // 2. Send Private Reply
            return await sendInstagramPrivateReply(ownerId, commentId, finalMessage, igId);
        } else {
            return await sendInstagramDM(ownerId, targetId, finalMessage, igId);
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

            // Sync User DM limits and Dashboard stats atomically
            if (job.chargeCredit !== false) {
                await User.updateOne({ _id: job.userId }, { $inc: { dmCountThisMonth: 1 } });
            }

            // Create Audit Log entry - Isolated by ownerId
            await Log.create({
                ownerId: job.userId,
                username: job.username || 'unknown',
                user_id: job.user_id,
                keyword: job.metadata?.kw || job.message,
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
        // Phase 1: Halt processing if account needs_reconnect
        const account = await InstagramAccount.findOne({ userId: item.userId });
        if (account && account.status === 'needs_reconnect') {
            logger.warn(`Job Paused | ID: ${jobId} | Reason: Account needs_reconnect. Will retry in 1 hour.`);
            await Job.findByIdAndUpdate(jobId, { process_after: Date.now() + 3600000 });
            return;
        }

        // Add artificial jitter (1-3s) to avoid burst detection, skip for high priority
        const jitter = item.priority === 'high' ? 0 : Math.floor(Math.random() * 2000) + 1000;
        if (jitter > 0) await new Promise(r => setTimeout(r, jitter));

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
            const errorCode = result ? result.code : null;

            // Phase 2: Meta Rate Limit Recovery
            if (errorCode === 4 || errorCode === 17 || errorCode === 32) {
                const attempts = (item.attempts || 0) + 1;
                if (attempts <= 5) {
                    // Exponential backoff: 5m, 15m, 30m, 60m, 60m
                    const backoffMinutes = attempts === 1 ? 5 : attempts === 2 ? 15 : attempts === 3 ? 30 : 60;
                    const backoffMs = backoffMinutes * 60 * 1000;
                    logger.warn(`Job Rate Limited | ID: ${jobId} | Attempt: ${attempts} | Retrying in ${backoffMinutes}m`);
                    await Job.findByIdAndUpdate(jobId, { 
                        status: 'rate_limited', 
                        error: `Rate Limit Hit (Code ${errorCode})`, 
                        process_after: Date.now() + backoffMs,
                        attempts: attempts
                    });
                } else {
                    logger.error(`Job Fatal | ID: ${jobId} | Max Rate Limit Retries Reached`);
                    await finalizeJob(jobId, "failed", `Max rate limit retries reached.`, "not_delivered");
                }
            } else {
                await finalizeJob(jobId, "failed", errorMsg, "not_delivered");
                logger.warn(`Job Failed | ID: ${jobId} | Reason: ${errorMsg}`);
            }
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

        console.log(`[WORKER] Attempting to lock and process ${pendingFollowups.length} scheduled follow-ups...`);

        for (const fu of pendingFollowups) {
            try {
                // DISTRIBUTED LOCKING
                const lockedFu = await Followup.findOneAndUpdate(
                    { _id: fu._id, status: "pending" },
                    { $set: { status: "processing" } },
                    { new: true }
                );

                if (!lockedFu) continue; // Another worker grabbed it

                // Use the ownerId stored in the followup to fetch correct token
                await sendDM("instagram", lockedFu.ownerId || "admin", lockedFu.user_id, lockedFu.message, {}, "send_dm");
                
                lockedFu.status = "sent";
                await lockedFu.save();
                
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
        let isPaused = false;
        let isMaintenance = false;
        let pacingDelay = 10000;
        try {
            const pausedSetting = await GlobalSettings.findOne({ key: 'queue_paused' });
            if (pausedSetting && pausedSetting.value === true) isPaused = true;
            const maintSetting = await GlobalSettings.findOne({ key: 'maintenance_mode' });
            if (maintSetting && maintSetting.value === true) isMaintenance = true;
            const pacingSetting = await GlobalSettings.findOne({ key: 'queue_pacing' });
            if (pacingSetting && pacingSetting.value !== undefined) pacingDelay = Number(pacingSetting.value);
        } catch (se) {
            console.error("[OFFICIAL WORKER] Global settings fetch error:", se.message);
        }

        if (isPaused || isMaintenance) {
            return;
        }

        const processingJobs = await Job.find({ status: "processing" });
        const maxParallel = 50; // Increased for scalability

        if (processingJobs.length >= maxParallel) return;

        const now = Date.now();
        // Fetch pending jobs (high priority first)
        const pendingJobs = await Job.find({ status: "pending" }).sort({ priority: 1, createdAt: 1 }).limit(50);
        
        if (pendingJobs.length === 0) return;

        const readyJobs = [];
        for (const item of pendingJobs) {
            if (readyJobs.length + processingJobs.length >= maxParallel) break;

            // Isolation: Only 1 active job per user (skip for high priority to allow instant sequences)
            if (item.priority !== 'high') {
                const isUserActive = processingJobs.some(pj => pj.user_id === item.user_id) || 
                                     readyJobs.some(rj => rj.user_id === item.user_id);
                if (isUserActive) continue;
            }

            if (item.platform === "instagram") {
                const ownerUser = await User.findById(item.userId);
                const ownerAccount = await InstagramAccount.findOne({ userId: item.userId });
                
                if (!ownerUser || !ownerUser.instagramConnected || !ownerAccount || ownerAccount.status !== 'active') {
                    console.warn(`[WORKER] Skipping and failing job ${item._id} due to disconnected Instagram account.`);
                    await Job.updateOne({ _id: item._id }, { status: 'failed', error: 'Paused: Instagram disconnected' });
                    continue; // Skip this job cleanly
                }

                // Safety delay (5s for low priority, 0s for high)
                const processAfter = item.process_after || (new Date(item.createdAt).getTime() + (item.priority === 'high' ? 0 : 5000));
                if (now < processAfter) continue;

                // Rate Limit
                const lastLog = await Log.findOne({ user_id: item.user_id }).sort({ timestamp: -1 });
                if (lastLog) {
                    const lastSent = new Date(lastLog.timestamp).getTime();
                    if (now - lastSent < pacingDelay) continue;
                }
            }
            readyJobs.push(item);
        }

        if (readyJobs.length > 0) {
            // DISTRIBUTED LOCKING: Atomically pop jobs from pending -> processing.
            // This physically guarantees no two workers (or intervals) can execute the same job twice.
            const lockedJobs = [];
            for (const job of readyJobs) {
                const locked = await Job.findOneAndUpdate(
                    { _id: job._id, status: "pending" }, // STRICT STATE CHECK
                    { $set: { status: "processing" }, $inc: { attempts: 1 } },
                    { new: true }
                );
                if (locked) {
                    lockedJobs.push(locked);
                }
            }

            if (lockedJobs.length > 0) {
                console.log(`[OFFICIAL WORKER] Successfully locked and starting ${lockedJobs.length} parallel jobs...`);
                Promise.allSettled(lockedJobs.map(job => processJob(job)));
            }
        }
    } catch (err) {
        console.error("[OFFICIAL WORKER ERROR]", err);
    }
}, 1000);

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

async function performMonthlyReset(user) {
    try {
        const currentPlan = (user.plan || 'FREE').toUpperCase();
        
        let baseLimit = 1000;
        let rolloverMultiplier = 1;
        let rolloverEnabled = true;

        const planInfo = await getPlanLimits(user);
        if (planInfo) {
            baseLimit = planInfo.monthlyDMLimit;
            rolloverMultiplier = planInfo.rolloverCapMultiplier !== undefined ? planInfo.rolloverCapMultiplier : 1;
            rolloverEnabled = planInfo.rolloverRules !== undefined ? planInfo.rolloverRules : true;
        }
        
        let totalDmsUsed = user.dmCountThisMonth || 0;
        let newRolloverDms = user.rolloverDms || 0;
        let updatedTopups = user.topups || [];

        // 1. Deduct from Monthly Base Limit
        if (totalDmsUsed <= baseLimit) {
            let unusedDMs = baseLimit - totalDmsUsed;
            if (rolloverEnabled) {
                newRolloverDms += unusedDMs;
            }
        } else {
            totalDmsUsed -= baseLimit;
            // 2. Deduct from existing Rollover
            if (totalDmsUsed <= newRolloverDms) {
                newRolloverDms -= totalDmsUsed;
                totalDmsUsed = 0;
            } else {
                totalDmsUsed -= newRolloverDms;
                newRolloverDms = 0;
                // 3. Deduct from Topups (oldest first)
                if (updatedTopups.length > 0) {
                    updatedTopups.sort((a, b) => new Date(a.purchasedAt) - new Date(b.purchasedAt));
                    for (let t of updatedTopups) {
                        if (totalDmsUsed <= 0) break;
                        if (t.credits >= totalDmsUsed) {
                            t.credits -= totalDmsUsed;
                            totalDmsUsed = 0;
                        } else {
                            totalDmsUsed -= t.credits;
                            t.credits = 0;
                        }
                    }
                    updatedTopups = updatedTopups.filter(t => t.credits > 0);
                }
            }
        }
        
        if (!rolloverEnabled) {
            newRolloverDms = 0;
        } else {
            const maxRollover = baseLimit * rolloverMultiplier;
            if (newRolloverDms > maxRollover) newRolloverDms = maxRollover;
        }
        
        // Clean up expired topups (older than 90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        updatedTopups = updatedTopups.filter(t => new Date(t.purchasedAt) >= ninetyDaysAgo);
        
        return { dmCountThisMonth: 0, rolloverDms: newRolloverDms, topups: updatedTopups };
    } catch (e) {
        console.error(`[BILLING ERROR] Failed to calculate reset for user ${user._id}:`, e);
        throw e;
    }
}

setInterval(async () => {
    try {
        const now = new Date();
        // Only reset users who are not active Stripe subscribers (FREE users, or legacy users without subscriptions)
        // Active Stripe users get reset via webhook 'invoice.payment_succeeded'
        const usersToReset = await User.find({
            billingCycleResetDate: { $lte: now },
            $or: [
                { subscriptionStatus: { $nin: ['active', 'trialing'] } },
                { stripeSubscriptionId: null }
            ]
        });
        
        if (usersToReset.length > 0) {
            console.log(`[BILLING] Found ${usersToReset.length} non-Stripe users for monthly limit reset.`);
            for (const user of usersToReset) {
                try {
                    const resetUpdates = await performMonthlyReset(user);
                    
                    const nextReset = new Date(now);
                    nextReset.setDate(nextReset.getDate() + 30); // Advance by 30 days
                    
                    await User.updateOne(
                        { _id: user._id },
                        { $set: { ...resetUpdates, billingCycleResetDate: nextReset } }
                    );
                    console.log(`[BILLING] Reset user ${user.email} (Rollover set to: ${resetUpdates.rolloverDms})`);
                } catch (e) {
                    console.error(`[BILLING ERROR] Failed to reset user ${user._id}:`, e);
                }
            }
        }
    } catch (err) {
        console.error("[BILLING INTERVAL ERROR]", err);
    }
}, 3600000); // Check Hourly

// --- SAAS AUTH SYSTEM (FIREBASE) ---

// Centralized UserContext Service for Serialization
async function getHydratedUser(userDoc) {
    let userObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    
    const igAccount = await InstagramAccount.findOne({ userId: userObj._id.toString() });
    
    if (igAccount) {
        userObj.instagramConnected = true;
        if (igAccount.username) {
            userObj.igHandle = igAccount.username;
        }
    } else {
        userObj.instagramConnected = false;
    }
    return userObj;
}

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
            name: user.name,
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
            user: await getHydratedUser(user)
        });
    } catch (err) {
        console.error('[AUTH CRITICAL ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error: ' + err.message });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.status(200).json({ success: true });
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ user: await getHydratedUser(user) });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/api/me', authenticateToken, async (req, res) => {
    try {
        const { fullName, phoneNumber } = req.body;
        
        // Only allow updating these specific fields
        const updates = {};
        if (fullName !== undefined) updates.fullName = fullName;
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ user: await getHydratedUser(user) });
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

app.get('/api/instagram/stories', authenticateToken, async (req, res) => {
    try {
        const account = await InstagramAccount.findOne({ userId: req.user.userId });
        if (!account) return res.status(404).json({ error: 'Instagram not connected.' });

        // Fetch active stories
        const response = await axios.get(`https://graph.facebook.com/v19.0/${account.instagram_id}/stories`, {
            params: {
                fields: 'id,media_type,media_url,thumbnail_url,permalink,timestamp',
                access_token: account.access_token,
                limit: 24
            }
        });

        res.status(200).json(response.data.data || []);
    } catch (err) {
        console.error('[STORIES API ERROR]', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch Instagram stories.' });
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

    const token = jwt.sign({ userId: newUser._id, email: newUser.email, name: newUser.name, role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ message: 'User created successfully.', user: await getHydratedUser(newUser) });
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
    const token = jwt.sign({ userId: user._id, email: user.email, name: user.name, role, firebaseId: user.firebaseId || null }, JWT_SECRET, { expiresIn });

    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
    if (rememberMe) cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    
    res.cookie('token', token, cookieOptions);
    res.status(200).json({ message: 'Login successful', user: await getHydratedUser(user) });
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
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
    res.status(200).json({ message: 'Logged out successfully' });
});

// --- Instagram OAuth Connection System ---

app.get('/auth/instagram', authenticateToken, (req, res) => {
    if (req.query.returnTo) {
        res.cookie('oauth_return_to', req.query.returnTo, { maxAge: 3600000, httpOnly: true });
    }
    // Force absolute production URL if defined to avoid reverse-proxy host mismatch
    const baseUrl = process.env.APP_URL || (req.get('host').includes('localhost') ? 'http://localhost:3000' : `https://${req.get('host')}`);
    const redirectUri = `${baseUrl}/auth/callback`;
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
        // Force absolute production URL if defined to avoid reverse-proxy host mismatch
        const baseUrl = process.env.APP_URL || (req.get('host').includes('localhost') ? 'http://localhost:3000' : `https://${req.get('host')}`);
        const redirectUri = `${baseUrl}/auth/callback`;
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

        // 3. Fetch User's Facebook Pages
        const pagesRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { access_token: longLivedToken }
        });

        const userId = state; // We passed userId securely via state
        if (!userId) throw new Error("Missing user state parameter for correlation.");

        // Check Account Limits
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        const planLimits = await getPlanLimits(user);
        
        // Wait! Since it's an upsert (findOneAndUpdate), we only reject if they are adding a NEW account and they are at the limit.
        // Actually, since the current system overwrites, they can never exceed 1 anyway. 
        // We will just strictly check if they are allowed at least 1 account.
        if (planLimits.connectedAccountLimit < 1) {
             return res.status(403).send("Your plan does not allow connecting Instagram accounts. Please upgrade.");
        }

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
            // Clear any stale instagramConnected flag — this user has no valid IG Business Account
            try { await User.findByIdAndUpdate(userId, { instagramConnected: false }); } catch(_) {}
            
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
        let resolvedUserId = state || 'system';
        const token = req.cookies.token;
        if (!state && token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                resolvedUserId = decoded.userId;
            } catch(e) {}
        }

        let igUsername = 'connected_user';
        let igProfilePic = '';
        let igName = '';

        try {
            console.log(`[OAUTH] Fetching profile details for Instagram Business Account ID: ${igAccountId}`);
            const igUserRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
                params: {
                    fields: 'instagram_business_account{username,name},picture.type(large)',
                    access_token: pageAccessToken
                }
            });
            if (igUserRes.data) {
                const biz = igUserRes.data.instagram_business_account || {};
                igUsername = biz.username || 'connected_user';
                igProfilePic = (igUserRes.data.picture && igUserRes.data.picture.data) ? igUserRes.data.picture.data.url : '';
                igName = biz.name || '';
                console.log(`[OAUTH] Instagram username fetched: @${igUsername}`);
            }
        } catch (apiErr) {
            console.error("⚠️ Failed to fetch Instagram username/details during OAuth:", apiErr.message);
            igUsername = pageName ? pageName.replace(/\s+/g, '_').toLowerCase() : 'connected_user';
        }
        // Prevent duplicate Instagram connections by different tester accounts
        await InstagramAccount.deleteMany({
            instagram_id: igAccountId,
            userId: { $ne: resolvedUserId }
        });

        // Fetch Facebook User ID
        let facebookUserId = '';
        try {
            const meRes = await axios.get(`https://graph.facebook.com/v19.0/me`, {
                params: { access_token: longLivedToken }
            });
            if (meRes.data && meRes.data.id) {
                facebookUserId = meRes.data.id;
            }
        } catch (meErr) {
            console.warn("[OAUTH] Failed to fetch Facebook User ID:", meErr.message);
        }

        await InstagramAccount.findOneAndUpdate(
            { userId: resolvedUserId },
            {
                facebookUserId,
                instagram_id: igAccountId,
                page_id: pageId,
                access_token: pageAccessToken, // Long-lived Page Token for webhooks/API
                username: igUsername,
                profile_picture_url: igProfilePic,
                name: igName,
                status: 'active',
                updatedAt: new Date()
            },
            { upsert: true }
        );

        // Update User state
        await User.findByIdAndUpdate(userId, { instagramConnected: true });

        // Reset stale lingering jobs to prevent reconnect spam
        await Job.updateMany(
            { userId: userId, status: { $in: ['pending', 'processing'] } }, 
            { status: 'failed', error: 'Cancelled due to reconnect stabilization' }
        );

        // 5. Subscribe Webhooks for this Page
        await axios.post(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`, {
            subscribed_fields: 'feed,messages',
            access_token: pageAccessToken
        });

        console.log(`[OAUTH] Successfully connected IG ID: ${igAccountId} for user ${userId}`);
        
        const returnTo = req.cookies.oauth_return_to || '/dashboard.html';
        res.clearCookie('oauth_return_to');
        
        // Ensure query params are preserved safely
        const redirectUrl = new URL(returnTo, 'http://localhost'); // Dummy base to parse
        redirectUrl.searchParams.set('connected', 'true');
        
        res.redirect(returnTo.startsWith('http') ? redirectUrl.toString() : redirectUrl.pathname + redirectUrl.search);

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
            // Do not override 'needs_reconnect' or 'rate_limited' with 'active' blindly if there was a recent runtime error.
            if (!isValid) {
                account.status = 'expired';
            } else if (account.status !== 'needs_reconnect' && account.status !== 'rate_limited') {
                account.status = 'active';
            }
            account.lastChecked = new Date();
            await account.save();

            res.json({ 
                status: account.status, 
                expires_at: response.data.data.expires_at,
                scopes: response.data.data.scopes,
                lastErrorCode: account.lastErrorCode,
                lastErrorMessage: account.lastErrorMessage,
                lastFailureAt: account.lastFailureAt
            });
        } catch (apiErr) {
            console.error("[HEALTH CHECK] Meta API error:", apiErr.message);
            res.json({ status: 'unknown', error: apiErr.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Meta Data Deletion Callback ---
app.post('/api/auth/data-deletion', async (req, res) => {
    try {
        const signedRequest = req.body.signed_request;
        if (!signedRequest) {
            return res.status(400).json({ error: 'Missing signed_request' });
        }

        const secret = process.env.FB_APP_SECRET;
        const parts = signedRequest.split('.');
        if (parts.length !== 2) return res.status(400).json({ error: 'Invalid signed_request' });
        
        const encodedSig = parts[0];
        const payload = parts[1];
        
        // Decode data
        const dataStr = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        const data = JSON.parse(dataStr);
        
        // Verify signature
        const expectedSig = crypto.createHmac('sha256', secret)
            .update(payload)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
            
        if (encodedSig !== expectedSig) {
            console.warn('[SECURITY] Data Deletion signature mismatch');
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const facebookUserId = data.user_id;
        console.log(`[DATA DELETION] Received request for Facebook User ID: ${facebookUserId}`);

        // Find associated Instagram account and delete it
        const account = await InstagramAccount.findOne({ facebookUserId });
        if (account) {
            await InstagramAccount.deleteOne({ _id: account._id });
            console.log(`[DATA DELETION] Deleted IG Connection for DMOrbit User: ${account.userId}`);
            
            // Generate confirmation code
            const confirmationCode = crypto.randomBytes(10).toString('hex');
            
            // Meta expects a JSON response with url and confirmation_code
            return res.json({
                url: `${process.env.APP_URL || 'https://dmorbit.in'}/privacy.html#deletion-status?code=${confirmationCode}`,
                confirmation_code: confirmationCode
            });
        } else {
            // Meta requires a success response even if the user is already deleted
            const confirmationCode = crypto.randomBytes(10).toString('hex');
            return res.json({
                url: `${process.env.APP_URL || 'https://dmorbit.in'}/privacy.html#deletion-status?code=${confirmationCode}`,
                confirmation_code: confirmationCode
            });
        }

    } catch (err) {
        console.error('[DATA DELETION ERROR]', err);
        res.status(500).json({ error: 'Internal server error processing deletion' });
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

function extractUrl(text) {
    if(!text) return process.env.CLIENT_URL || "https://dmorbit.in";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : (process.env.CLIENT_URL || "https://dmorbit.in");
}

async function getPlanLimits(user) {
    const currentPlanId = (user.plan || 'FREE').toUpperCase();
    let planData = await Plan.findOne({ planId: currentPlanId }).lean();
    
    // Fallback defaults if DB plan not found
    if (!planData) {
        planData = {
            monthlyDMLimit: 1000,
            rolloverRules: true,
            topupAllowed: false,
            connectedAccountLimit: 1,
            automationLimit: 3,
            smartBioAccess: false,
            leadLimit: 50,
            queuePriority: 'LOW',
            rolloverCapMultiplier: 1
        };
    }
    return planData;
}

async function checkAutomationLimits(user) {
    const planLimits = await getPlanLimits(user);
    const baseLimit = planLimits.monthlyDMLimit;
    const currentDmCount = user.dmCountThisMonth || 0;
    const currentRollover = user.rolloverDms || 0;

    // Dynamically calculate valid unexpired top-ups (valid for 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const activeTopups = (user.topups || []).filter(t => new Date(t.purchasedAt) >= ninetyDaysAgo);
    const activeTopupDms = activeTopups.reduce((sum, t) => sum + Number(t.credits || 0), 0);

    const totalLimit = baseLimit + currentRollover + activeTopupDms;

    console.log(`[DMOrbit Billing] Checking DM limits for User: ${user.email} | Plan: ${user.plan} | DMs: ${currentDmCount} | Max: ${totalLimit} (Base: ${baseLimit}, Rollover: ${currentRollover}, Top-ups: ${activeTopupDms})`);

    if (currentDmCount >= totalLimit) {
        console.log(`❌ Limit Exceeded: User reached total limit of ${totalLimit} DMs.`);
        return { allowed: false, reason: "DM_LIMIT_EXCEEDED" };
    }

    return { allowed: true };
}

// Universal Middleware for Plan Limit Enforcement
function enforceLimit(limitKey, dbCountFunction) {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            
            const limits = await getPlanLimits(user);
            const limitValue = limits[limitKey];
            
            // Boolean flags (e.g. smartBioAccess)
            if (typeof limitValue === 'boolean') {
                if (!limitValue) return res.status(403).json({ error: `Feature locked. Please upgrade your plan.` });
                return next();
            }
            
            // Numeric limits (e.g. automationLimit)
            if (typeof limitValue === 'number' && dbCountFunction) {
                const currentCount = await dbCountFunction(user._id);
                if (currentCount >= limitValue) {
                    return res.status(403).json({ error: `Plan limit reached (${limitValue}). Please upgrade your plan to continue.` });
                }
            }
            
            next();
        } catch (err) {
            console.error('[EnforceLimit Error]', err);
            res.status(500).json({ error: 'Internal Server Error verifying plan limits' });
        }
    };
}

// --- DMOrbit Stripe Subscription & Billing Engine ---
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');

// Route 1: Create a Checkout Session (USD / INR adaptive depending on frontend)
app.post('/api/billing/checkout', async (req, res) => {
    const { userId, planType, currency } = req.body; 
    
    // Determine pricing dynamically from DB
    let amount = 99900; // Fallback safe high amount
    try {
        const planData = await Plan.findOne({ planId: planType.toUpperCase() });
        if (planData && planData.price) {
            amount = planData.price * 100; // Convert to cents
        }
    } catch(e) {
        console.error("[Checkout] Failed to fetch price from Plan DB:", e.message);
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
                    recurring: { interval: 'month' } // Subscription billing
                },
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL || 'https://dmorbit.in'}/dashboard.html?payment=success`,
            cancel_url: `${process.env.CLIENT_URL || 'https://dmorbit.in'}/dashboard.html?payment=cancel`,
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
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        console.error(`[Stripe Webhook Error]: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Idempotency Check: Prevent duplicate webhook processing
        try {
            await ProcessedEvent.create({ fingerprint: `stripe_${event.id}` });
        } catch (duplicateErr) {
            if (duplicateErr.code === 11000) {
                console.log(`[Stripe Webhook] Idempotent ignore: Event ${event.id} already processed.`);
                return res.status(200).send("Idempotent Ignore");
            }
            throw duplicateErr; // Re-throw if it's not a uniqueness constraint error
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            // Check if this is a topup (one-time payment) vs subscription
            if (session.mode === 'payment' && session.metadata && session.metadata.topupCredits) {
                const userId = session.metadata.userId;
                const credits = Number(session.metadata.topupCredits);
                const user = await User.findById(userId);
                if (user) {
                    if (!user.topups) user.topups = [];
                    user.topups.push({ credits, purchasedAt: new Date() });
                    await user.save();
                    console.log(`[Stripe Webhook] Topup Successful: ${credits} DMs for ${userId}`);
                }
            } else if (session.mode === 'subscription') {
                const { userId, planType } = session.metadata;
                console.log(`[Stripe Webhook] Subscription Started! Upgrading User: ${userId} to ${planType}`);
                
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const nextReset = new Date(subscription.current_period_end * 1000);
                
                await User.updateOne(
                    { _id: userId },
                    { 
                        plan: planType, 
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                        subscriptionStatus: subscription.status,
                        billingCycleStart: new Date(subscription.current_period_start * 1000),
                        billingCycleEnd: nextReset,
                        billingCycleResetDate: nextReset, // Fallback legacy compat
                        dmCountThisMonth: 0
                    }
                );
            }
        } else if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            const nextReset = new Date(subscription.current_period_end * 1000);
            
            await User.updateOne(
                { stripeSubscriptionId: subscription.id },
                { 
                    subscriptionStatus: subscription.status,
                    billingCycleStart: new Date(subscription.current_period_start * 1000),
                    billingCycleEnd: nextReset,
                    billingCycleResetDate: nextReset
                }
            );
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            console.log(`[Stripe Webhook] Subscription Canceled/Deleted: ${subscription.id}`);
            await User.updateOne(
                { stripeSubscriptionId: subscription.id },
                { subscriptionStatus: 'canceled', plan: 'FREE' }
            );
        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            if (invoice.subscription) {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                const nextReset = new Date(subscription.current_period_end * 1000);
                
                const user = await User.findOne({ stripeSubscriptionId: invoice.subscription });
                if (user) {
                    const resetUpdates = await performMonthlyReset(user);
                    
                    await User.updateOne(
                        { _id: user._id },
                        { 
                            $set: {
                                ...resetUpdates,
                                subscriptionStatus: subscription.status,
                                billingCycleStart: new Date(subscription.current_period_start * 1000),
                                billingCycleEnd: nextReset,
                                billingCycleResetDate: nextReset
                            }
                        }
                    );
                }
            }
        } else if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object;
            if (invoice.subscription) {
                await User.updateOne(
                    { stripeSubscriptionId: invoice.subscription },
                    { subscriptionStatus: 'past_due' }
                );
            }
        }
    } catch (err) {
        console.error('[Stripe Webhook Processing Error]', err);
    }

    res.json({ received: true });
});

// --- Unified Meta Webhook Receiver (POST /webhook) ---
app.post('/webhook', verifySignature, async (req, res) => {
    console.log("🔥 WEBHOOK HIT 🔥");
    // Immediately respond to Facebook to prevent retries (20 second timeout issue)
    res.json({ received: true });

    const body = req.body;
    const headers = req.headers;

    try {
        const safeHeaders = { ...headers };
        if (safeHeaders.authorization) safeHeaders.authorization = "[REDACTED]";
        if (safeHeaders.cookie) safeHeaders.cookie = "[REDACTED]";

        await WebhookLog.create({
            payload: body,
            headers: safeHeaders,
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
                // TEMPORARY LOGGING REQUESTED BY USER
                console.log("----- P0 DM_KEYWORD Runtime Trace -----");
                console.log("entry.messaging exists?", !!entry.messaging);
                if (entry.messaging) {
                    for (const m of entry.messaging) {
                        console.log("sender.id:", m.sender ? m.sender.id : undefined);
                        console.log("recipient.id:", m.recipient ? m.recipient.id : undefined);
                        console.log("message.text:", m.message ? m.message.text : undefined);
                        console.log("is_echo:", m.message ? m.message.is_echo : undefined);
                        console.log("postback.payload:", m.postback ? m.postback.payload : undefined);
                    }
                }
                console.log("---------------------------------------");

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

                        const isStoryMention = event.message && event.message.attachments && event.message.attachments[0] && event.message.attachments[0].type === 'story_mention';
                        
                        if ((event.message && event.message.text) || isStoryMention) {
                            if (event.message.is_echo) {
                                console.log(`[WEBHOOK] Ignoring message echo from ${senderId}`);
                                continue;
                            }
                            const messageText = event.message.text || "";
                            if (isStoryMention) {
                                console.log(`[WEBHOOK] Story Mention Received | Sender: ${senderId}`);
                            } else {
                                console.log(`[WEBHOOK] DM Received | Sender: ${senderId} | Text: "${messageText}"`);
                            }
                            
                            // RESET 24h COMPLIANCE WINDOW
                            await updateFlowStateActivity(senderId);
                            await cancelPendingFollowups(senderId);

                            // Trigger for DMs (DM Automation Test)
                            const igAccountId = entry.id;
                            // Find the newest active account linked to this Instagram ID
                            const ownerAccount = await InstagramAccount.findOne({ instagram_id: igAccountId, status: 'active' }).sort({ updatedAt: -1 });
                            
                            if (ownerAccount && ownerAccount.status === 'active') {
                                const ownerUser = await User.findById(ownerAccount.userId);
                                if (!ownerUser || !ownerUser.instagramConnected) {
                                    console.warn(`[WEBHOOK] Blocked execution: Instagram account disconnected for owner: ${ownerAccount.userId}`);
                                    continue;
                                }

                                const ownerId = ownerAccount.userId;
                                const allAutos = await Automation.find({ userId: ownerId, isActive: true, status: { $ne: 'deleted' } });
                                console.log("----- TRACE DATA -----");
                                console.log("ownerId:", ownerId);
                                console.log("allAutos.length:", allAutos.length);
                                console.log("----------------------");
                                
                                let matched = null;
                                let actualMatchedKeyword = null;

                                let repliedStoryId = null;
                                if (isStoryMention) {
                                    matched = allAutos.find(a => a.campaignType === 'STORY_MENTION');
                                    if (matched) {
                                        console.log(`[STORY_MENTION] Trigger matched`);
                                        actualMatchedKeyword = 'STORY_MENTION';
                                    }
                                } else if (event.message.reply_to && event.message.reply_to.story && event.message.reply_to.story.id) {
                                    repliedStoryId = event.message.reply_to.story.id;
                                    matched = allAutos.find(a => {
                                        if (a.campaignType !== 'STORY_REPLY') return false;
                                        
                                        const targetMediaIds = a.target?.mediaIds?.length ? a.target.mediaIds : (a.target?.mediaId ? [a.target.mediaId] : []);
                                        const isGlobal = a.target?.type === 'global' || targetMediaIds.length === 0;
                                        if (!isGlobal && !targetMediaIds.includes(repliedStoryId)) return false;
                                        
                                        if (a.triggerType !== 'KEYWORDS' && a.mode !== 'keyword') return true;
                                        
                                        const normalizedText = messageText.toLowerCase().trim();
                                        const keywords = a.trigger?.keywords?.length > 0 ? a.trigger.keywords : (a.keyword ? [a.keyword] : []);
                                        const kwMatch = keywords.find(kw => normalizedText.includes(kw.toLowerCase().trim()));
                                        if (kwMatch) {
                                            actualMatchedKeyword = kwMatch;
                                            return true;
                                        }
                                        return false;
                                    });
                                    if (matched) {
                                        console.log(`[STORY_REPLY] Trigger matched`);
                                    }
                                } else {
                                    const normalizedDm = messageText.toLowerCase().trim();
                                    matched = allAutos.find(a => {
                                        // FIX #1: Accept explicit DM_KEYWORD type OR legacy docs where
                                        // campaignType is null/undefined but a keyword field exists.
                                        // Before the campaign-type refactor, all DM triggers were saved
                                        // without a campaignType — those must still fire.
                                        const isDmKeyword = a.campaignType === 'DM_KEYWORD'
                                            || (!a.campaignType && (a.keyword || a.trigger?.keywords?.length > 0));
                                        if (!isDmKeyword) return false;

                                        console.log(`[DM MATCH TRACE] Checking auto ${a._id} | campaignType=${a.campaignType} | keyword=${a.keyword}`);
                                        const keywords = a.trigger?.keywords?.length > 0 ? a.trigger.keywords : (a.keyword ? [a.keyword] : []);
                                        if (keywords.length === 0) {
                                            console.log(`[DM MATCH TRACE] Auto ${a._id} has no keywords — skipping`);
                                            return false;
                                        }
                                        const kwMatch = keywords.find(kw => normalizedDm.includes(kw.toLowerCase().trim()));
                                        if (kwMatch) {
                                            actualMatchedKeyword = kwMatch;
                                            return true;
                                        }
                                        return false;
                                    });
                                }

                                console.log("----- TRACE MATCH -----");
                                console.log("Branch Executed:", isStoryMention ? "STORY_MENTION" : (repliedStoryId ? "STORY_REPLY" : "DM_KEYWORD/COMMENT_DM"));
                                console.log("matched campaign id:", matched ? matched._id : null);
                                console.log("actualMatchedKeyword:", actualMatchedKeyword);
                                console.log("-----------------------");

                                const replyText = matched?.privateMessageText || (matched?.actions?.find(act => act.type === 'send_dm')?.text);

                                console.log(`[DM GATE] matched=${!!matched} | replyText=${!!replyText} | privateMessageText=${matched?.privateMessageText?.substring(0, 50)}`);

                                // FIX #2: Do NOT gate on replyText — an empty/missing message text
                                // should NOT silently kill the trigger. The job will still create
                                // (with a placeholder text) and the worker handles actual delivery.
                                // Previously: `if (matched && replyText)` — this caused campaigns
                                // saved without privateMessageText to be permanently ignored.
                                if (matched) {


                                    // TASK 4: Limit Enforcement on DMs
                                    const limitStatus = await checkAutomationLimits(ownerUser);
                                    if (!limitStatus.allowed) {
                                        console.log("----- TRACE JOB -----");
                                        console.log("Job.create executed: NO (Blocked at checkAutomationLimits)");
                                        console.log("---------------------");
                                        console.log(`[BILLING] DM Automation blocked for user ${ownerId}: ${limitStatus.reason}`);
                                        continue;
                                    }

                                    console.log(`[DM AUTOMATION] Matched keyword! Checking session...`);
                                    let session = null;
                                    try {
                                        const now = new Date();
                                        
                                        // Self-healing: if a previous session crashed and left a lock, clear it if older than 2 mins
                                        await mongoose.connection.collection('dmsessions').deleteMany({
                                            userId: ownerId.toString(),
                                            targetId: senderId,
                                            isCompleted: false,
                                            lastTriggeredAt: { $lt: new Date(now.getTime() - 2 * 60 * 1000) }
                                        });

                                        // Atomic Creation: The unique index on (userId, targetId, automationId) 
                                        // with partialFilterExpression { isCompleted: false } guarantees
                                        // that duplicate parallel webhooks will fail with E11000 here.
                                        try {
                                            session = await DMSession.create({
                                                userId: ownerId,
                                                targetId: senderId,
                                                automationId: matched._id,
                                                mediaId: repliedStoryId,
                                                processing: false, 
                                                processingAt: now,
                                                currentStep: 'initial_access',
                                                lastTriggeredAt: now,
                                                isCompleted: false,
                                                clickCount: 0,
                                                warningSent: false,
                                                cooldownUntil: new Date(now.getTime() + 10 * 1000)
                                            });
                                            if (matched.triggerType === 'STORY_REPLY') {
                                                console.log(`[STORY_REPLY] Session created`);
                                            } else if (matched.triggerType === 'STORY_MENTION') {
                                                console.log(`[STORY_MENTION] Session created`);
                                            }
                                        } catch (insertErr) {
                                            if (insertErr.code === 11000) {
                                                console.log("----- TRACE JOB -----");
                                                console.log("Job.create executed: NO (Blocked at DMSession E11000 duplicate lock)");
                                                console.log("---------------------");
                                                console.log(`[DM AUTOMATION] Active session natively locked (E11000) for Keyword trigger from user ${senderId}. Ignoring spam.`);
                                                continue;
                                            }
                                            throw insertErr; // Re-throw if it's a different DB error
                                        }

                                        // Create Job for Initial Access Card
                                        const job = await Job.create({
                                            automationId: matched._id,
                                            userId: ownerId,
                                            user_id: senderId,
                                            username: senderId,
                                            platform: "instagram",
                                            message: isStoryMention ? 'Story Mention Delivery' : 'DM Keyword Delivery',
                                            type: 'send_dm',
                                            priority: 'high',
                                            process_after: Date.now(),
                                            metadata: {
                                                ig_id: entry.id,
                                                instagramAccountId: ownerAccount.instagram_id,
                                                igUsername: ownerAccount.username,
                                                templateType: 'initial_access',
                                                eventId: eventId,
                                                media_id: repliedStoryId,
                                                kw: actualMatchedKeyword || matched.keyword
                                            },
                                            status: "pending"
                                        });
                                        if (matched.triggerType === 'STORY_REPLY') {
                                            console.log(`[STORY_REPLY] Job queued`);
                                        } else if (matched.triggerType === 'STORY_MENTION') {
                                            console.log(`[STORY_MENTION] Job queued`);
                                        }
                                        console.log(`[OFFICIAL QUEUED] DB ID: ${job._id} | Target: ${senderId}`);
                                        console.log("----- TRACE JOB -----");
                                        console.log("Job.create executed: YES");
                                        console.log("---------------------");
                                    } catch (err) {
                                        console.error("[DM QUEUE ERROR]", err.message);
                                        if (session) {
                                            session.processing = false;
                                            await session.save().catch(() => {});
                                        }
                                    } finally {
                                        if (session && session.processing) {
                                            session.processing = false;
                                            await session.save().catch(() => {});
                                        }
                                    }
                                }
                            }
                        }

                        // --- HANDLING INSTAGRAM BUTTON CLICK EVENTS (POSTBACKS) ---
                        if (event.postback && event.postback.payload) {
                            const postbackPayload = event.postback.payload;
                            console.log(`[DMOrbit] Button Clicked! Payload received: ${postbackPayload}`);
                            
                            // 1. Idempotency Check: Drop duplicates immediately
                            const fingerprint = `${senderId}_${eventId}_${postbackPayload}`;
                            try {
                                await ProcessedEvent.create({ fingerprint });
                            } catch (err) {
                                if (err.code === 11000) {
                                    console.log(`[WEBHOOK] Duplicate postback ignored: ${fingerprint}`);
                                    continue;
                                }
                            }
                            
                            const igAccountId = entry.id;
                            // Find the newest active account linked to this Instagram ID
                            const ownerAccount = await InstagramAccount.findOne({ instagram_id: igAccountId, status: 'active' }).sort({ updatedAt: -1 });
                            const pageToken = ownerAccount ? ownerAccount.access_token : null;

                            if (pageToken && senderId && ownerAccount && ownerAccount.status === 'active') {
                                const ownerUser = await User.findById(ownerAccount.userId);
                                if (!ownerUser || !ownerUser.instagramConnected) {
                                    console.warn(`[WEBHOOK] Blocked execution: Instagram account disconnected for owner: ${ownerAccount.userId}`);
                                    continue;
                                }
                                // Fix: Do not guess automation using sort({ createdAt: -1 })
                                // const automation = await Automation.findOne(...).sort(...)

                                if (postbackPayload === "REQUEST_ACCESS_CLICKED") {
                                    let session = null;
                                    let automation = null;
                                    try {
                                        const now = new Date();
                                        const lockTime = new Date(now.getTime() - 10000); 

                                        session = await DMSession.findOneAndUpdate(
                                            {
                                                userId: ownerAccount.userId,
                                                targetId: senderId,
                                                currentStep: 'initial_access',
                                                isCompleted: false,
                                                $or: [
                                                    { processing: { $ne: true } },
                                                    { processingAt: { $lt: lockTime } } 
                                                ]
                                            },
                                            { $set: { processing: true, processingAt: now, currentStep: 'follow_gate' } },
                                            { new: true }
                                        );

                                        if (!session) {
                                            console.log(`[DM AUTOMATION] Duplicate REQUEST_ACCESS_CLICKED from user ${senderId} rejected natively.`);
                                            continue;
                                        }

                                        automation = await Automation.findById(session.automationId);

                                        const followCheckUrl = `https://graph.facebook.com/v21.0/${senderId}?fields=is_viewer_follow_page&access_token=${pageToken}`;
                                        const followRes = await axios.get(followCheckUrl).catch(() => null);
                                        const isFollowing = followRes?.data?.is_viewer_follow_page || false;

                                        let link = extractUrl(automation?.privateMessageText);
                                        if (link && session.mediaId) {
                                            const separator = link.includes('?') ? '&' : '?';
                                            if (!link.includes('post=')) {
                                                link += `${separator}post=${session.mediaId}`;
                                            }
                                        }
                                        const profileUrl = `https://www.instagram.com/_u/dmorbitapp/`;

                                        let templateType = isFollowing ? 'final_delivery' : 'follow_gate';
                                        
                                        // Update Session
                                        session.currentStep = 'follow_gate';
                                        session.clickCount = 0;
                                        session.processing = false;
                                        await session.save();

                                        await Job.create({
                                            automationId: automation?._id,
                                            userId: ownerAccount.userId,
                                            user_id: senderId,
                                            username: senderId,
                                            platform: "instagram",
                                            message: 'Follow-Gate Check',
                                            type: 'send_dm',
                                            priority: 'high',
                                            chargeCredit: false,
                                            process_after: Date.now(),
                                            metadata: {
                                                ig_id: entry.id,
                                                instagramAccountId: ownerAccount.instagram_id,
                                                igUsername: ownerAccount.username,
                                                templateType: templateType,
                                                targetLink: link,
                                                fallbackText: automation?.name,
                                                profileUrl: profileUrl
                                            },
                                            status: "pending"
                                        });

                                    } catch (err) {
                                        console.log("[DMOrbit Dev Mode Fallback] Follow API restricted. Forcing Follow-Gate Card for testing.");
                                        const profileUrl = `https://www.instagram.com/_u/dmorbitapp/`;
                                        if (session) {
                                            session.currentStep = 'follow_gate';
                                            session.clickCount = 0;
                                            session.processing = false;
                                            await session.save();
                                        }

                                        await Job.create({
                                            automationId: automation?._id,
                                            userId: ownerAccount.userId,
                                            user_id: senderId,
                                            username: senderId,
                                            platform: "instagram",
                                            message: 'Follow-Gate Check (Fallback)',
                                            type: 'send_dm',
                                            priority: 'high',
                                            chargeCredit: false,
                                            process_after: Date.now(),
                                            metadata: {
                                                ig_id: entry.id,
                                                instagramAccountId: ownerAccount.instagram_id,
                                                igUsername: ownerAccount.username,
                                                templateType: 'follow_gate',
                                                profileUrl: profileUrl
                                            },
                                            status: "pending"
                                        });
                                    } finally {
                                        if (session && session.processing) {
                                            session.processing = false;
                                            await session.save().catch(() => {});
                                        }
                                    }
                                }

                                if (postbackPayload === "VERIFY_FOLLOW_CLICKED") {
                                    console.log("[DMOrbit] 'I'm following' clicked. Verifying status via API.");
                                    try {
                                        const now = new Date();
                                        let automation = null;
                                        
                                        // Atomic Lock & State Transition
                                        const lockTime = new Date(now.getTime() - 10000); // 10s auto-unlock safety
                                        let session = await DMSession.findOneAndUpdate(
                                            {
                                                userId: ownerAccount.userId,
                                                targetId: senderId,
                                                currentStep: { $in: ['follow_gate', 'FOLLOW_RETRY_COOLDOWN'] },
                                                isCompleted: false,
                                                $and: [
                                                    { $or: [ { cooldownUntil: { $exists: false } }, { cooldownUntil: { $lte: now } }, { cooldownUntil: null } ] },
                                                    { $or: [ { processing: { $ne: true } }, { processingAt: { $lt: lockTime } } ] }
                                                ]
                                            },
                                            { $set: { processing: true, processingAt: now, currentStep: 'VERIFYING_FOLLOW' } },
                                            { new: true }
                                        );

                                        if (!session) {
                                            console.log(`[DM AUTOMATION] Native atomic rejection for VERIFY_FOLLOW_CLICKED from user ${senderId}. (Wrong state, cooldown, or locked)`);
                                            continue;
                                        }

                                        automation = await Automation.findById(session.automationId);

                                        // 3. Query Facebook Graph API for follow status
                                        const followCheckUrl = `https://graph.facebook.com/v21.0/${senderId}?fields=is_viewer_follow_page&access_token=${pageToken}`;
                                        const followRes = await axios.get(followCheckUrl).catch(() => null);
                                        const isFollowing = followRes?.data?.is_viewer_follow_page || false;

                                        let link = extractUrl(automation?.privateMessageText);
                                        if (link && session.mediaId) {
                                            const separator = link.includes('?') ? '&' : '?';
                                            if (!link.includes('post=')) {
                                                link += `${separator}post=${session.mediaId}`;
                                            }
                                        }
                                        const profileUrl = `https://www.instagram.com/_u/dmorbitapp/`;

                                        if (isFollowing || session.clickCount >= 1) {
                                            // USER IS FOLLOWING: Transition to DELIVERED
                                            session.isCompleted = true;
                                            session.currentStep = 'DELIVERED';
                                            session.processing = false;
                                            await session.save();

                                            await Job.create({
                                                automationId: automation?._id,
                                                userId: ownerAccount.userId,
                                                user_id: senderId,
                                                username: senderId,
                                                platform: "instagram",
                                                message: 'Final Delivery',
                                                type: 'send_dm',
                                                priority: 'high',
                                                chargeCredit: false,
                                                process_after: Date.now(),
                                                metadata: {
                                                    ig_id: entry.id,
                                                    instagramAccountId: ownerAccount.instagram_id,
                                                    igUsername: ownerAccount.username,
                                                    templateType: 'final_delivery',
                                                    targetLink: link,
                                                    fallbackText: automation?.name,
                                                    eventId: eventId
                                                },
                                                status: "pending"
                                            });
                                        } else {
                                            // USER IS NOT FOLLOWING: Transition to FOLLOW_RETRY_COOLDOWN
                                            session.clickCount += 1;
                                            session.currentStep = 'FOLLOW_RETRY_COOLDOWN';
                                            session.cooldownUntil = new Date(now.getTime() + 10 * 1000); // 10s cooldown
                                            session.processing = false;

                                            if (session.warningSent) {
                                                console.log(`[DM AUTOMATION] Warning already sent to ${senderId}. Silently ignoring.`);
                                                await session.save();
                                            } else {
                                                session.warningSent = true;
                                                await session.save();

                                                await Job.create({
                                                    automationId: automation?._id,
                                                    userId: ownerAccount.userId,
                                                    user_id: senderId,
                                                    username: senderId,
                                                    platform: "instagram",
                                                    message: 'Nice Try Check',
                                                    type: 'send_dm',
                                                    priority: 'high',
                                                    chargeCredit: false,
                                                    process_after: Date.now(),
                                                    metadata: {
                                                        ig_id: entry.id,
                                                        instagramAccountId: ownerAccount.instagram_id,
                                                        igUsername: ownerAccount.username,
                                                        templateType: 'nice_try',
                                                        profileUrl: profileUrl,
                                                        eventId: eventId
                                                    },
                                                    status: "pending"
                                                });
                                            }
                                        }
                                    } catch (err) {
                                        console.error("Error verifying follow status:", err.message);
                                        // Emergency unlock
                                        await DMSession.updateOne(
                                            { userId: ownerAccount.userId, targetId: senderId, currentStep: 'VERIFYING_FOLLOW' },
                                            { $set: { processing: false } }
                                        ).catch(() => {});
                                    }
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
                                // Find the newest active account linked to this Instagram ID
                                const ownerAccount = await InstagramAccount.findOne({ instagram_id: igAccountId, status: 'active' }).sort({ updatedAt: -1 });
                                
                                if (!ownerAccount || ownerAccount.status !== 'active') {
                                    console.warn(`[WEBHOOK] Blocked execution: Instagram account disconnected or inactive for IG ID: ${igAccountId}. Skipping.`);
                                    continue;
                                }

                                const ownerUser = await User.findById(ownerAccount.userId);
                                if (!ownerUser || !ownerUser.instagramConnected) {
                                    console.warn(`[WEBHOOK] Blocked execution: User ${ownerAccount.userId} is not connected. Skipping execution.`);
                                    continue;
                                }

                                const ownerId = ownerAccount.userId;

                                function extractInstagramShortcode(url) {
                                    if (!url || typeof url !== 'string') return null;
                                    const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                                    return match ? match[2] : null;
                                }

                                // KEYWORD & TARGETING MATCHING
                                const allAutos = await Automation.find({ userId: ownerId, isActive: true, status: { $ne: 'deleted' } });
                                console.log(`[COMMENT MATCH TRACE] Total active automations for ${ownerId}: ${allAutos.length}`);
                                allAutos.forEach(a => console.log(`  - auto ${a._id} | campaignType=${a.campaignType} | status=${a.status} | mode=${a.mode} | triggerType=${a.triggerType}`));

                                let matched = allAutos.filter(a => {
                                    // Handle legacy & new formats
                                    let targetMediaIds = [];
                                    if (a.target?.mediaIds && a.target.mediaIds.length > 0) targetMediaIds = a.target.mediaIds;
                                    else if (a.target?.mediaId) targetMediaIds = [a.target.mediaId];
                                    else if (a.postId) targetMediaIds = [a.postId];
                                    else if (a.targetMediaIds && a.targetMediaIds.length > 0) targetMediaIds = a.targetMediaIds;

                                    // 1. Post Targeting Check
                                    const isSpecific = a.target?.type === 'specific' || a.target?.type === 'multiple' || targetMediaIds.length > 0;
                                    if (isSpecific) {
                                        let postMatch = false;
                                        for (const tId of targetMediaIds) {
                                            if (tId === mediaId) { postMatch = true; break; }
                                            const targetShortcode = extractInstagramShortcode(tId) || tId;
                                            const incomingShortcode = extractInstagramShortcode(postUrl);
                                            if (targetShortcode && incomingShortcode && targetShortcode === incomingShortcode) { postMatch = true; break; }
                                        }
                                        if (!postMatch) {
                                            console.log(`[COMMENT MATCH TRACE] Auto ${a._id} skipped: post ID mismatch (target: ${targetMediaIds}, incoming: ${mediaId})`);
                                            return false;
                                        }
                                    }

                                    // 2. Mode Check
                                    // FIX #3: STORY_REPLY and DM_KEYWORD are correctly excluded from
                                    // the comment handler. But legacy campaigns with null campaignType
                                    // MUST still be treated as COMMENT_DM (not excluded).
                                    if (a.campaignType === 'STORY_REPLY' || a.campaignType === 'DM_KEYWORD') {
                                        console.log(`[COMMENT MATCH TRACE] Auto ${a._id} skipped: campaignType=${a.campaignType} does not handle comments`);
                                        return false;
                                    }

                                    if (a.triggerType === 'ANY_COMMENT' || a.mode === 'any_comment' || a.campaignType === 'ANY_COMMENT') {
                                        a._actualMatchedKeyword = "ANY_COMMENT";
                                        return true;
                                    }

                                    const keywords = a.trigger?.keywords?.length > 0 ? a.trigger.keywords : (a.keyword ? [a.keyword] : []);
                                    const kwMatch = keywords.find(kw => normalizedText.includes(kw.toLowerCase().trim()));
                                    if (kwMatch) {
                                        a._actualMatchedKeyword = kwMatch;
                                        return true;
                                    }
                                    console.log(`[COMMENT MATCH TRACE] Auto ${a._id} skipped: no keyword match for "${normalizedText}" (keywords: ${JSON.stringify(keywords)})`);
                                    return false;
                                });

                                // --- CONFLICT PREVENTION ENGINE ---
                                if (matched.length > 0) {
                                    console.log(`[MATCH FOUND] ${matched.length} campaigns initially triggered for: "${commentText}"`);
                                    
                                    // Rule 2: Specific Post priority over Any Post
                                    const isSpecificCheck = (a) => a.target?.type === 'specific' || a.target?.type === 'multiple' || a.postId || a.target?.mediaId || (a.target?.mediaIds && a.target.mediaIds.length > 0) || (a.targetMediaIds && a.targetMediaIds.length > 0);
                                    if (matched.some(isSpecificCheck)) {
                                        matched = matched.filter(isSpecificCheck);
                                        console.log(`[CONFLICT] Specific post campaigns exist. Dropped "Any Post" campaigns.`);
                                    }

                                    // Rule 1: Drop COMMENT_REPLY if COMMENT_DM exists
                                    const hasCommentDM = matched.some(a => a.campaignType === 'COMMENT_DM' || (!a.campaignType && a.privateMessageText));
                                    if (hasCommentDM) {
                                        matched = matched.filter(a => a.campaignType !== 'COMMENT_REPLY');
                                        console.log(`[CONFLICT] Comment->DM exists. Dropped standalone Comment Reply campaigns.`);
                                    }
                                    
                                    // Sort to ensure highest priority goes first
                                    matched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                    
                                    // Rule 3: Only one public reply limit tracking
                                    let hasSentPublicReply = false;

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

                                        // --- 1. Execute direct actions (Routed to Queue) ---
                                        if (auto.publicReplyText || auto.privateMessageText || auto.campaignType === 'COMMENT_REPLY') {
                                            const ownerUser = await User.findById(ownerId);
                                            if (ownerUser) {
                                                const limitStatus = await checkAutomationLimits(ownerUser);
                                                if (!limitStatus.allowed) {
                                                    console.log(`[BILLING] Automation blocked for user ${ownerId}: ${limitStatus.reason}`);
                                                    continue;
                                                }
                                            }

                                            console.log(`[SIMPLIFIED ACTIONS] Queuing direct API calls for automation ${auto._id}`);
                                            const pageToken = ownerAccount.access_token;
                                            
                                            if (pageToken && pageToken !== "your_token_here") {
                                                let finalDmMessage = auto.privateMessageText || 'DM Delivery';
                                                if (auto.leadFields && auto.leadFields.length > 0) {
                                                    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                                                    finalDmMessage += `\n\nClick here to get it: ${baseUrl}/c/${auto._id}?post=${mediaId}&kw=${encodeURIComponent(auto._actualMatchedKeyword || auto.keyword || '')}`;
                                                }
                                                
                                                let publicReplyTextToUse = auto.publicReplyText;
                                                if (hasSentPublicReply) {
                                                    publicReplyTextToUse = null; // Suppress duplicate public reply
                                                } else if (publicReplyTextToUse) {
                                                    hasSentPublicReply = true;
                                                }

                                                // Create Job to centralize analytics and tracking
                                                const job = await Job.create({
                                                    automationId: auto._id,
                                                    userId: auto.userId,
                                                    user_id: userId,
                                                    username: targetUsername || 'unknown',
                                                    platform: "instagram",
                                                    message: finalDmMessage,
                                                    type: 'reply_comment', 
                                                    priority: 'high',
                                                    process_after: Date.now(),
                                                    metadata: { 
                                                        comment_id: commentId, 
                                                        media_id: mediaId,
                                                        ig_id: entry.id,
                                                        original_text: commentText,
                                                        public_reply: !!publicReplyTextToUse,
                                                        public_reply_text: publicReplyTextToUse,
                                                        post_url: postUrl,
                                                        instagramAccountId: ownerAccount.instagram_id,
                                                        igUsername: ownerAccount.username,
                                                        snapshotAt: Date.now(),
                                                        templateType: 'initial_access',
                                                        eventId: eventId,
                                                        kw: auto._actualMatchedKeyword || auto.keyword
                                                    },
                                                    status: "pending"
                                                });
                                                console.log(`[OFFICIAL QUEUED] DB ID: ${job._id} | Target: ${targetUsername}`);
                                            }
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
                                                
                                                let actionMessageText = action.text;
                                                if (auto.leadFields && auto.leadFields.length > 0) {
                                                    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                                                    actionMessageText += `\n\nClick here to get it: ${baseUrl}/c/${auto._id}?post=${mediaId}&kw=${encodeURIComponent(auto._actualMatchedKeyword || auto.keyword || '')}`;
                                                }
                                                
                                                // Create Job for UI visibility
                                                const job = await Job.create({
                                                    automationId: auto._id,
                                                    userId: auto.userId,
                                                    user_id: userId,
                                                    username: targetUsername,
                                                    platform: "instagram",
                                                    message: actionMessageText,
                                                    type: 'reply_comment', 
                                                    priority: 'high',
                                                    process_after: Date.now(),
                                                    metadata: { 
                                                        comment_id: commentId, 
                                                        media_id: mediaId,
                                                        ig_id: entry.id,
                                                        original_text: commentText,
                                                        public_reply: true,
                                                        post_url: postUrl,
                                                        instagramAccountId: ownerAccount.instagram_id,
                                                        igUsername: ownerAccount.username,
                                                        snapshotAt: Date.now(),
                                                        eventId: eventId,
                                                        kw: auto._actualMatchedKeyword || auto.keyword
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
            return; // Headers already sent at the top
        } catch (err) {
            console.error("[WEBHOOK ERROR] Processing failed:", err);
            return; // Error logged, no need to send 500 since 200 was already sent
        }
    }
    // Only send 404 if we didn't already send 200 at the top... wait, we already sent 200 at the top.
    // So just return here.
    return;
    return res.status(404).json({ error: "Unsupported event object", received: body.object });
});

// DEPRECATED: Removed redundant/simulator routes in favor of unified /webhook

// Toggle Automation
app.put('/api/automations/:id/toggle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const auto = await Automation.findOne({ _id: id, userId: req.user.userId, status: { $ne: 'deleted' } });
    
    if (!auto) {
        return res.status(404).json({ error: 'Automation not found' });
    }

    auto.isActive = !auto.isActive;
    auto.status = auto.isActive ? 'active' : 'paused';
    await auto.save();

    res.status(200).json({ message: 'Status updated', isActive: auto.isActive, status: auto.status });
});

// Delete Automation (Soft Delete)
app.delete('/api/automations/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Automation.updateOne({ _id: id, userId: String(req.user.userId) }, { $set: { status: 'deleted', isActive: false, deletedAt: new Date() } });
        if (result.matchedCount === 0) {
            const result2 = await Automation.updateOne({ _id: id }, { $set: { status: 'deleted', isActive: false, deletedAt: new Date() } });
            if (result2.matchedCount === 0) {
                return res.status(404).json({ error: 'Automation not found or unauthorized' });
            }
        }
        res.status(200).json({ success: true, message: 'Automation deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- END ENGINE ROUTES ---

// Admin API Routes
app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAutomations = await Automation.countDocuments({ status: { $ne: 'deleted' } });
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

function validateCampaignTypeTemplate(campaignType, templateType) {
    // If not provided, skip validation (allows legacy operations that don't pass these)
    if (!campaignType || !templateType) return { valid: true };

    const matrix = {
        'COMMENT_DM': ['link', 'pdf', 'product', 'lead', 'webinar', 'course'],
        'COMMENT_REPLY': ['public_reply'],
        'STORY_REPLY': ['link', 'pdf', 'product', 'lead', 'webinar', 'course'],
        'DM_KEYWORD': ['link', 'pdf', 'product', 'lead', 'webinar', 'course'],
        'STORY_MENTION': ['link', 'pdf', 'product', 'lead', 'webinar', 'course']
    };

    if (!matrix[campaignType]) {
        return { valid: false, error: `Invalid campaign type '${campaignType}'.` };
    }

    if (!matrix[campaignType].includes(templateType)) {
        return { valid: false, error: `Invalid template type '${templateType}' for campaign type '${campaignType}'.` };
    }

    return { valid: true };
}

// --- UPDATED AUTOMATION CRUD ---

// Create Automation (Phase 2 — supports flow attachment & multi-keyword)
app.post('/api/v2/automations', authenticateToken, enforceLimit('automationLimit', async (id) => Automation.countDocuments({ userId: id, status: { $ne: 'deleted' } })), async (req, res) => {
    try {
        if (req.user.role === 'admin') return res.status(403).json({ error: 'Admin cannot create automations.' });

        const ownerUser = await User.findById(req.user.userId);
        if (!ownerUser || !ownerUser.instagramConnected) {
            return res.status(400).json({ error: 'Campaign creation requires an active Instagram connection.' });
        }

        const { name, keywords, dmMessage, flowId, target, mode } = req.body;
        const triggerType = req.body.triggerType;
        
        // Campaign-first payload extraction
        const { campaignType, templateType, followGate, leadFields, targetMediaIds } = req.body;

        const validation = validateCampaignTypeTemplate(campaignType, templateType);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        console.log("AUTOMATION CREATE PAYLOAD", req.body);

        // Keyword mode requires at least one keyword, UNLESS it's a STORY_REPLY, STORY_MENTION, or ANY_COMMENT
        if (mode !== 'any_comment' && triggerType !== 'STORY_REPLY' && campaignType !== 'STORY_REPLY' && triggerType !== 'STORY_MENTION' && campaignType !== 'STORY_MENTION' && campaignType !== 'ANY_COMMENT' && (!keywords || !Array.isArray(keywords) || keywords.length === 0)) {
            return res.status(400).json({ error: 'At least one keyword is required for keyword mode.' });
        }

        // BUG 5: Trigger State Integrity Validation
        if (triggerType && mode) {
            if (triggerType === 'ANY_COMMENT' && mode !== 'any_comment') {
                return res.status(400).json({ error: "Invalid trigger state: ANY_COMMENT requires mode to be 'any_comment'" });
            }
            if ((triggerType === 'KEYWORD' || triggerType === 'KEYWORDS') && mode !== 'keyword') {
                return res.status(400).json({ error: "Invalid trigger state: KEYWORD requires mode to be 'keyword'" });
            }
        }

        const actions = [];
        if (dmMessage) actions.push({ type: 'send_dm', text: dmMessage });
        
        let warnings = [];
        let excludedPosts = [];
        
        // BUG 3: Data Integrity Validation
        if (target && target.type !== 'global') {
            const mIds = target.mediaIds || [];
            if (mIds.some(id => id === null || id === undefined || id === "")) {
                return res.status(400).json({ error: "Invalid mediaIds" });
            }
        }

        let postId = null;
        let finalMediaIds = [];
        if (target && target.type === 'specific') {
            finalMediaIds = target.mediaIds || [];
            if (finalMediaIds.length > 0) postId = finalMediaIds[0];
        } else if (target && target.type === 'multiple') {
            finalMediaIds = target.mediaIds || [];
            if (finalMediaIds.length > 0) postId = finalMediaIds[0];
        }
        
        // Rule 4: Duplicate keyword campaigns on same post must be prevented
        if (keywords && keywords.length > 0 && finalMediaIds.length > 0) {
            const duplicate = await Automation.findOne({
                userId: req.user.userId,
                isActive: true,
                'target.type': { $in: ['specific', 'multiple'] },
                'target.mediaIds': { $in: finalMediaIds },
                'trigger.keywords': { $in: keywords.map(k => k.toLowerCase().trim()) }
            });
            if (duplicate) {
                return res.status(409).json({ error: `Duplicate campaign detected. Another active campaign ("${duplicate.name}") already uses these keywords on the selected post(s).` });
            }
        } else if (keywords && keywords.length > 0 && target && target.type === 'global') {
            const duplicate = await Automation.findOne({
                userId: req.user.userId,
                isActive: true,
                'target.type': 'global',
                'trigger.keywords': { $in: keywords.map(k => k.toLowerCase().trim()) }
            });
            if (duplicate) {
                return res.status(409).json({ error: `Duplicate campaign detected. Another active "Any Post" campaign ("${duplicate.name}") already uses these keywords.` });
            }
        }

        // Auto-migrate legacy target to new format
        if (target) {
            target.mediaIds = finalMediaIds;
        }

        const autoCount = await Automation.countDocuments({ userId: req.user.userId, status: { $ne: 'deleted' } });
        const auto = await Automation.create({
            userId: req.user.userId,
            name: name || `Campaign #${autoCount + 1}`,
            platform: 'instagram',
            target: target || { type: 'global', mediaIds: [] },
            mode: mode || 'keyword',
            trigger: { type: 'comment', keywords: keywords ? keywords.map(k => k.toLowerCase().trim()) : [] },
            actions,
            flowId: flowId || null,
            isActive: true,
            
            // Populate simplified fields for direct compatibility
            postId: postId,
            triggerType: (mode || 'keyword') === 'any_comment' ? 'ANY_COMMENT' : 'KEYWORD',
            keyword: keywords && keywords.length > 0 ? keywords[0] : '',
            publicReplyText: req.body.publicReplyText || null,
            privateMessageText: dmMessage,
            
            // Campaign-first fields
            campaignType,
            templateType,
            followGate: followGate || false,
            leadFields: leadFields || [],
            excludedPosts,
            targetMediaIds: targetMediaIds || []
        });

        res.status(201).json({ success: true, automation: auto, warnings });
    } catch (err) {
        console.error('[API] Create Automation error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get All Automations (V2 with enriched data)
app.get('/api/v2/automations', authenticateToken, async (req, res) => {
    try {
        const automations = await Automation.find({ userId: req.user.userId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
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

// Get Single Automation (V2)
app.get('/api/v2/automations/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const automation = await Automation.findOne({ _id: id, userId: req.user.userId, status: { $ne: 'deleted' } }).lean();
        if (!automation) return res.status(404).json({ error: 'Automation not found' });
        
        const [
            leadsCount,
            dmCount,
            failedDmCount,
            pendingDmCount,
            publicReplyCount,
            completedFlows,
            lastTriggerSession,
            lastDmJob,
            lastLead,
            lastFailedJob
        ] = await Promise.all([
            Lead.countDocuments({ $or: [{ automationId: id }, { campaignId: id }] }),
            Job.countDocuments({ automationId: id, status: 'done', type: 'send_dm' }),
            Job.countDocuments({ automationId: id, status: 'failed', type: 'send_dm' }),
            Job.countDocuments({ automationId: id, status: 'pending' }),
            Job.countDocuments({ automationId: id, status: 'done', type: 'reply_comment' }),
            DMSession.countDocuments({ automationId: id, isCompleted: true }),
            DMSession.findOne({ automationId: id }).sort({ lastTriggeredAt: -1 }).select('lastTriggeredAt'),
            Job.findOne({ automationId: id, type: 'send_dm', status: 'done' }).sort({ createdAt: -1 }).select('createdAt'),
            Lead.findOne({ $or: [{ automationId: id }, { campaignId: id }] }).sort({ createdAt: -1 }).select('createdAt'),
            Job.findOne({ automationId: id, type: 'send_dm', status: 'failed' }).sort({ createdAt: -1 }).select('createdAt')
        ]);
        
        res.json({ 
            automation: { 
                ...automation, 
                leadsCount, 
                dmCount,
                failedDmCount,
                pendingDmCount,
                publicReplyCount,
                completedFlows,
                lastTriggerTime: lastTriggerSession?.lastTriggeredAt || null,
                lastDmSentTime: lastDmJob?.createdAt || null,
                lastLeadCapturedTime: lastLead?.createdAt || null,
                lastFailedDmTime: lastFailedJob?.createdAt || null
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Automation (V2)
app.put('/api/v2/automations/:id', authenticateToken, async (req, res) => {
    try {
        const { name, keywords, dmMessage, flowId, isActive, target, mode } = req.body;
        const { campaignType, templateType, followGate, leadFields, targetMediaIds } = req.body;
        const updateData = {};
        
        const validation = validateCampaignTypeTemplate(campaignType, templateType);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // BUG 3: Data Integrity Validation
        if (target && target.type !== 'global') {
            const mIds = target.mediaIds || [];
            if (mIds.some(id => id === null || id === undefined || id === "")) {
                return res.status(400).json({ error: "Invalid mediaIds" });
            }
        }

        let finalMediaIds = [];
        if (target && target.type === 'specific') {
            finalMediaIds = target.mediaIds || [];
        } else if (target && target.type === 'multiple') {
            finalMediaIds = target.mediaIds || [];
        }

        // Auto-migrate legacy target to new format
        if (target && finalMediaIds.length > 0) {
            target.mediaIds = finalMediaIds;
        }

        if (keywords && keywords.length > 0 && finalMediaIds.length > 0) {
            const duplicate = await Automation.findOne({
                _id: { $ne: req.params.id },
                userId: req.user.userId,
                isActive: true,
                'target.type': { $in: ['specific', 'multiple'] },
                'target.mediaIds': { $in: finalMediaIds },
                'trigger.keywords': { $in: keywords.map(k => k.toLowerCase().trim()) }
            });
            if (duplicate) {
                return res.status(409).json({ error: `Duplicate campaign detected. Another active campaign ("${duplicate.name}") already uses these keywords on the selected post(s).` });
            }
        } else if (keywords && keywords.length > 0 && target && target.type === 'global') {
            const duplicate = await Automation.findOne({
                _id: { $ne: req.params.id },
                userId: req.user.userId,
                isActive: true,
                'target.type': 'global',
                'trigger.keywords': { $in: keywords.map(k => k.toLowerCase().trim()) }
            });
            if (duplicate) {
                return res.status(409).json({ error: `Duplicate campaign detected. Another active "Any Post" campaign ("${duplicate.name}") already uses these keywords.` });
            }
        }

        if (name !== undefined) updateData.name = name;
        if (keywords !== undefined) updateData['trigger.keywords'] = keywords.map(k => k.toLowerCase().trim());
        if (dmMessage !== undefined) updateData['actions.0.text'] = dmMessage;
        if (dmMessage !== undefined) updateData.privateMessageText = dmMessage;
        if (req.body.publicReplyText !== undefined) updateData.publicReplyText = req.body.publicReplyText;
        if (flowId !== undefined) updateData.flowId = flowId || null;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (target !== undefined) updateData.target = target;
        if (mode !== undefined) updateData.mode = mode;
        
        if (campaignType !== undefined) updateData.campaignType = campaignType;
        if (templateType !== undefined) updateData.templateType = templateType;
        if (followGate !== undefined) updateData.followGate = followGate;
        if (leadFields !== undefined) updateData.leadFields = leadFields;
        if (targetMediaIds !== undefined) updateData.targetMediaIds = targetMediaIds;

        const auto = await Automation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { $set: updateData },
            { new: true }
        );

        if (!auto) return res.status(404).json({ error: 'Campaign not found' });
        res.status(200).json({ success: true, automation: auto });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- DASHBOARD ANALYTICS API ---

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId.toString();
        const now = new Date();
        const dayAgo = new Date(now - 86400000);
        const weekAgo = new Date(now - 7 * 86400000);

        const [
            totalAutomations, activeAutomations,
            totalJobs, pendingJobs, completedJobs, failedJobs,
            totalFlows, activeFlowStates,
            logsToday, logsThisWeek,
            igAccount, userDoc, totalLeads
        ] = await Promise.all([
            Automation.countDocuments({ userId, status: { $ne: 'deleted' } }),
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
            User.findById(userId),
            Lead.countDocuments({ userId })
        ]);

        const topAutomation = await Automation.findOne({ userId }).sort({ triggerCount: -1 });

        res.status(200).json({
            automations: { total: totalAutomations, active: activeAutomations },
            jobs: { total: totalJobs, pending: pendingJobs, completed: completedJobs, failed: failedJobs },
            flows: { total: totalFlows, activeStates: activeFlowStates },
            logs: { today: logsToday, thisWeek: logsThisWeek },
            totalDmsSent: userDoc?.dmCountThisMonth || 0,
            totalLeads,
            topKeyword: topAutomation?.trigger?.keywords?.[0] || null,
            instagramConnected: !!igAccount,
            instagram: igAccount ? {
                connected: true,
                instagram_id: igAccount.instagram_id,
                page_id: igAccount.page_id,
                username: igAccount.username || 'connected_user',
                profile_picture_url: igAccount.profile_picture_url || '',
                name: igAccount.name || '',
                status: igAccount.status,
                safeMode: igAccount.safeMode,
                updatedAt: igAccount.updatedAt
            } : { connected: false, lastUsername: userDoc?.lastInstagramUsername || null },
            plan: req.user.plan || 'free',
            impersonatedBy: req.user.impersonatedBy || null,
            impersonatorId: req.user.impersonatorId || null
        });
    } catch (err) {
        console.error('[DASHBOARD STATS ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- LEAD CAPTURE API ---
app.get('/c/:automationId', async (req, res) => {
    try {
        await Automation.findByIdAndUpdate(req.params.automationId, { $inc: { capturePageViews: 1 } });
    } catch (e) { console.error('Error tracking page view', e); }
    res.sendFile(path.join(__dirname, 'public', 'capture.html'));
});

app.get('/api/capture/config/:automationId', async (req, res) => {
    try {
        const auto = await Automation.findById(req.params.automationId);
        if (!auto) return res.status(404).json({ error: 'Campaign not found' });
        
        const user = await User.findById(auto.userId);
        const igAccount = await InstagramAccount.findOne({ userId: auto.userId });
        
        res.status(200).json({
            campaignName: auto.name || 'this campaign',
            leadFields: auto.leadFields || ['email'],
            creatorName: igAccount?.name || user?.name || 'Creator',
            avatarUrl: igAccount?.profile_picture_url || ''
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/leads/submit', async (req, res) => {
    try {
        const { automationId, name, email, phone, sourcePost, triggerKeyword } = req.body;
        if (!automationId || !name) return res.status(400).json({ error: 'Missing required fields' });
        
        const auto = await Automation.findById(automationId);
        if (!auto) return res.status(404).json({ error: 'Campaign not found' });
        
        const updateData = {
            userId: auto.userId,
            name,
            campaignId: automationId,
            campaignName: auto.name || auto.campaignType,
            campaignType: auto.campaignType,
            capturedAt: new Date()
        };
        if (sourcePost) updateData.sourcePost = sourcePost;
        if (triggerKeyword) updateData.triggerKeyword = triggerKeyword;
        if (phone) updateData.phone = phone;

        // Deduplication Logic
        const query = { campaignId: automationId };
        if (email) {
            query.email = email;
            updateData.email = email;
        } else if (phone) {
            query.phone = phone;
        } else {
            // Unlikely to have neither email nor phone if required, but fallback to unique identifier
            query._id = new mongoose.Types.ObjectId(); 
        }

        // Save Lead using upsert to prevent duplicates
        const lead = await Lead.findOneAndUpdate(
            query,
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        // Soft-gate logic: Flag creator account if over limit
        try {
            const user = await User.findById(auto.userId);
            if (user) {
                const planLimits = await getPlanLimits(user);
                const leadLimit = planLimits.leadLimit || 1000;
                const leadCount = await Lead.countDocuments({ userId: auto.userId });
                if (leadCount >= leadLimit && !user.leadQuotaExceeded) {
                    await User.updateOne({ _id: auto.userId }, { $set: { leadQuotaExceeded: true } });
                } else if (leadCount < leadLimit && user.leadQuotaExceeded) {
                    await User.updateOne({ _id: auto.userId }, { $set: { leadQuotaExceeded: false } });
                }
            }
        } catch (err) {
            console.error('[LEAD LIMIT CHECK ERROR]', err);
        }
        
        // Respond with finalLink
        const finalLink = auto.finalLink || 'https://dmorbit.com';
        res.status(200).json({ success: true, redirectUrl: finalLink });
    } catch (err) {
        console.error('[LEAD SUBMIT ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- CRM API ---
app.get('/api/crm/leads', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId.toString();
        const leads = await Lead.find({ userId }).sort({ capturedAt: -1 }).lean();
        
        // Also merge from Log if they have metadata.lead (fallback)
        const logsWithLeads = await Log.find({ ownerId: userId, 'metadata.lead': { $exists: true } }).sort({ timestamp: -1 }).lean();
        
        const mergedLeads = [...leads];
        logsWithLeads.forEach(log => {
            if (log.metadata && log.metadata.lead) {
                mergedLeads.push({
                    _id: log._id,
                    name: log.metadata.lead.name || 'Unknown',
                    email: log.metadata.lead.email || '-',
                    phone: log.metadata.lead.phone || '-',
                    campaignSource: log.metadata.campaignName || 'Unknown Campaign',
                    triggerKeyword: log.keyword || '-',
                    sourcePost: log.metadata.mediaId || '-',
                    capturedAt: log.timestamp
                });
            }
        });
        
        // Sort merged by capturedAt desc
        mergedLeads.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
        
        res.status(200).json(mergedLeads);
    } catch (err) {
        console.error('[CRM ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- CAMPAIGN ANALYTICS API ---
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId.toString();
        
        const totalComments = await Log.aggregate([
            { $match: { ownerId: userId } },
            { $group: { _id: null, total: { $sum: "$commentCount" } } }
        ]);
        
        const totalDMs = await Log.aggregate([
            { $match: { ownerId: userId } },
            { $group: { _id: null, total: { $sum: "$dmCount" } } }
        ]);
        
        const totalLeads = await Lead.countDocuments({ userId });
        
        const topCampaignAgg = await Lead.aggregate([
            { $match: { userId } },
            { $group: { _id: "$campaignName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        
        const topKeywordAgg = await Lead.aggregate([
            { $match: { userId, triggerKeyword: { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: "$triggerKeyword", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const topPostAgg = await Lead.aggregate([
            { $match: { userId, sourcePost: { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: "$sourcePost", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const totalViewsAgg = await Automation.aggregate([
            { $match: { userId } },
            { $group: { _id: null, total: { $sum: "$capturePageViews" } } }
        ]);
        
        const followGatePasses = await Log.countDocuments({ ownerId: userId, 'metadata.followGatePassed': true });
        const totalFollowGateChecks = await Log.countDocuments({ ownerId: userId, 'metadata.followGateChecked': true });
        
        const views = totalViewsAgg[0] ? totalViewsAgg[0].total : 0;
        const conversionRate = views > 0 ? ((totalLeads / views) * 100).toFixed(1) : 0;

        res.status(200).json({
            totalComments: totalComments[0] ? totalComments[0].total : 0,
            totalDMs: totalDMs[0] ? totalDMs[0].total : 0,
            totalViews: views,
            leadsGenerated: totalLeads,
            conversionRate: conversionRate,
            topCampaign: topCampaignAgg[0] ? topCampaignAgg[0]._id : 'None',
            topKeyword: topKeywordAgg[0] ? topKeywordAgg[0]._id : 'None',
            topPost: topPostAgg[0] ? topPostAgg[0]._id : 'None',
            followGateConversion: totalFollowGateChecks > 0 ? ((followGatePasses / totalFollowGateChecks) * 100).toFixed(1) + '%' : 'N/A'
        });

    } catch (err) {
        console.error('[ANALYTICS ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- SMART BIO TRACKING API ---
app.get('/b/:userId/:linkId', async (req, res) => {
    try {
        const { userId, linkId } = req.params;
        const user = await User.findById(userId);
        if (!user || !user.smartBio || !user.smartBio.links) {
            return res.status(404).send('Link not found');
        }
        
        const link = user.smartBio.links.id(linkId);
        if (!link) {
            return res.status(404).send('Link not found');
        }
        
        link.clicks = (link.clicks || 0) + 1;
        await user.save();
        
        res.redirect(302, link.url);
    } catch (err) {
        console.error('[SMART BIO TRACKING ERROR]', err);
        res.status(500).send('Internal Server Error');
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

// --- QUEUE JOBS API (Queue Transparency) ---
app.get('/api/jobs', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId.toString();
        // Fetch active pending, processing, and recently failed jobs (limit to 10)
        const jobs = await Job.find({ 
            userId,
            status: { $in: ['pending', 'processing', 'failed'] }
        })
        .sort({ createdAt: -1 })
        .limit(10);
        res.status(200).json({ success: true, jobs });
    } catch (err) {
        console.error('[JOBS QUEUE API ERROR]', err);
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
        const userId = req.user.userId.toString();
        const igAccount = await InstagramAccount.findOne({ userId });
        const automationCount = await Automation.countDocuments({ userId: req.user.userId, status: { $ne: 'deleted' } });
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
                username: igAccount.username || 'connected_user',
                profile_picture_url: igAccount.profile_picture_url || '',
                name: igAccount.name || '',
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

// --- INSTAGRAM DISCONNECT API ---
app.post('/api/instagram/disconnect', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId.toString();
        const existingIg = await InstagramAccount.findOne({ userId });
        const lastUsername = existingIg?.username || null;
        
        await InstagramAccount.deleteMany({ userId });
        
        const updateData = { instagramConnected: false };
        if (lastUsername) updateData.lastInstagramUsername = lastUsername;
        
        await User.findByIdAndUpdate(userId, updateData);
        
        // Auto-cancel orphaned jobs
        await Job.updateMany(
            { userId: userId, status: { $in: ['pending', 'processing'] } }, 
            { status: 'failed', error: 'Cancelled: Instagram disconnected' }
        );
        await Followup.updateMany(
            { ownerId: userId, status: "pending" }, 
            { status: "failed" }
        );

        res.status(200).json({ success: true, message: 'Instagram account disconnected successfully.' });
    } catch (err) {
        console.error('[INSTAGRAM DISCONNECT ERROR]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- REFRESH INSTAGRAM PROFILE (re-fetch real username/pic from Meta API) ---
app.post('/api/instagram/refresh-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId.toString();
        const account = await InstagramAccount.findOne({ userId });
        if (!account) return res.status(404).json({ error: 'No Instagram account connected.' });
        if (!account.access_token) return res.status(400).json({ error: 'No access token stored.' });

        let igUsername = account.username;
        let igProfilePic = account.profile_picture_url || '';
        let igName = account.name || '';
        let updated = false;

        // Try fetching from Instagram Business Account ID
        if (account.instagram_id) {
            try {
                const igRes = await axios.get(`https://graph.facebook.com/v19.0/${account.instagram_id}`, {
                    params: {
                        fields: 'username,name,biography,followers_count',
                        access_token: account.access_token
                    }
                });
                if (igRes.data && igRes.data.username) {
                    igUsername = igRes.data.username;
                    igName = igRes.data.name || igName;
                    updated = true;
                    console.log(`[PROFILE REFRESH] IG username fetched: @${igUsername}`);
                }
            } catch (err1) {
                console.warn('[PROFILE REFRESH] IG Account ID fetch failed:', err1.message);
            }
        }

        // Fetch picture from Page ID
        if (account.page_id) {
            try {
                const pageRes = await axios.get(`https://graph.facebook.com/v19.0/${account.page_id}`, {
                    params: {
                        fields: 'instagram_business_account{username,name},picture.type(large)',
                        access_token: account.access_token
                    }
                });
                if (pageRes.data) {
                    if (pageRes.data.picture && pageRes.data.picture.data && pageRes.data.picture.data.url) {
                        igProfilePic = pageRes.data.picture.data.url;
                        updated = true;
                    }
                    const igBiz = pageRes.data.instagram_business_account;
                    if (igBiz && igBiz.username) {
                        igUsername = igBiz.username;
                        igName = igBiz.name || igName;
                        updated = true;
                    }
                }
            } catch (err2) {
                console.warn('[PROFILE REFRESH] Page-level fetch failed:', err2.message);
            }
        }

        // Save updated profile data
        await InstagramAccount.findOneAndUpdate(
            { userId },
            { username: igUsername, profile_picture_url: igProfilePic, name: igName, updatedAt: new Date() }
        );

        res.status(200).json({
            success: true,
            updated,
            username: igUsername,
            profile_picture_url: igProfilePic,
            name: igName
        });
    } catch (err) {
        console.error('[INSTAGRAM REFRESH PROFILE ERROR]', err);
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

// --- DMOrbit Automation Status & Deletion Controls ---
app.post('/api/automations/toggle', authenticateToken, async (req, res) => {
    const { automationId, status } = req.body; 
    try {
        const auto = await Automation.findOne({ _id: automationId, userId: req.user.userId });
        if (!auto) return res.status(404).json({ error: 'Automation not found' });
        auto.isActive = (status === 'active');
        auto.status = status;
        await auto.save();
        res.json({ success: true, message: `Automation status updated to ${status}` });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


// --- Smart Bio Creators Funnel Endpoints ---
app.get('/api/smartbio', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, smartBio: user.smartBio || {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/smartbio', authenticateToken, async (req, res) => {
    try {
        const { profileImg, title, description, links } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const plan = (user.plan || 'FREE').toUpperCase();
        let maxLinks = 1;
        if (plan === 'CREATOR' || plan === 'BASIC') maxLinks = 5;
        if (plan === 'PRO') maxLinks = 15;

        if (links && links.length > maxLinks) {
            return res.status(403).json({ error: `Your ${plan} plan allows a maximum of ${maxLinks} links. Please upgrade for more.` });
        }
        
        if (plan === 'FREE' && profileImg) {
             return res.status(403).json({ error: `Adding a Profile Image to your Smart Bio is a premium feature. Please upgrade.` });
        }

        user.smartBio = {
            profileImg: profileImg || '',
            title: title || '',
            description: description || '',
            links: links ? links.slice(0, maxLinks) : []
        };
        await user.save();
        
        const cleanTitle = (title || '').replace('@', '').trim();
        const bioUrl = cleanTitle ? `${req.protocol}://${req.get('host')}/bio/${cleanTitle}` : null;
        
        res.json({ success: true, smartBio: user.smartBio, bioUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Mock Billing / Subscription Upgrades & Top-Ups ---
app.post('/api/billing/topup', authenticateToken, async (req, res) => {
    try {
        const { credits } = req.body;
        if (!credits || isNaN(credits) || credits <= 0) {
            return res.status(400).json({ error: 'Invalid top-up credits quantity.' });
        }
        
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Enforce paid-only topups rule via plan limits
        const limits = await getPlanLimits(user);
        if (!limits.topupAllowed) {
            return res.status(403).json({ error: 'Top-ups are only available on paid plans. Please upgrade your plan first.' });
        }
        
        // Generate Stripe Checkout for Top-up
        // Assuming 1 Credit = 1 INR for simplicity. Price is passed to stripe in smallest unit (paise)
        const unitAmountPaise = 100; // 1 INR
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: `DMOrbit Top-up: ${credits} DMs`,
                        description: `Add ${credits} extra DMs to your account. Valid for 90 days.`,
                    },
                    unit_amount: unitAmountPaise * credits,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'https://dmorbit.in'}/dashboard.html?topup=success`,
            cancel_url: `${process.env.CLIENT_URL || 'https://dmorbit.in'}/dashboard.html?topup=cancel`,
            metadata: { userId: user._id.toString(), topupCredits: credits.toString() }
        });
        
        res.json({ success: true, url: session.url });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/billing/upgrade', authenticateToken, async (req, res) => {
    try {
        const plan = req.body.plan; // 'pro', 'creator' etc.
        const user = await User.findById(req.user.userId);
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const nextReset = new Date();
        nextReset.setDate(nextReset.getDate() + 30);

        user.plan = plan.toUpperCase();
        user.dmCountThisMonth = 0; // Reset DMs on upgrading
        user.billingCycleResetDate = nextReset;
        await user.save();
        
        res.json({ success: true, plan: user.plan });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Beautiful dynamic public Smart Bio renderer ---
app.get('/bio/:username', async (req, res) => {
    try {
        const username = req.params.username.trim().toLowerCase();
        
        // Find user by username inside smartBio profile case-insensitively
        const user = await User.findOne({
            "smartBio.title": { $regex: new RegExp(`^@?${username}$`, 'i') }
        });
        
        if (!user || !user.smartBio || !user.smartBio.title) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Profile Not Found — DMOrbit</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
                    <style>
                        body {
                            background-color: #09090b;
                            color: #f4f4f5;
                            font-family: 'Outfit', sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .container {
                            max-width: 400px;
                            padding: 24px;
                            border: 1px solid rgba(255,255,255,0.05);
                            background: rgba(255,255,255,0.02);
                            border-radius: 24px;
                        }
                        h1 { font-size: 24px; margin-bottom: 8px; font-weight: 600; }
                        p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
                        a { color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Profile Not Found</h1>
                        <p>The Smart Bio link you are trying to visit does not exist or has been disabled.</p>
                        <a href="/">Go to DMOrbit</a>
                    </div>
                </body>
                </html>
            `);
        }
        
        function esc(str) {
            return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }
        
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${esc(user.smartBio.title)} — Links</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg: #09090b;
                        --card: rgba(255, 255, 255, 0.03);
                        --border: rgba(255, 255, 255, 0.08);
                        --text: #f4f4f5;
                        --text-muted: #a1a1aa;
                        --primary: #4f46e5;
                        --primary-glow: rgba(79, 70, 229, 0.15);
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: 'Outfit', sans-serif;
                        background-color: var(--bg);
                        color: var(--text);
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        min-height: 100vh;
                        padding: 60px 20px 40px;
                        overflow-x: hidden;
                    }
                    body::before {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: radial-gradient(circle at 50% -20%, rgba(79, 70, 229, 0.18) 0%, transparent 60%),
                                    radial-gradient(circle at 10% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 40%);
                        z-index: -1;
                        pointer-events: none;
                    }
                    .container {
                        width: 100%;
                        max-width: 480px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        animation: fadeIn 0.8s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .profile-img {
                        width: 96px;
                        height: 96px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 2px solid var(--border);
                        margin-bottom: 20px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                        background: rgba(255, 255, 255, 0.05);
                        transition: transform 0.3s ease;
                    }
                    .profile-img:hover {
                        transform: scale(1.05);
                    }
                    h1 {
                        font-size: 20px;
                        font-weight: 700;
                        margin-bottom: 8px;
                        letter-spacing: -0.02em;
                        background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    .bio-desc {
                        font-size: 14px;
                        color: var(--text-muted);
                        line-height: 1.5;
                        margin-bottom: 32px;
                        max-width: 380px;
                    }
                    .links-wrapper {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        margin-bottom: 40px;
                    }
                    .bio-link-btn {
                        display: block;
                        width: 100%;
                        padding: 16px 24px;
                        background: var(--card);
                        border: 1px solid var(--border);
                        border-radius: 16px;
                        color: var(--text);
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 600;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        backdrop-filter: blur(8px);
                        position: relative;
                        overflow: hidden;
                    }
                    .bio-link-btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
                        transform: translateX(-100%);
                        transition: transform 0.5s ease;
                    }
                    .bio-link-btn:hover {
                        background: rgba(255, 255, 255, 0.08);
                        border-color: rgba(255, 255, 255, 0.2);
                        transform: translateY(-2px);
                        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.3);
                    }
                    .bio-link-btn:hover::before {
                        transform: translateX(100%);
                    }
                    .bio-link-btn:active {
                        transform: translateY(1px);
                    }
                    .footer {
                        margin-top: auto;
                        font-size: 11px;
                        color: var(--text-muted);
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        opacity: 0.7;
                    }
                    .footer svg {
                        color: var(--primary);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${user.smartBio.profileImg ? `<img class="profile-img" src="${esc(user.smartBio.profileImg)}" alt="Profile Image">` : ''}
                    <h1>${esc(user.smartBio.title || '@username')}</h1>
                    <p class="bio-desc">${esc(user.smartBio.description || 'Welcome to my links page!')}</p>
                    
                    <div class="links-wrapper">
                        ${user.smartBio.links.map(link => `
                            <a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" class="bio-link-btn">
                                ${esc(link.title)}
                            </a>
                        `).join('')}
                    </div>
                    
                    <footer class="footer">
                        Powered by 
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        <strong>DMOrbit</strong>
                    </footer>
                </div>
            </body>
            </html>
        `;
        
        res.send(html);
    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
});

// --- TANSTACK START SSR INTEGRATION ---
let ssrHandler;
import('file:///' + path.join(__dirname, 'frontend/dist/server/server.js').replace(/\\/g, '/')).then(module => {
    const { createServerAdapter } = require('@whatwg-node/server');
    const originalFetch = module.default.fetch;
    const patchedFetch = async (request, env, ctx) => {
        const response = await originalFetch(request, env, ctx);
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    };
    ssrHandler = createServerAdapter(patchedFetch);
}).catch(err => console.error("Failed to load SSR handler:", err));

app.get('*', (req, res, next) => {
    if (ssrHandler) {
        return ssrHandler(req, res, next);
    }
    next();
});

app.use((err, req, res, next) => {
    console.error("EXPRESS GLOBAL ERROR:", err.message);
    res.status(500).send("Internal Server Error");
});

// --- DATABASE SEEDING ENGINE ---
const seedDatabase = async () => {
    try {
        console.log("🌱 Database seeding check...");
        
        const planCount = await Plan.countDocuments();
        if (planCount === 0) {
            console.log("No plans found in database. Seeding default FREE, CREATOR, and PRO plans...");
            await Plan.create([
                {
                    planId: 'FREE',
                    name: 'Free',
                    monthlyDMLimit: 1000,
                    rolloverRules: false,
                    topupAllowed: false,
                    connectedAccountLimit: 1,
                    automationLimit: 3,
                    smartBioAccess: false,
                    queuePriority: 'LOW',
                    price: 0
                },
                {
                    planId: 'CREATOR',
                    name: 'Creator',
                    monthlyDMLimit: 25000,
                    rolloverRules: true,
                    topupAllowed: true,
                    connectedAccountLimit: 3,
                    automationLimit: 15,
                    smartBioAccess: true,
                    queuePriority: 'MEDIUM',
                    price: 499
                },
                {
                    planId: 'PRO',
                    name: 'Pro',
                    monthlyDMLimit: 100000,
                    rolloverRules: true,
                    topupAllowed: true,
                    connectedAccountLimit: 10,
                    automationLimit: 100,
                    smartBioAccess: true,
                    queuePriority: 'HIGH',
                    price: 1299
                }
            ]);
            console.log("✅ Default plans seeded.");
        }

        const defaultSettings = [
            { key: 'queue_paused', value: false },
            { key: 'queue_pacing', value: 10000 },
            { key: 'support_email', value: 'support@dmorbit.in' },
            { key: 'maintenance_mode', value: false },
            { key: 'default_limit', value: 1000 },
            { key: 'onboarding_toggles', value: { checklist_enabled: true } }
        ];

        for (let s of defaultSettings) {
            const exists = await GlobalSettings.findOne({ key: s.key });
            if (!exists) {
                await GlobalSettings.create(s);
                console.log(`✅ Default setting seeded: ${s.key}`);
            }
        }
        console.log("🌱 Database seeding check complete.");
    } catch (err) {
        console.error("❌ Error seeding database:", err.message);
    }
};

server.listen(PORT, async () => {
    console.log(`Server and WS Portal running on port ${PORT}`);
    console.log("Webhook URL ready");
    await seedDatabase();
});
