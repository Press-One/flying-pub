cd /pressone/pub
git checkout .
git clean -f -d
git pull

cd fe
npm config set registry https://registry.npm.taobao.org
yarn install
yarn build
cd /pressone/pub

IMAGE_NAME="dh-cn.press.one/pressone/${1}-pub"

sudo docker login --username pressone --password 57e348ab37aa5b55f68b7642ac584a41 dh-cn.press.one
sudo docker build -t $IMAGE_NAME .
sudo docker push $IMAGE_NAME
