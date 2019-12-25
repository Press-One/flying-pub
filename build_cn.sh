cd fe
npm config set registry https://registry.npm.taobao.org
yarn install
yarn build
cd /pressone/medium

IMAGE_NAME="dh-cn.press.one/pressone/medium"
BOX_IMAGE_NAME="dh-cn.press.one/pressone/box-medium"
XUE_IMAGE_NAME="dh-cn.press.one/pressone/xue-medium"
PRS_IMAGE_NAME="dh-cn.press.one/pressone/prs-medium"

sudo docker login --username pressone --password 57e348ab37aa5b55f68b7642ac584a41 dh-cn.press.one
sudo docker build -t $IMAGE_NAME .

sudo docker tag $IMAGE_NAME $BOX_IMAGE_NAME
sudo docker tag $IMAGE_NAME $XUE_IMAGE_NAME
sudo docker tag $IMAGE_NAME $PRS_IMAGE_NAME

sudo docker push $BOX_IMAGE_NAME
sudo docker push $XUE_IMAGE_NAME
sudo docker push $PRS_IMAGE_NAME

