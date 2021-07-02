FROM node:14.17.0-alpine
WORKDIR /var/nodejs
COPY package*.json ./
COPY ./dist .
COPY ./kucoin-node-sdk ./kucoin-node-sdk
RUN npm install
EXPOSE 7575
CMD npm start