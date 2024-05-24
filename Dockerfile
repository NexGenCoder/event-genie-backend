FROM node:18

WORKDIR /src
COPY package.json .
RUN yarn install
COPY . .
EXPOSE 3001
CMD yarn start