FROM registry.access.redhat.com/ubi8/nodejs-14 as staticbuilder

USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn
USER default

# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production

# Yarn
ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION

# Install dependencies
COPY package.json yarn.lock /opt/app-root/src/
RUN yarn && yarn cache clean --force

# Copy all files
COPY admin-ui .

# Build application
RUN yarn build

FROM registry.access.redhat.com/ubi8/nginx-118

# Copy static build
COPY --from=staticbuilder --chown=nginx:nginx /opt/app-root/src/build /usr/share/nginx/html

# Copy nginx config
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

CMD nginx -g "daemon off;"
