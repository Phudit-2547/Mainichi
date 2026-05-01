# Mainichi

A self-hostable journal app. End-to-end encrypted by design — server stores ciphertext, the user controls the key. Hosted flavor runs on Vercel; self-hosted flavor runs on Docker Compose on any Linux host.

> Repo: [`Phudit-2547/Mainichi`](https://github.com/Phudit-2547/Mainichi) · Hosted preview: <https://mainichi-theta.vercel.app>

This is the skeleton repo. App code is being filled in over MS-1..MS-7 of the roadmap (see the project tracker).

## Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Package manager:** pnpm 10 (Node.js 22 LTS)
- **Tests:** Vitest
- **Lint:** ESLint via `eslint-config-next`
- **Persistence:** Postgres via [Drizzle ORM](https://orm.drizzle.team). Hosted: Neon (Vercel Marketplace). Self-host: bring your own Postgres.
- **Auth:** in-repo email + password with Argon2id hashing, [`jose`](https://github.com/panva/jose)-signed session JWT, DB-backed session table.
- **Crypto (v1 design constraint):** Argon2id key derivation + AES-256-GCM. Server never sees plaintext entries. Per-user `kdf_salt` is seeded at sign-up so MS-5 can derive the E2E master key with no backfill migration.

See the MS-0 tech spec for the full rationale and threat model.

## Quickstart (local dev)

Goal: a new contributor goes from clone to running app in under 10 minutes on macOS or Linux.

```bash
# 1. Install Node 22 + pnpm 10 (one-time)
nvm install                   # uses .nvmrc
corepack enable && corepack prepare pnpm@10 --activate

# 2. Clone and install
git clone git@github.com:Phudit-2547/Mainichi.git
cd Mainichi
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Fill in AUTH_SECRET (run: openssl rand -hex 32)

# 4. Start Postgres (uses docker-compose.dev.yml)
docker compose -f docker-compose.dev.yml up -d

# 5. Apply migrations
pnpm db:migrate

# 6. Run the dev server
pnpm dev
```

Open <http://localhost:3000>. Create an account at `/sign-up`, then you'll land on the protected entries list at `/app/entries` — create, view, edit, and delete journal entries from there.

### Day-to-day commands

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Run the Next.js dev server            |
| `pnpm build`      | Production build                      |
| `pnpm start`      | Run a production build locally        |
| `pnpm lint`       | ESLint on the workspace               |
| `pnpm typecheck`  | `tsc --noEmit`                        |
| `pnpm test`       | Run Vitest suite once                 |
| `pnpm test:watch` | Run Vitest in watch mode              |
| `pnpm db:generate`| Generate a new Drizzle migration      |
| `pnpm db:migrate` | Apply pending migrations              |
| `pnpm db:studio`  | Open Drizzle Studio in the browser    |

CI runs `lint → typecheck → db:migrate → test → build` on every push and PR.

## Entries (MS-3)

- A signed-in user can create, list, view, edit, and delete journal entries from `/app/entries`.
- Each entry has a title, a markdown body, and `createdAt`/`updatedAt` timestamps.
- Every read and mutation in `src/lib/entries/dal.ts` is scoped by `userId`; cross-user reads return `null` and cross-user updates/deletes are no-ops. DAL integration tests cover this scoping plus FK cascade on user delete.
- The schema is **ciphertext-ready**: `title` and `body` are opaque text columns with no full-text indexes or content constraints, so MS-5 can swap plaintext for ciphertext (and add `iv`/`algo` columns) without a backfill.

## Auth model (MS-2)

- Email + password. Argon2id (via `hash-wasm`, OWASP 2023 params) for password hashes.
- Database-backed sessions: a row in `sessions` is created on sign-in; the cookie carries an HMAC-signed (`HS256`) JWT containing the session id. Revocation = delete the row.
- The `mainichi_session` cookie is `httpOnly`, `sameSite=lax`, and `secure` in production. 30-day sliding TTL.
- `src/proxy.ts` performs an optimistic check on `/app/*` (verifies the JWT signature only, no DB hit) so prefetched navigations don't flash the page.
- `src/app/app/layout.tsx` is the authoritative chokepoint: it calls `verifySession()` from the data-access layer (`src/lib/auth/dal.ts`), which redirects to `/sign-in` if the DB has no matching live session.
- Server Actions in `src/lib/auth/actions.ts` handle sign-up, sign-in, and sign-out.

### Threat model notes

Until a SecurityEngineer is hired, these assumptions are documented inline:

- No rate limiting on credential endpoints in v1. Acceptable for single-tenant self-host. Re-evaluate before public hosted launch.
- No password-reset flow yet. Ships with the E2E key-rewrap design in MS-5.
- No MFA, no OAuth, no magic link in v1. Adds in later milestones.
- Sign-in path runs `verifyPassword` against a fixed dummy hash on missing-user lookups to defeat user-enumeration via timing.

## Mobile support (MS-6)

The UI is designed mobile-first and tested on narrow viewports (iPhone SE through iPhone 16 Pro Max, Pixel 7).

- **Touch targets:** all buttons and interactive rows are `min-h-11` (44 px), meeting WCAG 2.5.5.
- **No iOS auto-zoom:** inputs render at `text-base` (16 px) on narrow viewports so Safari doesn't zoom on focus.
- **Safe-area insets:** bottom padding accounts for the Home Indicator on notched iPhones and the gesture bar on Android.
- **Viewport:** `viewport-fit=cover` extends into notch/Dynamic Island areas; `min-h-dvh` tracks the dynamic viewport height (collapses with the address bar).
- **Sticky header:** backdrop-blur glassmorphism header stays visible while scrolling.
- **Stacked layout:** entry list items and action buttons stack vertically on mobile and switch to horizontal at `sm:` (640 px).
- **No horizontal overflow:** `overflow-x: hidden` on the html element prevents stray side-scroll.

## Self-hosting in 5 minutes

Mainichi is built so a single user can run it on their own server. No paid services required.

```bash
git clone https://github.com/Phudit-2547/Mainichi.git
cd Mainichi
echo "AUTH_SECRET=$(openssl rand -hex 32)" > .env
docker compose up -d
```

Open <http://localhost:3000>. Sign up, write an entry. Done.

The bundled `docker-compose.yml` runs the app and Postgres together. Migrations apply automatically on startup. For production use, put a reverse proxy (Caddy, nginx) in front for TLS.

See [`docs/selfhost.md`](./docs/selfhost.md) for external database setup, updates, backups, and detailed configuration.

## Deployment (hosted)

Production runs on Vercel; preview deploys go up automatically per-PR. Set `AUTH_SECRET` and `DATABASE_URL` (Neon) in the Vercel project's environment variables.

## License

[AGPL-3.0-or-later](./LICENSE). If you self-host this app and modify it, the AGPL requires you to make your modifications available to your users.
