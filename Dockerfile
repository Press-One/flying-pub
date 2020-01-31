FROM node:10.15.2

ADD . /app
RUN rm -rf /app/be/build
RUN mv /app/fe/build /app/be/build

WORKDIR /app/be
RUN npm config set registry https://registry.npm.taobao.org
RUN npm install -g -s --no-progress yarn
RUN yarn install

WORKDIR /app

EXPOSE 5000 9000

CMD chmod 777 *.sh && ./start-prod.sh