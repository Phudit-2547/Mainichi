# Self-host (preview)

This document is a placeholder. The full Docker Compose packaging story lands in MS-7.

## Auth (MS-2)

Auth runs **entirely in-repo**. There is no external auth provider, no OAuth, no third-party SaaS to register with. To stand up Mainichi on your own host you need exactly two environment variables:

| Variable        | Purpose                                                    | Example                                                |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`  | Postgres connection string. Any reachable Postgres works.  | `postgres://mainichi:<pw>@db.example.com:5432/mainichi` |
| `AUTH_SECRET`   | HMAC key for signing session cookies. ≥32 chars.            | output of `openssl rand -hex 32`                       |

That's it. No paid-service credentials are baked into the image; nothing is required at install time except the two env vars above and a Postgres you control.

### Migrating an existing install

The Drizzle migrations under `./drizzle/` are idempotent and check the `__drizzle_migrations` table for what has already been applied. Running `pnpm db:migrate` on startup is safe.

### Forgotten password

There is no built-in password reset in v1. A user who forgets their password will lose access to their journal entries once MS-5 ships end-to-end encryption — the password is the only way to derive the encryption key. Document this clearly to your users.

The reset story (recovery key + key-rewrap) lands with MS-5.
