# Self-hosting Mainichi

Run Mainichi on your own server with Docker Compose. One command, five minutes.

## Prerequisites

- A Linux host (or any machine with Docker)
- Docker Engine 24+ and Docker Compose v2
- A domain with TLS for production use (optional for local testing)

## Quickstart

```bash
git clone https://github.com/Phudit-2547/Mainichi.git
cd Mainichi

# Generate a session-signing secret
echo "AUTH_SECRET=$(openssl rand -hex 32)" > .env

# Start the app and database
docker compose up -d
```

Open <http://localhost:3000>. Sign up, write an entry. That's it.

## Environment variables

| Variable        | Required | Default | Purpose |
| --------------- | -------- | ------- | ------- |
| `AUTH_SECRET`    | **yes**  | —       | HMAC key for signing session cookies. Generate with `openssl rand -hex 32`. Must be at least 32 characters. |
| `DATABASE_URL`   | no       | `postgres://mainichi:mainichi@postgres:5432/mainichi` | Postgres connection string. The bundled Compose file provides a Postgres container with this default. Override to use an external database. |
| `PORT`           | no       | `3000`  | Port the app listens on inside the container. |

No paid-service credentials are required. Everything is configured via environment variables at install time.

## Using an external database

To use a managed Postgres (e.g. Neon, Supabase, RDS) instead of the bundled container:

1. Add `DATABASE_URL` to your `.env` file:
   ```
   DATABASE_URL=postgres://user:password@host:5432/mainichi
   ```

2. Remove or comment out the `postgres` service in `docker-compose.yml`.

3. Run `docker compose up -d app`.

Migrations run automatically on every container start.

## Updating

When a new version is released:

```bash
git pull
docker compose build
docker compose up -d
```

Database migrations are applied automatically on startup. The Drizzle migrator checks the `__drizzle_migrations` table and only applies new migrations. No manual migration steps needed.

## Reverse proxy and TLS

For production, put a reverse proxy in front of Mainichi. Example with Caddy:

```
mainichi.example.com {
    reverse_proxy localhost:3000
}
```

Caddy handles TLS automatically via Let's Encrypt. Alternatively, use nginx or Traefik.

## Data and backups

Journal data lives in the `mainichi_data` Docker volume (Postgres). Back it up with standard Postgres tools:

```bash
docker compose exec postgres pg_dump -U mainichi mainichi > backup.sql
```

Restore:

```bash
docker compose exec -T postgres psql -U mainichi mainichi < backup.sql
```

## Architecture notes

- The app image runs Next.js in standalone mode — a minimal Node.js server with only traced dependencies.
- Migrations are applied by the entrypoint script before the server starts. This is safe for single-instance deployments.
- The container runs as a non-root user (`mainichi`, UID 1001).
- No data leaves the server. Auth is fully in-repo (no external OAuth provider). Once E2E encryption ships (MS-5), the server stores only ciphertext.

## Auth

Auth runs entirely in-repo. There is no external auth provider, no OAuth, no third-party SaaS. You need exactly `AUTH_SECRET` and a Postgres database.

### Forgotten password

There is no built-in password reset in v1. Once E2E encryption ships, the password is the only way to derive the encryption key — a user who forgets their password will lose access to their entries. The reset story (recovery key + key-rewrap) lands with MS-5.
