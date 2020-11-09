## 教程

### 清空旧的数据库

去 flying-pub 仓库，清空数据库，重启 pg 和 redis

```
cd flying-pub
./scripts/stop_all.sh
./scripts/rm_data.sh
./scripts/start_pg_redis.sh.sh
```

### 拷贝配置文件

```
cp server/config.example/config.js server/config.js
cp server/config.example/config.wallet.js server/config.wallet.js
cp server/config.example/config.pub.js server/SSO/config.pub.js
cp server/config.example/config.pub.wallet.js server/SSO/config.pub.wallet.js
```

### 按照依赖

```
./install.sh
```

### 启动项目

```
前端：./start-client.sh
后端：./start-server.sh
```
