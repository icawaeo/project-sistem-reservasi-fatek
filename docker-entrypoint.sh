#!/bin/sh
set -eu

# Ensure writable dirs exist for runtime file uploads.
mkdir -p /app/uploads/templates
mkdir -p /app/public/uploads/signatures

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] Running prisma migrate deploy"
  /app/node_modules/.bin/prisma migrate deploy
fi

echo "[entrypoint] Starting Next.js"
exec /app/node_modules/.bin/next start -p "${PORT:-3000}"
