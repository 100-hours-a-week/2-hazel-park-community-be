FROM node:18 AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

FROM dependencies AS build

WORKDIR /usr/src/app

COPY . .


FROM node:18 AS production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app

CMD ["node", "views/blue.js"]

EXPOSE 3000
