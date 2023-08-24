# Install dependencies only when needed
FROM registry.access.redhat.com/ubi8/nodejs-16 AS deps
USER root
RUN npm install --global pnpm

ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/common/package.json packages/common/package.json common/
COPY apps/admin-ui/package.json apps/admin-ui/package.json admin-ui/
RUN pnpm install --frozen-lockfile

FROM registry.access.redhat.com/ubi8/nodejs-16 as builder
USER root
RUN npm install --global pnpm

# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL warn

# Copy all files
WORKDIR /app/common
COPY packages/common .
WORKDIR /app/admin-ui
COPY apps/admin-ui .

#WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=deps /app/package.json /app/package.json
COPY --from=deps /app/common/node_modules /app/common/node_modules
COPY --from=deps /app/common/package.json /app/common/package.json
COPY --from=deps /app/admin-ui/node_modules /app/admin-ui/node_modules
COPY --from=deps /app/admin-ui/package.json /app/admin-ui/package.json
RUN pnpm build

FROM registry.access.redhat.com/ubi8/nodejs-16 AS runner
USER root
RUN wget -qO- https://get.pnpm.io/install.sh | sh -
USER default

ENV NPM_CONFIG_LOGLEVEL warn
WORKDIR /app/admin-ui
ENV NODE_ENV production

COPY --from=builder --chown=default:root /app/admin-ui/src/env.mjs ./src/
COPY --from=builder --chown=default:root /app/admin-ui/next.config.mjs ./
COPY --from=builder --chown=default:root /app/admin-ui/public ./public
COPY --from=builder --chown=default:root /app/admin-ui/.next ./.next
COPY --from=builder --chown=default:root /app/admin-ui/node_modules /app/admin-ui/node_modules
COPY --from=builder --chown=default:root /app/admin-ui/package.json ./package.json
COPY --from=builder --chown=default:root /app/node_modules /app/node_modules
COPY --from=builder --chown=default:root /app/common/node_modules /app/common/node_modules
COPY --from=builder --chown=default:root /app/common/package.json /app/common/package.json
COPY --from=builder --chown=default:root /app/package.json /app/package.json

RUN install -d -o default -g root /app/ui/.next/cache/images && chmod g+w -R /app/admin-ui/.next
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["pnpm", "start"]
