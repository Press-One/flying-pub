sudo docker login -u prs-admin -p 57e348ab37aa5b55f68b7642ac584a41 dockerhub.qingcloud.com

IMAGE_NAME="prerender"

docker build -f Dockerfile-prerender -t $IMAGE_NAME .
