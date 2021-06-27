# Install dependencies only when needed
FROM registry.access.redhat.com/ubi8/nodejs-14 AS deps
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

ENV NPM_CONFIG_LOGLEVEL warn

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
#RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
COPY ui/package.json ./ui/package.json
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM registry.access.redhat.com/ubi8/nodejs-14 AS builder
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

ENV NPM_CONFIG_LOGLEVEL warn

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION
WORKDIR /app/ui
COPY ui .

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/yarn.lock /app/yarn.lock
COPY --from=deps /app/package.json /app/package.json
COPY --from=deps /app/ui/package.json /app/ui/package.json
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

# Production image, copy all the files and run next
FROM registry.access.redhat.com/ubi8/nodejs-14  AS runner
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

ENV NPM_CONFIG_LOGLEVEL warn

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION
WORKDIR /app/ui

ENV NODE_ENV production
COPY --from=builder /app/ui/next.config.js ./
COPY --from=builder /app/ui/next-i18next.config.js ./
COPY --from=builder /app/ui/public ./public
COPY --from=builder --chown=default:root /app//ui/.next ./.next
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/ui/package.json /app/ui/package.json
COPY --from=builder /app/package.json /app/package.json

USER default

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED 1
CMD ["yarn", "start"]
