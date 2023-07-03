# Install dependencies only when needed
FROM registry.access.redhat.com/ubi8/nodejs-16 AS deps
USER root
RUN npm install --global yarn
RUN yarn set version 1.22.10

ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /app
COPY package.json yarn.lock ./
COPY common/package.json common/package.json common/
COPY admin-ui/package.json admin-ui/package.json admin-ui/
RUN yarn install --frozen-lockfile

FROM registry.access.redhat.com/ubi8/nodejs-16 as builder
USER root
RUN npm install --global yarn
RUN yarn set version 1.22.10

# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL warn

# Copy all files
WORKDIR /app/common
COPY common .
WORKDIR /app/admin-ui
COPY admin-ui .

#WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/yarn.lock /app/yarn.lock
COPY --from=deps /app/package.json /app/package.json
COPY --from=deps /app/common/package.json /app/common/package.json
COPY --from=deps /app/admin-ui/package.json /app/admin-ui/package.json
RUN yarn build

FROM registry.access.redhat.com/ubi8/nodejs-16 AS runner
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn
USER default
RUN yarn policies set-version 1.22.10

ENV NPM_CONFIG_LOGLEVEL warn
WORKDIR /app/admin-ui
ENV NODE_ENV production

#COPY --from=builder /app/ui/next-i18next.config.js ./
#COPY --from=builder /app/ui/cypress.config.ts ./
COPY --from=builder --chown=default:root /app/admin-ui/next.config.js ./
COPY --from=builder --chown=default:root /app/admin-ui/public ./public
COPY --from=builder --chown=default:root /app/admin-ui/.next ./.next
COPY --from=builder --chown=default:root /app/admin-ui/package.json ./package.json
COPY --from=builder --chown=default:root /app/node_modules /app/node_modules
COPY --from=builder --chown=default:root /app/common/package.json /app/common/package.json
COPY --from=builder --chown=default:root /app/package.json /app/package.json

RUN install -d -o default -g root /app/ui/.next/cache/images && chmod g+w -R /app/admin-ui/.next
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["yarn", "start"]
