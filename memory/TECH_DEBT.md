# Technical Debt

## Incomplete Stripe Migration
**Impact:** Medium
**Priority:** Medium
**Recommended Fix:** The Stripe webhooks and specific feature gating logic on the backend `/api/stripe` and `User` schema need to be thoroughly tested and fully connected to the UI elements to correctly restrict Free users.

## Hardcoded Frontend URL Fallbacks
**Impact:** Low
**Priority:** Low
**Recommended Fix:** Some redirects (e.g. in Stripe creation or Auth callbacks) may rely on hardcoded `http://localhost:3000`. Ensure `process.env.FRONTEND_URL` is universally applied in `server.js`.
