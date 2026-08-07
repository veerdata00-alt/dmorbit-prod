# Environments

## Environment Overview

### 1. Localhost
- **Purpose:** Development, testing, and debugging.
- **URL:** `http://localhost:3000`
- **Who uses it:** Developer only.
- **Database connection:** Shared MongoDB (Production DB) — currently used across environments.
- **OAuth behavior:** Uses specific Meta App OAuth redirects configured for localhost (or proxy).
- **Deployment relationship:** The origin of all code changes. Code is built and tested here before being pushed to Git.

### 2. dmorbit.in
- **Purpose:** Official Production application and primary public-facing brand.
- **URL:** `https://dmorbit.in`
- **Who uses it:** Real users and creators.
- **Database connection:** Shared MongoDB (Production DB).
- **OAuth behavior:** Primary authorized domain for Meta Graph API and OAuth callbacks.
- **Deployment relationship:** The canonical production environment that reflects the `main` branch.

### 3. Railway
- **Purpose:** Underlying infrastructure host for the Node.js application.
- **URL:** `https://dmorbit-production.up.railway.app` (or similar auto-generated domain).
- **Who uses it:** End users indirectly; developers for infrastructure logs.
- **Database connection:** Shared MongoDB (Production DB).
- **OAuth behavior:** Should NOT handle direct OAuth callbacks due to strict domain matching requirements from Meta.
- **Deployment relationship:** Listens to Git pushes. Automatically builds and deploys the `main` branch.

---

## Environment Responsibilities

### Localhost
**Purpose:** Development and testing
**Used By:** Developer only
**Should Receive Traffic:** No
**Should Be Indexed:** No
**Deployment Trigger:** Manual (Developers pull and run locally)

### dmorbit.in
**Purpose:** Production application
**Used By:** Real users
**Should Receive Traffic:** Yes
**Should Be Indexed:** Yes
**Deployment Trigger:** After successful testing locally, triggered via Git push to Railway

### Railway
**Purpose:** Infrastructure host
**Used By:** End users indirectly
**Should Receive Traffic:** No
**Should Be Indexed:** No
**Should Redirect:** Yes → `https://dmorbit.in`

---

## Current Risks
- **Shared database risk:** Localhost uses the same MongoDB instance as Production. Destructive tests locally will corrupt production data.
- **OAuth redirect risk:** Meta OAuth requires strict URL matching. Testing login flows on Railway domains or Ngrok proxies can fail if not meticulously registered in the Meta Developer Console.
- **Session fragmentation risk:** Using multiple domains (Railway vs dmorbit.in) can cause session cookies (JWTs) to be dropped across origins due to CORS/SameSite policies.
- **Environment drift risk:** The `.env` file locally might fall out of sync with the Railway environment variables over time.

---

## Future Architecture Goals
- **Dev DB:** Create a staging or local MongoDB database to separate test data from real users.
- **Production DB:** Isolate production data entirely from developer access tokens.
- **Canonical domain:** Enforce strict 301 redirects at the Express layer so that all traffic reaching the Railway URL is forced onto `dmorbit.in`.
- **Stable deployment pipeline:** Introduce automated testing (CI) via GitHub Actions before code is allowed to deploy on Railway.
