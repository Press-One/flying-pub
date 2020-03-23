#!/bin/bash
set -e

cd fe
npm config set registry https://registry.npm.taobao.org
yarn install && yarn build || { exit 1; }

cd ../

IMAGE_NAME="reader"

docker build -t $IMAGE_NAME .