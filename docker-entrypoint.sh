#!/bin/sh
set -e

echo "Mainichi — applying database migrations..."
node --experimental-strip-types scripts/migrate.ts

echo "Mainichi — starting server on port ${PORT:-3000}..."
exec node server.js
