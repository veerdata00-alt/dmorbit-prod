# API Map

## Authentication
| Method | Path | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/auth/firebase` | Exchange Firebase idToken for custom JWT cookie | No |
| POST | `/api/login` | Email/Password login | No |
| POST | `/api/signup` | Email/Password signup | No |
| POST | `/api/logout` | Clear JWT cookie | Yes |
| GET | `/api/me` | Fetch active user object and hydrate global store | Yes |

## Instagram Integration
| Method | Path | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/auth/instagram` | Initiate Meta OAuth flow | Yes |
| GET | `/api/auth/instagram/callback` | Handle Meta OAuth return and save tokens | Yes |
| GET/POST | `/api/webhooks/instagram` | Meta webhook verification and event reception | No (Signature Verified) |

## Dashboard & Operations
| Method | Path | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Retrieve aggregate metrics for the dashboard | Yes |
| GET | `/api/automations` | List user campaigns | Yes |
| POST | `/api/automations` | Create new campaign | Yes |
| GET | `/api/leads` | List captured leads | Yes |

## Billing
| Method | Path | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/stripe/create-checkout-session` | Initiate Stripe subscription flow | Yes |
