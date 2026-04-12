# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma engines require OpenSSL at runtime/build time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (including devDeps; we keep them so Prisma CLI is available for migrate deploy).
FROM base AS deps
ARG PRISMA_GENERATE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=$PRISMA_GENERATE_DATABASE_URL

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

# Build the Next.js app
FROM base AS builder
ARG PRISMA_GENERATE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=$PRISMA_GENERATE_DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Runtime image
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# Needed for DOCX -> PDF preview (soffice)
RUN apt-get update \
  && apt-get install -y --no-install-recommends libreoffice \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/.next ./.next

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
