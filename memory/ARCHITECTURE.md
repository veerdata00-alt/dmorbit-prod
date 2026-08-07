# Architecture

## Frontend Architecture
- **Framework:** React + TanStack Router (SSR via TanStack Start).
- **Styling:** Tailwind CSS + custom `ig-gradient` utilities.
- **State Management:** Zustand (`store.ts`) for global auth state; TanStack React Query for data fetching.

## Backend Architecture
- **Server:** Express.js running on Node.
- **SSR Binding:** `vite` middleware injects the TanStack Start frontend directly into the Express pipeline during production.

## Database
- **Engine:** MongoDB via Mongoose.

## Authentication Flow
1. User logs in via Firebase Google/Email popup.
2. Frontend sends Firebase `idToken` to backend `/api/auth/firebase`.
3. Backend verifies token, creates/finds Mongo User, and issues a custom JWT (`jsonwebtoken`) set as an HTTP-only cookie.
4. Future requests to protected endpoints use `authenticateToken` middleware to verify the custom JWT.

## Instagram Integration Flow
1. User clicks "Connect". Directed to Meta OAuth.
2. Meta returns callback to `/api/auth/instagram/callback`.
3. Backend fetches long-lived token, registers Webhook subscriptions for the page, and creates `InstagramAccount` DB entry.

## Queue System / Webhook Flow
- Meta sends webhook events to `/api/webhooks/instagram`.
- Backend verifies signature and parses messages/comments.
- *Note:* A robust external queue system (like Redis/Bull) is currently not fully scaled out; basic processing occurs synchronously or via basic async functions.

## Deployment Flow
- Monorepo structure. `npm run build` compiles Vite assets to `dist/client` and SSR bundle to `dist/server`.
- Backend serves `dist/client` statically.
