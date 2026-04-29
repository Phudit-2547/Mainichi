// Ensure AUTH_SECRET is present for tests that import modules calling env().
// CI sets a real one; locally we provide a dummy so unit tests don't require
// a `.env.local`. DATABASE_URL is left to the environment so DB-backed tests
// can use describe.skipIf when it's missing.
process.env.AUTH_SECRET ??= "test-only-auth-secret-32-bytes-min-aaaa";
if (!process.env.NODE_ENV) {
  // `NODE_ENV` is typed as a read-only literal union by @types/node, so we
  // round-trip through an index assignment to set a default for tests.
  (process.env as Record<string, string>).NODE_ENV = "test";
}
