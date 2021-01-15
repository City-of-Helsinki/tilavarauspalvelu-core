FROM registry.access.redhat.com/ubi8/nodejs-14 AS build

USER root
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum -y install yarn

WORKDIR /app
COPY . .

ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production

ENV YARN_VERSION 1.22.5
RUN yarn policies set-version $YARN_VERSION

RUN yarn install && yarn cache clean --force
RUN yarn global add nodemon@2.0.4

RUN yarn build:prod

USER default
EXPOSE 3000
CMD [ "yarn", "start-server:prod"]
