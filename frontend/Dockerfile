FROM public.ecr.aws/docker/library/node:24-slim AS base

# Generates a trimmed down version of the package list for installer
# doesn't invalidate layer cache if the result from turbo prune stays the same.
FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
ARG APP
RUN turbo prune --scope=$APP --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apt-get update && \
  apt-get install -y --no-install-recommends dumb-init ca-certificates && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ARG APP
# Required because the client (js bundle) variables are compile time only
ARG NEXT_PUBLIC_TILAVARAUS_API_URL
ENV NEXT_PUBLIC_TILAVARAUS_API_URL=$NEXT_PUBLIC_TILAVARAUS_API_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ARG FEEDBACK_URL
ENV FEEDBACK_URL=$FEEDBACK_URL
# Version information from build pipeline (pass it to sentry sourcemap upload)
# TODO we can probably remove this and use github to create version tag for us
ARG NEXT_PUBLIC_SOURCE_VERSION
ARG NEXT_PUBLIC_SOURCE_BRANCH_NAME
ENV NEXT_PUBLIC_SOURCE_VERSION=$NEXT_PUBLIC_SOURCE_VERSION
ENV NEXT_PUBLIC_SOURCE_BRANCH_NAME=$NEXT_PUBLIC_SOURCE_BRANCH_NAME
# Pass CI variable to the build
ARG CI
ENV CI=$CI
# Build should not fail on missing env variables
ENV SKIP_ENV_VALIDATION=true
# Sentry args for sourcemap upload
ARG SENTRY_PROJECT
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ARG RELEASE_NAME
ARG SENTRY_ENABLE_SOURCE_MAPS
ENV SENTRY_ENABLE_SOURCE_MAPS=$SENTRY_ENABLE_SOURCE_MAPS
# Allow failure because we rather have builds without sourcemaps than no builds
ENV SENTRY_ALLOW_FAILURE=true
ARG SENTRY_URL
ENV SENTRY_URL=$SENTRY_URL
ARG SENTRY_ORG
ENV SENTRY_ORG=$SENTRY_ORG

RUN npm install -g corepack@latest @sentry/cli && corepack enable
WORKDIR /app
COPY --from=builder /app/scripts/ /app/scripts
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=$APP...

# Only upload sourcemaps so they match the actual build
# other artifacts like source code refs have to be added elsewhere
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
  if [ "$SENTRY_ENABLE_SOURCE_MAPS" = "true" ] ; then \
    sentry-cli sourcemaps inject --ignore "node_modules" /app/apps/$APP/.next/ && \
    sentry-cli sourcemaps upload --ignore "node_modules" --release "$RELEASE_NAME" /app/apps/$APP/.next/ && \
    sentry-cli releases new "$RELEASE_NAME" ; \
  fi
RUN find /app/apps/$APP/.next/ -name "*.map" -print0 | xargs -0 rm

FROM base AS runner
ARG APP
COPY --from=installer /usr/bin/dumb-init /usr/bin/dumb-init
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/$APP/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/static ./apps/$APP/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/public ./apps/$APP/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/next-i18next.config.cjs ./apps/$APP/

ENV BIN="apps/$APP/server.js"
CMD ["sh", "-c", "dumb-init node $BIN"]
