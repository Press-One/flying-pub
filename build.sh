cd client
yarn install && yarn build || { exit 1; }

cd ../

sudo docker login -u prs-admin -p 57e348ab37aa5b55f68b7642ac584a41 dockerhub.qingcloud.com

# 静态文件上传到 CDN
sudo docker run --rm -v $(pwd)/client/build/static/js:/app/src dockerhub.qingcloud.com/pressone_private/qingcloud-uploader sh -c "npm start -- --folder='reader/static/js'"
sudo docker run --rm -v $(pwd)/client/build/static/css:/app/src dockerhub.qingcloud.com/pressone_private/qingcloud-uploader sh -c "npm start -- --folder='reader/static/css'"

IMAGE_NAME="reader"

docker build -t $IMAGE_NAME .