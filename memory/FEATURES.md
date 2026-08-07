# Feature Inventory

## 1. Authentication
**Purpose:** Authenticate users via Firebase (Google/Email) and issue custom JWTs for API access.
**Status:** Working
**Frontend Files:** `frontend/src/routes/login.tsx`, `frontend/src/routes/signup.tsx`, `frontend/src/lib/firebase.ts`
**Backend Files:** `server.js` (`/api/auth/firebase`, `/api/login`, `/api/signup`, `authenticateToken` middleware)
**Dependencies:** `firebase`, `jsonwebtoken`, `bcrypt`

## 2. Instagram Connection
**Purpose:** Bind a user's Instagram account to their DMOrbit profile via Meta Graph OAuth.
**Status:** Working
**Frontend Files:** `frontend/src/routes/settings.tsx`, `frontend/src/routes/__root.tsx`
**Backend Files:** `server.js` (`/api/auth/instagram`, `/api/auth/instagram/callback`, `/api/me`)
**Dependencies:** Meta Graph API, `axios`

## 3. Campaigns (Automations)
**Purpose:** Automatically reply to comments or DMs based on trigger keywords.
**Status:** Working (Basic CRUD)
**Frontend Files:** `frontend/src/routes/campaigns.tsx`, `frontend/src/routes/campaigns_.$id.tsx`
**Backend Files:** `server.js` (`/api/automations`)
**Dependencies:** `Automation` MongoDB schema

## 4. Dashboard Stats
**Purpose:** Display high-level metrics (active campaigns, DMs sent, total leads) for the user.
**Status:** Working
**Frontend Files:** `frontend/src/routes/home.tsx`
**Backend Files:** `server.js` (`/api/dashboard/stats`)
**Dependencies:** `Automation`, `Lead`, `Message` MongoDB collections

## 5. Billing / Stripe
**Purpose:** Manage Free vs Pro tiers and handle subscriptions.
**Status:** Partial
**Frontend Files:** `frontend/src/routes/billing.tsx`
**Backend Files:** `server.js` (`/api/stripe/create-checkout-session`)
**Dependencies:** `stripe`
