cd client
yarn install && yarn build || { exit 1; }

cd ../

IMAGE_NAME="reader"

docker build -t $IMAGE_NAME .