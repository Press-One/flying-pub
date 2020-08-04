FROM node:11

ADD . /app
RUN rm -rf /app/server/build
RUN mv /app/client/build /app/server/build

WORKDIR /app/server
RUN npm install
RUN npm install wait-on -g

WORKDIR /app

EXPOSE 9000