# Sofia Travel Management System

Travel-agency operations platform: customers, reservations, vouchers, tours,
hotels, flights, visas, transfers, finance, employees and reporting.

Copyright © 2026 Mohamed Adel Abdullah. All rights reserved.

## Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4
- Express API (shared by local Node hosting and Vercel serverless functions)
- Cloud Firestore database
- Gemini AI assistant (optional)

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Optional environment variables are documented in `env.example`. When they are
not provided, the app uses `firebase-applet-config.json`.

## Type check & production build

```bash
npm run typecheck  # tsc --noEmit
npm run build      # dist/ static site + dist/server.cjs
npm start          # serve the production build on :3000
```

## Deploy to Vercel

1. Import this repository into Vercel.
2. Framework preset: **Vite** (already pinned in `vercel.json`).
3. Build command `npm run build`, output directory `dist`.
4. Add the environment variables from `env.example` if you want to point the
   deployment at a different Firebase project. Without them, the committed
   Firebase project is used.
5. Deploy. Static assets are served from `dist/`; every `/api/*` request is
   routed to the Express app through the `api/index.ts` serverless function.

The API keeps the same in-memory + Firestore write-through model as the local
server, and Firestore is the durable database in all environments.

## Accounts

- The protected developer account (`IT`) always has full Administrator
  privileges. It is restored automatically on server start and cannot be
  edited, demoted, deactivated or deleted from the employee management UI or
  the `/api/employees` endpoints.
- Additional staff and administrator accounts are managed from
  **Employees → Add Employee**.

## Database rules

The app performs direct Firestore reads/writes from the browser. The rules in
`firestore.rules` therefore allow access to the application collections. Review
them before exposing the deployment publicly if you need per-user database
security.
