# GitHub Actions 自动构建 → DockerHub → 部署指南

## 一、前置准备

### 1. 注册 DockerHub 账号
前往 https://hub.docker.com/ 注册，记下你的**用户名**。

### 2. 创建 DockerHub Access Token
- 登录 DockerHub → Account Settings → Security → New Access Token
- 权限选 **Read & Write**
- 复制生成的 Token（只显示一次！）

### 3. 创建 GitHub 仓库
- 在 GitHub 上创建一个新仓库（如 `prompt-builder`）
- **不要**勾选初始化 README

---

## 二、配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret

| Secret 名称 | 值 |
|---|---|
| `DOCKERHUB_USERNAME` | 你的 DockerHub 用户名 |
| `DOCKERHUB_TOKEN` | 刚才生成的 Access Token |

---

## 三、推送代码触发构建

```bash
# 在项目目录下
cd c:\Users\seeft\WorkBuddy\Claw

git init
git add .
git commit -m "feat: 初始版本"
git branch -M main
git remote add origin https://github.com/你的用户名/prompt-builder.git
git push -u origin main
```

推送后 GitHub Actions 会自动开始构建，构建完成后镜像会推送到：
```
你的DockerHub用户名/promptly:latest
```

同时构建 **amd64 + arm64** 双架构，x86 路由器和 ARM 设备都能用。

---

## 四、在 OpenWrt 路由器上部署

### 1. SSH 登录路由器
```bash
ssh root@路由器IP
```

### 2. 创建项目目录和配置
```bash
mkdir -p /opt/prompt-builder
cd /opt/prompt-builder
```

### 3. 创建 docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  prompt-builder:
    image: 你的DockerHub用户名/prompt-builder:latest
    container_name: prompt-builder
    ports:
      - "8080:3001"
    volumes:
      - prompt-builder-data:/app/data
    restart: unless-stopped
    environment:
      - PORT=3001
      - DATA_DIR=/app/data
      - NODE_ENV=production
      - JWT_SECRET=你自己的随机密钥
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  prompt-builder-data:
    driver: local
EOF
```

### 4. 拉取镜像并启动
```bash
docker-compose up -d
```

### 5. 访问
浏览器打开 `http://路由器IP:8080`

---

## 五、日常更新

每次你修改代码并 push 到 GitHub main 分支，Actions 会自动构建新镜像。

在路由器上更新：
```bash
cd /opt/prompt-builder
docker-compose pull
docker-compose up -d
```

发布正式版本（打版本号标签）：
```bash
git tag v1.0.0
git push origin v1.0.0
```
这会额外构建一个 `v1.0.0` 标签的镜像。

---

## 六、手动触发构建

如果不想 push 代码也想触发构建：
- 进入 GitHub 仓库 → Actions → Build and Push Docker Image → Run workflow

---

## 七、排查问题

### 查看构建日志
GitHub 仓库 → Actions → 点击最近一次运行 → 查看详情

### 查看容器日志
```bash
docker logs prompt-builder
docker logs -f prompt-builder  # 实时跟踪
```

### 进入容器排查
```bash
docker exec -it prompt-builder sh
```

### 数据备份
```bash
# 导出数据
docker cp prompt-builder:/app/data ./backup
```
