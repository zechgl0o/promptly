# MEMORY.md - 长期记忆

## 用户项目：Prompt Builder 本地化改造
- 原始代码：`C:/Users/seeft/Desktop/propmt.jsx`，React 单文件组件 ~1687 行
- 原架构：Firebase Firestore/Auth + localStorage（仅主题/翻译配置）
- 目标：移除 Firebase 依赖，改为本地存储 + 可选 NAS WebDAV 同步
- 代码中已有 `isLocalEnv = !db || !auth` 分支，改造难度低-中
- 三阶段方案：(A) localStorage [推荐先做] → (B) IndexedDB/Dexie.js → (C) NAS WebDAV

## ddnsto + WebDAV 认证方案
- 用户 NAS 无公网 IP，通过 ddnsto 穿透
- ddnsto 有两层认证：(1) IP验证（微信扫码/易有云）(2) NAS WebDAV Basic Auth
- 第1层是核心难点：未验证IP会被拦截返回HTML，WebDAV客户端会报错
- 推荐方案：先试关闭ddnsto验证 → 浏览器预认证+状态检测 → 内嵌认证窗口 → 本地代理
- 备选：换 Cloudflare Tunnel / Tailscale 等无认证拦截的穿透工具

## Prompt Builder Docker 部署架构
- 用户本机无 Docker Desktop，采用 GitHub Actions 自动构建推送 DockerHub
- 镜像支持 amd64 + arm64 双架构
- 部署目标：OpenWrt x86 路由器（16G 内存）
- 多用户功能：开放注册、JWT 认证、数据隔离、修改密码
- npm install 需加 --registry=https://registry.npmmirror.com（国内网络）
