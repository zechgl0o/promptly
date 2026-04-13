# ================= 阶段1：构建前端 =================
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build

# ================= 阶段2：生产镜像 =================
FROM node:20-alpine

# 安装 tini 作为 init 进程，优雅处理信号
RUN apk add --no-cache tini

WORKDIR /app

# 只安装生产依赖
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --registry=https://registry.npmmirror.com && \
    npm cache clean --force

# 复制后端代码
COPY server.js ./

# 从构建阶段复制前端产物
COPY --from=builder /app/dist ./dist

# 创建数据目录和非 root 用户
RUN mkdir -p /app/data && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app/data

USER appuser

# 环境变量
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV NODE_ENV=production
ENV JWT_SECRET=change-me-in-production

# 数据卷
VOLUME ["/app/data"]

EXPOSE 3001

# 使用 tini 确保 Node.js 进程能正确接收退出信号
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
