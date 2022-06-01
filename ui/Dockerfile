# Install dependencies only when needed
FROM registry.access.redhat.com/ubi8/nodejs-16 AS deps
USER root
RUN npm install --global yarn
RUN yarn set version 1.22.10

ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /app
COPY package.json yarn.lock ./
COPY common/package.json common/package.json common/
COPY ui/package.json ui/package.json ui/
RUN yarn install --frozen-lockfile

FROM registry.access.redhat.com/ubi8/nodejs-16  AS builder
RUN npm install --global yarn
RUN yarn set version 1.22.10
USER root

ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /app/common
COPY common .
WORKDIR /app/ui
COPY ui .

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/yarn.lock /app/yarn.lock
COPY --from=deps /app/package.json /app/package.json
COPY --from=deps /app/common/package.json /app/common/package.json
COPY --from=deps /app/ui/package.json /app/ui/package.json
RUN yarn build

# Production image, copy all the files and run next
FROM registry.access.redhat.com/ubi8/nodejs-16  AS runner
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn
USER default
RUN yarn policies set-version 1.22.10

ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /app/ui

ENV NODE_ENV production
COPY --from=builder /app/ui/next.config.js ./
COPY --from=builder /app/ui/next-i18next.config.js ./
COPY --from=builder /app/ui/public ./public
COPY --from=builder --chown=default:root /app/ui/.next ./.next
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/ui/package.json /app/ui/package.json
COPY --from=builder /app/common/package.json /app/common/package.json
COPY --from=builder /app/package.json /app/package.json

# Add images directory and fix group permissions
RUN install -d -o default -g root /app/ui/.next/cache/images && chmod g+w -R /app/ui/.next

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED 1
CMD ["yarn", "start"]
