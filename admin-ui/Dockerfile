FROM registry.access.redhat.com/ubi8/nodejs-14 as staticbuilder

USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn


# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL warn

# Yarn
RUN yarn set version 1.22.10

COPY package.json yarn.lock /opt/app-root/src/

COPY admin-ui/package.json /opt/app-root/src/admin-ui/package.json
COPY common/package.json /opt/app-root/src/common/
COPY ui/package.json /opt/app-root/src/ui/
RUN chown -R default:root /opt/app-root/src
USER default

# Install dependencies
RUN yarn --frozen-lockfile

# Copy all files
WORKDIR /opt/app-root/src/common
COPY common .
WORKDIR /opt/app-root/src/admin-ui
COPY admin-ui .

# Build application
ENV DISABLE_ESLINT_PLUGIN=true
RUN yarn build

FROM registry.access.redhat.com/ubi8/nginx-118

# Copy static build
COPY --from=staticbuilder --chown=nginx:nginx /opt/app-root/src/admin-ui/build /usr/share/nginx/html

# Copy nginx config
COPY ./admin-ui/nginx/nginx.conf /etc/nginx/nginx.conf

CMD nginx -g "daemon off;"
