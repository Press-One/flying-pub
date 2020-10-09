#!/bin/bash
set -e

cd client
yarn install && yarn build || { exit 1; }

cd /pressone/reader

sudo docker login -u prs-admin -p 57e348ab37aa5b55f68b7642ac584a41 dockerhub.qingcloud.com

# 静态文件上传到 CDN
sudo docker run --rm -v $(pwd)/client/build/static/js:/app/src dockerhub.qingcloud.com/pressone_private/qingcloud-uploader sh -c "npm start -- --folder='reader/static/js'"
sudo docker run --rm -v $(pwd)/client/build/static/css:/app/src dockerhub.qingcloud.com/pressone_private/qingcloud-uploader sh -c "npm start -- --folder='reader/static/css'"

IMAGE_NAME="dockerhub.qingcloud.com/pressone/reader"
BOX_IMAGE_NAME="dockerhub.qingcloud.com/pressone/flying-pub-box"
# XUE_IMAGE_NAME="dockerhub.qingcloud.com/pressone/xue-reader"
# PRS_IMAGE_NAME="dockerhub.qingcloud.com/pressone/prs-reader"
# BLOG_IMAGE_NAME="dockerhub.qingcloud.com/pressone/blog-reader"
# WRITING_IMAGE_NAME="dockerhub.qingcloud.com/pressone/writing-reader"

sudo docker build -t $IMAGE_NAME .

sudo docker tag $IMAGE_NAME $BOX_IMAGE_NAME
# sudo docker tag $IMAGE_NAME $XUE_IMAGE_NAME
# sudo docker tag $IMAGE_NAME $PRS_IMAGE_NAME
# sudo docker tag $IMAGE_NAME $BLOG_IMAGE_NAME
# sudo docker tag $IMAGE_NAME $WRITING_IMAGE_NAME

sudo docker push $BOX_IMAGE_NAME
# sudo docker push $XUE_IMAGE_NAME
# sudo docker push $PRS_IMAGE_NAME
# sudo docker push $BLOG_IMAGE_NAME
# sudo docker push $WRITING_IMAGE_NAME