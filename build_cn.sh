cd /pressone/medium
git reset --hard HEAD
git pull
git checkout release
git clean -f -d
git pull

BOX_IMAGE_NAME="dh-cn.press.one/pressone/medium:box"
XUE_IMAGE_NAME="dh-cn.press.one/pressone/medium:xue"

sudo docker login --username pressone --password 57e348ab37aa5b55f68b7642ac584a41 dh-cn.press.one
sudo docker build -f Dockerfile-production -t $BOX_IMAGE_NAME .
sudo docker tag $(docker images | awk '{print $3}' | awk 'NR==2') $XUE_IMAGE_NAME
sudo docker push $BOX_IMAGE_NAME
sudo docker push $XUE_IMAGE_NAME
