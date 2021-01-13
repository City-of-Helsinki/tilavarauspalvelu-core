FROM node:12-alpine AS build
WORKDIR /app
COPY . .

RUN npm install -g nodemon@2.0.4

ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production

RUN yarn install && yarn cache clean --force

RUN yarn build:prod

EXPOSE 3000

CMD [ "yarn", "start-server:prod"]
