FROM node:12-alpine AS build
WORKDIR /app
COPY . .

ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production

RUN yarn install && yarn cache clean --force
RUN yarn global add nodemon@2.0.4

RUN yarn build:prod

EXPOSE 3000

CMD [ "yarn", "start-server:prod"]
