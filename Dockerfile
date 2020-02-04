FROM node:10

ADD . /app
RUN rm -rf /app/be/build
RUN mv /app/fe/build /app/be/build

WORKDIR /app/be
RUN npm config set registry https://registry.npm.taobao.org
RUN npm install

WORKDIR /app

EXPOSE 9000

CMD chmod 777 *.sh && ./start-prod.sh