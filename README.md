# IS Motors — Accounting & Admin Portal

Single-codebase Arabic, right-to-left web application for the IS Motors dealership.

## Files
- `index.html` — application shell and login screen
- `styles.css` — responsive light theme and mobile layout
- `app.js` — Supabase authentication, role checks, detailed finance dashboard, monthly/yearly close, reports and UI

## Connected backend
- Supabase project: `xnogogvdxforrpdijuuu`
- Uses the browser-safe Supabase publishable key only (never a service-role key).
- Reads/writes the existing `public.app_records` row with `record_type=settings` and `record_key=main`.
- Uses `public.expense_submissions` for employee supplies requests.
- Requires the existing `public.get_my_is_motors_role()` RPC and existing row-level security policies.

## Roles
- `admin`: full accounting dashboard and access allowed by the database policies.
- `user`: can submit supplies-expense requests only. No accounting data is queried or displayed to this role.

## Deploy
This is a static site. Publish the root of the repository on Vercel. No build step or server-side secret is required for the current accounting features.

The Gemini key is intentionally not included in browser source code. A secure server-side proxy and a separately configured secret are required before enabling Gemini API calls.


## Complete project documentation

- [Islam Al-Fayed complete project dossier](./ISLAM-AL-FAYED-IS-MOTORS-COMPLETE-PROJECT.md) — project identifiers, service relationships, data model, setup notes, and full source code snapshot.

## Accounting close

- Monthly close saves a financial snapshot and blocks changes to records in a closed month through the application UI.
- Annual close requires all active months to be closed first.
- Reopening requires a reason and is recorded in the closing audit history.
- Financial rows with invalid/missing dates and pending employee supply requests prevent closing.

