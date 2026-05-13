#!/bin/sh
set -eu

# Ensure writable dirs exist for runtime file uploads.
mkdir -p /app/uploads/templates
mkdir -p /app/public/uploads/signatures

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] Running prisma migrate deploy"
  if ! /app/node_modules/.bin/prisma migrate deploy; then
    echo "[entrypoint] prisma migrate deploy failed, but continuing to start the app to avoid a restart loop"
    echo "[entrypoint] Fix the failed migration in the database, then redeploy or set RUN_MIGRATIONS=0 if needed"
  fi
fi

echo "[entrypoint] Starting Next.js"
exec /app/node_modules/.bin/next start -p "${PORT:-3000}"
