# DMOrbit Memory Workflow

## Session End Protocol
Before ending any meaningful development session, follow this procedure.

### Step 1: Determine Meaningfulness
Assess if the session qualifies as meaningful.

**Meaningful (Requires Update):**
- Feature added
- Feature removed
- Major bug fixed
- Architecture modified
- API modified
- Database modified
- Infrastructure modified
- Product decision made
- Deployment change made

**Not Meaningful (Skip Update):**
- CSS tweaks
- Spacing fixes
- Temporary debugging
- Failed experiments
- Console logs
- Refactors without behavior changes

---

### Step 2: Core Updates
If the session was meaningful, you MUST update the following files:
1. `memory/CURRENT_STATE.md`
2. `memory/CHANGELOG.md`
3. `memory/sessions/YYYY-MM-DD.md`

---

### Step 3: Feature Updates
If a feature was changed (added, removed, or scope altered), also update:
- `memory/FEATURES.md`

---

### Step 4: Decision Updates
If a product decision was made, request explicit human approval before updating:
- `memory/DECISIONS.md`

---

### Step 5: Architecture Updates
If the technical architecture changed, request explicit human approval before updating:
- `memory/ARCHITECTURE.md`
- `memory/API_MAP.md`
- `memory/DATABASE.md`

---

## Session File Rules
**File:** `memory/sessions/YYYY-MM-DD.md`
- Session files are appended daily.
- NEVER overwrite previous session notes from the same day.
- Format strictly as follows:

```markdown
## [Time]

### Completed
- List items

### Problems Found
- List items

### Decisions
- List items

### Files Modified
- List items

### Next Steps
- List items
```

---

## Changelog Rules
**File:** `memory/CHANGELOG.md`
Only log major events.
**Allowed:** Feature launches, bug fixes, architecture changes, deployment changes.
**Not Allowed:** Minor styling, debugging notes, failed experiments.

---

## Current State Rules
**File:** `memory/CURRENT_STATE.md`
Must always represent current reality. Do not invent details.
Required Sections:
- Working Features
- Partial Features
- Broken Features
- Current Priority
- Next Priority
- Last Updated

---

## Quarterly Review System
**Directory:** `memory/reviews/`
Every quarter, create a new review file named `YYYY-QX-review.md`.
**Review Scope:**
- Outdated assumptions
- Stale docs
- Closed bugs
- Old roadmap items
- Technical debt status

---

## AI Operating Rules
Whenever a future AI starts a new project session, it MUST read the following files in this exact order before making any recommendations:
1. `MEMORY.md`
2. `CURRENT_STATE.md`
3. `PRODUCT_CONTEXT.md`
4. `PRODUCT_PRINCIPLES.md`
5. `FEATURES.md`
