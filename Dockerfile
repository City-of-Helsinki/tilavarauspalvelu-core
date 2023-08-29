FROM node:18-bullseye-slim AS base

# This doesn invalidate layer cache if the result from turbo prune stays the same
# this step generates a trimmed down version of the package list for installer
FROM base AS builder
ARG APP
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=$APP --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
ARG APP
COPY turbo.json turbo.json
ENV SKIP_ENV_VALIDATION=true
RUN pnpm turbo run build --filter=$APP...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
USER nextjs

ARG APP
COPY --from=installer /app/apps/$APP/next.config.mjs .
COPY --from=installer /app/apps/$APP/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/static ./apps/$APP/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/public ./apps/$APP/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/next-i18next.config.js ./apps/$APP/

ENV BIN "apps/$APP/server.js"
CMD ["sh", "-c", "node $BIN"]
