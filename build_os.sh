cd fe
npm config set registry https://registry.npm.taobao.org
yarn install
yarn build

cd ../

IMAGE_NAME="posts"

docker build -t $IMAGE_NAME .