#!/bin/bash
set -e

cd client
npm config set registry https://registry.npm.taobao.org
yarn install && yarn build || { exit 1; }
docker login -u prs-os -p pressone dockerhub.qingcloud.com
docker run -it --rm -v $(pwd)/client/build/static/js:/app/src dockerhub.qingcloud.com/pressone/qingcloud-uploader sh -c "npm start"
docker run -it --rm -v $(pwd)/client/build/static/css:/app/src dockerhub.qingcloud.com/pressone/qingcloud-uploader sh -c "npm start"
cd /pressone/reader

IMAGE_NAME="dockerhub.qingcloud.com/pressone/reader"
BOX_IMAGE_NAME="dockerhub.qingcloud.com/pressone/box-reader"
XUE_IMAGE_NAME="dockerhub.qingcloud.com/pressone/xue-reader"
PRS_IMAGE_NAME="dockerhub.qingcloud.com/pressone/prs-reader"
BLOG_IMAGE_NAME="dockerhub.qingcloud.com/pressone/blog-reader"

sudo docker login -u prs-admin -p 57e348ab37aa5b55f68b7642ac584a41 dockerhub.qingcloud.com
sudo docker build -t $IMAGE_NAME .

sudo docker tag $IMAGE_NAME $BOX_IMAGE_NAME
sudo docker tag $IMAGE_NAME $XUE_IMAGE_NAME
sudo docker tag $IMAGE_NAME $PRS_IMAGE_NAME
sudo docker tag $IMAGE_NAME $BLOG_IMAGE_NAME

sudo docker push $BOX_IMAGE_NAME
sudo docker push $XUE_IMAGE_NAME
sudo docker push $PRS_IMAGE_NAME
sudo docker push $BLOG_IMAGE_NAME

