# Audits

## Landing Page SSR Audit (2026-06-21)
**Problem:** Landing page rendered as unstyled HTML on localhost despite passing tests.
**Findings:** Port 3000 was held hostage by a background, orphaned Node process. The active development server was failing silently or serving stale assets.
**Root Cause:** `EADDRINUSE` conflicts causing an outdated in-memory `express.static` instance to serve stale `.css` hashes.
**Resolution:** Implemented explicit `npx kill-port 3000` protocol before starting the server.

## Instagram Connection State Audit (2026-06-22)
**Problem:** Dashboard showed "Connected" while Sidebar and Settings remained locked showing "Not Connected".
**Findings:** `/api/dashboard/stats` queried the DB directly, bypassing the global Zustand store. The Zustand store was permanently stuck disconnected because `__root.tsx` skipped fetching `/api/me` if `isAuthLoaded` was true in localStorage.
**Root Cause:** The `isAuthLoaded` short-circuit prevented store hydration upon hard refresh.
**Resolution:** Removed the `isAuthLoaded` short-circuit in `__root.tsx`, forcing a fresh hydration of `/api/me` on every page load to guarantee a Single Source of Truth for the UI.

## Environment Architecture Audit
**Problem:** Need explicit definitions of the localhost, dmorbit.in, and Railway environments.
**Findings:** All environments currently point to a shared database, creating destructive test risks.
**Root Cause:** Historical lack of database separation during MVP phase.
**Resolution:** Defined strict Environment Guidelines (`ENVIRONMENTS.md`) and flagged future staging DB separation as a goal.

## Deployment Workflow Audit
**Problem:** The deployment path was ad-hoc and risked uncommitted frontend changes reaching production.
**Findings:** Developers regularly forgot to execute `npm run build` or commit the `dist` artifacts before pushing.
**Root Cause:** The SSR model bundles static React assets directly into Express, meaning backend deploys push whatever frontend assets are checked into Git at the time.
**Resolution:** Created the definitive `DEPLOYMENT.md` handbook with strict Pre-Deploy Checklists to prevent mis-deployments.

## Domain Canonicalization Audit
**Problem:** The Railway app domain can bypass `dmorbit.in`, risking split sessions.
**Findings:** The backend doesn't currently force strict redirect logic at the Express level.
**Root Cause:** Initial infrastructure setup didn't prioritize canonical routing over functional APIs.
**Resolution:** Flagged as a future architecture goal in `ENVIRONMENTS.md`.
