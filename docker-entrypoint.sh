#!/bin/sh
set -eu

# Ensure writable dirs exist for runtime file uploads.
mkdir -p /app/uploads/templates
mkdir -p /app/public/uploads/signatures

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  if [ -n "${RESOLVE_FAILED_MIGRATION_ROLLED_BACK:-}" ]; then
    echo "[entrypoint] Marking failed migration as rolled back: ${RESOLVE_FAILED_MIGRATION_ROLLED_BACK}"
    if ! /app/node_modules/.bin/prisma migrate resolve --rolled-back "${RESOLVE_FAILED_MIGRATION_ROLLED_BACK}"; then
      echo "[entrypoint] migrate resolve failed or migration is no longer in a failed state, continuing to migrate deploy"
    fi
  fi

  echo "[entrypoint] Running prisma migrate deploy"
  if ! /app/node_modules/.bin/prisma migrate deploy; then
    echo "[entrypoint] prisma migrate deploy failed, but continuing to start the app to avoid a restart loop"
    echo "[entrypoint] Fix the failed migration in the database, then redeploy or set RUN_MIGRATIONS=0 if needed"
  fi
fi

# Optional: run seed during startup. Set RUN_SEED=1 in env to enable.
if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "[entrypoint] Running prisma db seed"
  SEED_RETRIES=${SEED_RETRIES:-5}
  SEED_RETRY_DELAY=${SEED_RETRY_DELAY:-5}
  attempt=0
  until /app/node_modules/.bin/tsx prisma/seed.ts; do
    attempt=$((attempt + 1))
    echo "[entrypoint] prisma db seed attempt ${attempt} failed"
    if [ "$attempt" -ge "$SEED_RETRIES" ]; then
      echo "[entrypoint] prisma db seed failed after ${attempt} attempts, continuing startup"
      break
    fi
    echo "[entrypoint] retrying seed in ${SEED_RETRY_DELAY}s..."
    sleep ${SEED_RETRY_DELAY}
  done
fi

echo "[entrypoint] Starting Next.js"
exec /app/node_modules/.bin/next start -p "${PORT:-3000}"
