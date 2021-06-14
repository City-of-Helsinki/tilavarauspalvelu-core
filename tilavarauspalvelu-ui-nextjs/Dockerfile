FROM registry.access.redhat.com/ubi8/nodejs-14 AS build

USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

ENV NPM_CONFIG_LOGLEVEL warn

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION

WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn

RUN chgrp -R 0 /opt/app-root/src/

COPY . .

RUN yarn build

USER default
EXPOSE 3000

CMD [ "yarn", "start"]
