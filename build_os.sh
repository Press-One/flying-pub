#!/bin/bash
set -e

cd client
yarn install && yarn build || { exit 1; }

cd ../

git checkout . &&
git fetch origin master &&
git checkout master &&
git clean -f -d &&
git pull

sudo docker login -u prs-admin -p 57e348ab37aa5b55f68b7642ac584a41 dockerhub.qingcloud.com
IMAGE_NAME="dockerhub.qingcloud.com/pressone/reader"
sudo docker build -t $IMAGE_NAME .
sudo docker push $IMAGE_NAME

git checkout . &&
git clean -f -d &&
git checkout release

ssh huoju@139.198.113.188 "
sudo docker system prune -f &&
cd /data/deploy/xue-testing/flying-pub/ &&
git pull &&
./redeploy-flying-pub.sh
"