# Changelog

## 2026-06-22
- **Fixed:** Instagram connection state synchronization bug where the dashboard showed "Connected" while the sidebar remained locked. Removed the short-circuit in `__root.tsx` to ensure `/api/me` hydrates the store.
- **Removed:** Redundant "Instagram Connected" stat card from the Dashboard grid to streamline UX.
- **Added:** Permanent Project Memory System scaffolding (`memory/` directory).

## 2026-06-21
- **Fixed:** Unstyled SSR landing page issue caused by stale asset paths and orphaned Node processes.
- **Added:** `frontend/.gitignore` cleanup to prevent staging of temporary/compiled assets.
