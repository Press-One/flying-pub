飞帖阅读站，负责展示储存在区块链上的内容

![Flying pub architecture](https://img-cdn.xue.cn/213-reader.png)

## 准备环境

你需要安装 Docker

- 如果你使用 Mac，下载 [Docker 客户端（Mac）](https://docs.docker.com/docker-for-mac/install/)
- 如果你使用 Windows，下载 [Docker 客户端（Windows）](https://docs.docker.com/docker-for-windows/install/)

克隆基础服务仓库（数据库，redis，同步服务）：`git clone https://github.com/Press-One/flying-pub`

克隆飞帖阅读站仓库：`git clone https://github.com/Press-One/reader.git`

## 生成配置

`注: 如果你在配置 pub 项目时，已经生成了配置，那么这一步你就可以跳过，直接使用已经生成的配置即可，因为 reader 和 pub 的配置文件是共用同一套的，不能各自生成`

进入 `flying-pub` 仓库

运行向导程序，根据提示注册两个 Mixin App 即可生成配置文件

```
./scripts/generate_config.sh
```

（备注：在启动向导程序时，需要花一点时间初始化环境，估计耗时 5 分钟，完成之后才会进入向导程序）

配置生成之后，请打开 `Settings.toml`，手动修改一行代码

```
webhook: "http://${YOUR_HOST_IP}:8000/api/webhook/medium"
```

把你的电脑的本地 IP 填到 `${YOUR_HOST_IP}`

## 启动

### 基础服务

进入 `flying-pub` 仓库

```
 ./scripts/start.sh
```

### 阅读站服务

进入 `reader` 仓库，复制配置文件

```
cp ../flying-reader/config/config.reader.js ./server/config.js
cp ../flying-reader/config/config.reader-wallet.js ./server/config.wallet.js
```

安装依赖

```
./install.sh
```

启动

```
./start.sh
```

项目启动完毕，你可以访问阅读站服务：[http://localhost:5000](http://localhost:5000)

## 打包镜像

```
./build.sh
```
