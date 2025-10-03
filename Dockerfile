FROM public.ecr.aws/docker/library/node:22-slim AS base

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
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init ca-certificates

RUN npm install -g corepack@latest
RUN corepack enable
WORKDIR /app
COPY --from=builder /app/scripts/ /app/scripts
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
ARG APP
# Required because the client (js bundle) variables are compile time only
ARG NEXT_PUBLIC_TILAVARAUS_API_URL
ENV NEXT_PUBLIC_TILAVARAUS_API_URL=$NEXT_PUBLIC_TILAVARAUS_API_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ARG EMAIL_VARAAMO_EXT_LINK
ENV EMAIL_VARAAMO_EXT_LINK=$EMAIL_VARAAMO_EXT_LINK
# Version information from build pipeline (pass it to sentry sourcemap upload)
ARG NEXT_PUBLIC_SOURCE_VERSION
ARG NEXT_PUBLIC_SOURCE_BRANCH_NAME
ENV NEXT_PUBLIC_SOURCE_VERSION=$NEXT_PUBLIC_SOURCE_VERSION
ENV NEXT_PUBLIC_SOURCE_BRANCH_NAME=$NEXT_PUBLIC_SOURCE_BRANCH_NAME
# Pass CI variable to the build
ARG CI
ENV CI=$CI

# Build should not fail on missing env variables
# TODO this should be removed because we need NEXT_PUBLIC_TILAVARAUS_API_URL to be set during build
# unless we let it be undefined and use "" as default value (does it work?)
# because it's on the frontend it needs to be present during build
ENV SKIP_ENV_VALIDATION=true
ENV SENTRY_ENABLE_SOURCE_MAPS=true
ENV SENTRY_URL="https://sentry.hel.fi"
ENV SENTRY_ORG="city-of-helsinki"
# TODO configure based on APP
ENV SENTRY_PROJECT="tilavarauspalvelu-ui"
ENV SENTRY_LOG_LEVEL="debug"
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
COPY turbo.json turbo.json
RUN npm install -g corepack@latest
RUN npm install -g @sentry/cli
RUN corepack enable
RUN pnpm turbo run build --filter=$APP...
RUN ls -l /app/apps/$APP/.next/
RUN sentry-cli sourcemaps inject /app/apps/$APP/.next/ --ignore "node_modules"
# Allow fails (TODO should report errors)
RUN --mount=type=bind,target=. \
  --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
  sentry-cli sourcemaps upload /app/apps/$APP/.next/ --ignore "node_modules" #; exit 0
# TODO remove .map files after upload
# TODO make a release (but this would not be necessary if it's not a release tag)

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
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/next-i18next.config.cjs ./apps/$APP/

ENV BIN="apps/$APP/server.js"
CMD ["sh", "-c", "dumb-init node $BIN"]
