#!/bin/bash
set -e

cd client
npm config set registry https://registry.npm.taobao.org
yarn install && yarn build || { exit 1; }
cd /pressone/reader

IMAGE_NAME="dh-cn.press.one/pressone/reader"
BOX_IMAGE_NAME="dh-cn.press.one/pressone/box-reader"
XUE_IMAGE_NAME="dh-cn.press.one/pressone/xue-reader"
PRS_IMAGE_NAME="dh-cn.press.one/pressone/prs-reader"
BLOG_IMAGE_NAME="dh-cn.press.one/pressone/blog-reader"

sudo docker login --username pressone --password 57e348ab37aa5b55f68b7642ac584a41 dh-cn.press.one
sudo docker build -t $IMAGE_NAME .

sudo docker tag $IMAGE_NAME $BOX_IMAGE_NAME
sudo docker tag $IMAGE_NAME $XUE_IMAGE_NAME
sudo docker tag $IMAGE_NAME $PRS_IMAGE_NAME
sudo docker tag $IMAGE_NAME $BLOG_IMAGE_NAME

sudo docker push $BOX_IMAGE_NAME
sudo docker push $XUE_IMAGE_NAME
sudo docker push $PRS_IMAGE_NAME
sudo docker push $BLOG_IMAGE_NAME

