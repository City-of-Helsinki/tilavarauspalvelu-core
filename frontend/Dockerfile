FROM public.ecr.aws/docker/library/node:24-slim AS base

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
# Client-side Sentry settings are compiled into the Next.js bundle.
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ARG NEXT_PUBLIC_SENTRY_TRACE_PROPAGATION_TARGETS
ARG NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE
ARG NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
ARG NEXT_PUBLIC_SENTRY_PROJECT
# Allow failure because we rather have builds without sourcemaps than no builds
ENV SENTRY_ALLOW_FAILURE=true
ARG SENTRY_URL
ENV SENTRY_URL=$SENTRY_URL
ARG SENTRY_ORG
ENV SENTRY_ORG=$SENTRY_ORG

RUN npm install -g corepack@latest @sentry/cli && corepack enable
WORKDIR /app
# Download packages from the lockfile only.
# This layer stays cached until the lockfile or workspace settings change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

# Build the project
COPY . .
RUN pnpm install --offline --frozen-lockfile --ignore-scripts
RUN pnpm --filter=$APP... run build

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
COPY --from=installer /app/scripts/update-runtime-env.js /app/scripts/update-runtime-env.js
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=installer /app/apps/$APP/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/.next/static ./apps/$APP/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/public ./apps/$APP/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/$APP/next-i18next.config.cjs ./apps/$APP/

# Allow OpenShift/Azure-style arbitrary non-root UIDs (in group 0) to write the runtime config.
RUN chgrp 0 /app/apps/$APP/public && chmod g=u /app/apps/$APP/public

USER nextjs
ENV APP=$APP
ENV BIN="apps/$APP/server.js"
CMD ["sh", "-c", "node scripts/update-runtime-env.js apps/$APP/public && exec dumb-init node $BIN"]
