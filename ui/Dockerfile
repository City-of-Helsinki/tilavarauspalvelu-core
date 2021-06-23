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
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM registry.access.redhat.com/ubi8/nodejs-14 AS builder
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

ENV NPM_CONFIG_LOGLEVEL warn

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION
WORKDIR /app
COPY . .

COPY --from=deps /app/node_modules ./node_modules
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

# Production image, copy all the files and run next
FROM registry.access.redhat.com/ubi8/nodejs-14  AS runner
USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

ENV NPM_CONFIG_LOGLEVEL warn

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION
WORKDIR /app

ENV NODE_ENV production
run ls /app/
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/next-i18next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=default:root /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER default

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED 1
CMD ["yarn", "start"]


