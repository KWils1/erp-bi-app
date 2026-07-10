# ERP BI Reporting Tool — Full Stack (Node/Express + PostgreSQL + React)

A real, runnable rebuild of the ERP Business Intelligence dashboard: JWT-based
authentication against a real `users` table, a PostgreSQL schema backing every
module (Sales, Inventory, Procurement, Finance, Reports, Users, Settings), and
a React frontend that talks to the API instead of reading from in-memory
mock arrays.

This replaces the original prototype's mock login, browser-only CSV/PDF
export, and hardcoded JSON data with a working backend you run locally.

---

## 1. Prerequisites

You said you already have these installed — confirming versions:

```bash
node --version     # v18+ recommended
psql --version     # PostgreSQL 14+ recommended
```

## 2. Create the database

```bash
# Using the psql shell (adjust user/password to your local Postgres setup)
createdb erp_bi
```

If `createdb` isn't on your PATH, you can instead run `psql -U postgres` and
then `CREATE DATABASE erp_bi;` inside the prompt.

## 3. Backend setup

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in your real Postgres credentials (`PGUSER`,
`PGPASSWORD`, `PGDATABASE`, etc.) and set a strong `JWT_SECRET`. You can
generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then:

```bash
npm install
npm run setup      # runs migrations, then seeds demo data
npm run dev        # starts the API on http://localhost:4000
```

`npm run setup` runs two scripts:
- `db/migrate.js` — creates all tables from `db/schema.sql` (safe to re-run; uses `IF NOT EXISTS`)
- `db/seed.js` — wipes and repopulates demo data (sales, inventory, procurement, finance, transactions, and 4 demo user accounts)

The seed script prints the demo account credentials to the console when it
finishes. They are also listed below.

## 4. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev         # starts the React app on http://localhost:5173
```

Vite is configured to proxy `/api/*` requests to `http://localhost:4000`, so
you don't need to configure CORS URLs for local development — just make sure
both servers are running.

Open **http://localhost:5173** and sign in.

## 5. Demo accounts (seeded into the real database)

| Role | Email | Password |
|---|---|---|
| System Admin | admin@lautech-erp.edu.ng | Admin@123 |
| Manager | manager@lautech-erp.edu.ng | Manager@123 |
| Analyst | analyst@lautech-erp.edu.ng | Analyst@123 |
| Viewer | bisi.yusuf@lautech-erp.edu.ng | Viewer@123 |

Passwords are hashed with bcrypt in the `users` table — nothing is stored in
plaintext. **Change these before exposing the app beyond your own machine.**

---

## What's real vs. what to harden further

This is a genuine full-stack app — not a static mockup — but a few things
are worth knowing before you rely on it for anything beyond local/internal use:

- **Auth**: JWT tokens (8h expiry by default), bcrypt password hashing,
  rate-limited login endpoint. Tokens are stored in `localStorage` on the
  client, which is the standard approach for an internally-run tool but is
  vulnerable to XSS if you ever add third-party scripts to the frontend —
  for a public-facing deployment, consider httpOnly cookies instead.
- **RBAC**: enforced server-side via middleware (`requireRole`), not just
  hidden in the UI — e.g. only System Admins can create/deactivate/delete
  users or modify system settings, checked on every request.
- **Exports**: CSV and Excel exports are generated server-side from the full
  filtered dataset (not just the 30 rows shown on screen), and each export
  is written to an `audit_log` table.
- **Data import**: real file upload (multer) parses CSV/XLSX and inserts
  rows into the `transactions` table, with per-row validation and an import
  history log.
- **Not included**: email delivery for scheduled reports/digests (the
  toggles save to the database but nothing sends yet), password reset via
  email, and HTTPS/TLS termination (put this behind a reverse proxy like
  nginx or Caddy if you deploy it beyond localhost).

## Project structure

```
erp-bi-app/
├── server/               Express API
│   ├── db/
│   │   ├── schema.sql    Table definitions
│   │   ├── migrate.js    Runs schema.sql
│   │   ├── seed.js       Populates demo data
│   │   └── pool.js       PostgreSQL connection pool
│   ├── middleware/auth.js  JWT verification + role checks
│   ├── routes/           One file per module (auth, sales, inventory, …)
│   ├── utils/jwt.js
│   └── index.js          App entry point
└── client/               React (Vite) frontend
    └── src/
        ├── api/client.js       axios instance with auth header injection
        ├── context/AuthContext.jsx
        ├── components/         Shared UI + app shell + route guard
        └── pages/               One page per module
```

## Troubleshooting

- **"password authentication failed for user"** — double-check `PGUSER`/`PGPASSWORD` in `server/.env` match your local Postgres setup.
- **"relation does not exist"** — run `npm run migrate` again from `server/`.
- **Frontend shows a blank dashboard / network errors** — make sure the API is running on port 4000 *before* starting the Vite dev server, and check the terminal running `npm run dev` in `server/` for errors.
- **Login always fails** — confirm you ran `npm run seed` (not just `migrate`) so the demo users actually exist.
