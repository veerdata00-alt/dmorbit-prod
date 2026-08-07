# Decisions

## Date: 2026-06-22
**Decision:** Implement a single source of truth for the Instagram connection state.
**Reason:** The frontend dashboard, banner, settings, and sidebar were showing conflicting connection states because they relied on a mix of local `statsData` and an improperly hydrated global store.
**Impact:** `__root.tsx` now universally fetches `/api/me` on hard refresh to hydrate the Zustand store, which controls all UI locks and banners centrally. The backend `/api/me` verifies the DB directly instead of trusting stale User document flags.
**Status:** Implemented

## Date: 2026-06-21
**Decision:** Route frontend assets through Express instead of treating Vite and Node as totally disconnected entities in production.
**Reason:** Unstyled landing pages were occurring because the Node server was holding onto stale memory and paths.
**Impact:** Explicitly separated the `dist/client/assets` directory for static serving and ensured proper `npx kill-port` usage to clear stale Node processes.
**Status:** Implemented
