# Deployment Handbook

This is the definitive deployment reference for DMOrbit.

## Deployment Philosophy
- **Build locally first:** Always compile the frontend assets to catch build errors before they reach production.
- **Verify locally:** Use `http://localhost:3000` to confirm SSR, APIs, and UI layout work exactly as expected.
- **Deploy only tested code:** Never push code to `main` without running it first.
- **Production is never the testing environment:** If you need to test live webhooks, use a local tunneling service (like Ngrok) pointing to Localhost, rather than pushing untested webhook logic to Production.

---

## Local Development Workflow
1. **Run project:** `npx kill-port 3000; node server.js`
   *(Always kill the port to prevent stale in-memory Node processes from serving outdated assets.)*
2. **Test changes:** Open `http://localhost:3000` in the browser and navigate through the modified feature.
3. **Verify functionality:** Check the terminal for unhandled promise rejections or backend crashes.
4. **Review memory files:** Ensure `MEMORY_WORKFLOW.md` protocols are followed and `CURRENT_STATE.md` reflects reality.

---

## Pre-Deploy Checklist
- [ ] Authentication (Login/Signup flows)
- [ ] Instagram Connection (OAuth callback and settings synchronization)
- [ ] Campaign Creation (CRUD operations)
- [ ] Dashboard (Stats loading)
- [ ] Settings (Profile and connection views)
- [ ] Landing Page (SSR styling loads without 404s)
- [ ] Build Success (`npm run build` inside `frontend/` succeeds)
- [ ] No Critical Console Errors
- [ ] Memory Updated (`CHANGELOG.md` and `CURRENT_STATE.md`)

---

## Deployment Workflow
1. **Review git status:** `git status` to see what is modified.
2. **Review staged files:** `git diff --cached --name-only` to ensure only intended files are queued.
3. **Verify no scratch files:** Confirm no `.js` test scripts, `.md` scratch files, or unwanted logs are staged.
4. **Commit:** Provide a clear, atomic commit message explaining the change.
5. **Push:** `git push origin main`
6. **Trigger deployment:** Railway will automatically intercept the push and begin building. Watch the Railway dashboard for the build log.
7. **Verify production:** Open `https://dmorbit.in` and perform the Post-Deploy Verification.

---

## Post-Deploy Verification
- [ ] Homepage (loads instantly, no 404 assets)
- [ ] Login (session persists)
- [ ] Instagram Connection (status shows accurately)
- [ ] Campaigns (list loads, can create new)
- [ ] Dashboard (numbers render correctly)
- [ ] Settings (loads without crashing)
- [ ] Webhook Health (test an Instagram comment on a connected page)
- [ ] Critical APIs (network tab shows 200 OKs)

---

## Emergency Rollback Procedure

**When rollback is required:**
- The production server crashes continuously.
- A critical bug prevents users from logging in or connecting Instagram.
- The build fails on Railway but passed locally.

**How rollback should happen:**
1. Identify the last known stable commit hash (`git log --oneline`).
2. Run `git revert <broken_commit_hash>` to create a reverse commit.
3. Push to `main` immediately (`git push origin main`).
4. Wait for Railway to build the reverted commit.

**How to verify rollback success:**
- Railway build logs report success.
- Visiting `https://dmorbit.in` confirms the broken functionality is gone.
- Network requests return 200 OK.

---

## Known Deployment Risks
- **Uncommitted frontend changes:** Developers often forget to run `npm run build` or commit the resulting `dist/` directory, causing production to serve an old frontend against a new backend.
- **Stale build artifacts:** Artifacts left in `frontend/dist` during massive refactors can cause bundle bloating or conflicts.
- **Environment variable mismatches:** Adding a new secret to `.env` locally but forgetting to add it to the Railway project variables will cause immediate crashes in production.
- **OAuth configuration mismatches:** Changing OAuth callback URIs locally but forgetting to update them in the Meta App dashboard breaks production authentication.
