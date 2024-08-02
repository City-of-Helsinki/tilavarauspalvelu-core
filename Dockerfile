FROM public.ecr.aws/docker/library/node:20-bullseye-slim AS base

# Generates a trimmed down version of the package list for installer
# doesn't invalidate layer cache if the result from turbo prune stays the same.
FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
ARG APP
RUN echo "APP: $APP"
RUN turbo prune --scope=$APP --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
ARG APP
# Required because the client (js bundle) variables are compile time only
ARG NEXT_PUBLIC_TILAVARAUS_API_URL
ENV NEXT_PUBLIC_TILAVARAUS_API_URL=$NEXT_PUBLIC_TILAVARAUS_API_URL
# Build should not fail on missing env variables
# TODO this should be removed because we need NEXT_PUBLIC_TILAVARAUS_API_URL to be set during build
# unless we let it be undefined and use "" as default value (does it work?)
# because it's on the frontend it needs to be present during build
ENV SKIP_ENV_VALIDATION=true
COPY turbo.json turbo.json
RUN corepack enable
RUN pnpm turbo run build --filter=$APP...

FROM base AS runner
ARG APP
COPY --from=installer /usr/bin/dumb-init /usr/bin/dumb-init
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/$APP/next.config.mjs .
COPY --from=installer /app/apps/$APP/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/static ./apps/$APP/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/public ./apps/$APP/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/next-i18next.config.js ./apps/$APP/

ENV BIN "apps/$APP/server.js"
CMD ["sh", "-c", "dumb-init node $BIN"]
