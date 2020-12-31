cd client
yarn install && yarn build || { exit 1; }

cd ../

sudo docker login -u prs-admin -p 57e348ab37aa5b55f68b7642ac584a41 dockerhub.qingcloud.com

IMAGE_NAME="reader"

docker build -t $IMAGE_NAME .
