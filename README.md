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
- **Persistence (planned):** Postgres via Drizzle ORM. Hosted: Neon (Vercel Marketplace). Self-host: bring your own Postgres.
- **Auth (planned):** Auth.js (NextAuth v5) with email + passkeys.
- **Crypto (v1 design constraint):** Argon2id key derivation + AES-256-GCM. Server never sees plaintext entries.

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

# 3. Run the dev server
pnpm dev
```

Open <http://localhost:3000>.

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

CI runs all of `lint → typecheck → test → build` on every push and PR.

## Self-hosting

Mainichi is built so a single user can run it on their own server. The full Docker Compose flow ships in MS-7. Until then, this section is a placeholder.

What you'll need (preview):

- A Linux host with Docker + Docker Compose
- A Postgres database (managed or self-managed)
- An SMTP relay or Resend API key for transactional email
- A domain with TLS (we'll document Caddy + Let's Encrypt)

No paid-service credentials are baked into the self-host image; everything is configured via environment variables at install time.

## Deployment (hosted)

Production runs on Vercel; preview deploys go up automatically per-PR. Domain and Vercel project linking are tracked in MS-1 follow-ups.

## License

[AGPL-3.0-or-later](./LICENSE). If you self-host this app and modify it, the AGPL requires you to make your modifications available to your users.
