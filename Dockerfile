FROM helsinkitest/node:14-slim as staticbuilder

# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL warn

ENV NODE_ENV=production

# Yarn
ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION

USER root
RUN apt-install.sh build-essential

# Use non-root user
USER appuser

# Install dependencies
COPY --chown=appuser:appuser package.json yarn.lock /app/
RUN yarn && yarn cache clean --force

# Copy all files
COPY --chown=appuser:appuser . .

# Build application
RUN yarn build

FROM nginx:1.19.5

# Copy static build
COPY --from=staticbuilder --chown=nginx:nginx /app/build /usr/share/nginx/html

# Copy nginx config
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

USER nginx

EXPOSE 8000
