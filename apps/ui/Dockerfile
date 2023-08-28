FROM node:18-bullseye AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=ui --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
ENV SKIP_ENV_VALIDATION=true
RUN pnpm turbo run build --filter=ui...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/ui/next.config.js .
COPY --from=installer /app/apps/ui/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/ui/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/ui/.next/static ./apps/ui/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/ui/public ./apps/ui/public

CMD node apps/ui/server.js
