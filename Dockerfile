# ================= Stage 1: build frontend =================
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build

# ================= Stage 2: production image =================
FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --registry=https://registry.npmmirror.com && \
    npm cache clean --force

COPY server.js ./
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app/data

USER appuser

ENV PORT=3001
ENV DATA_DIR=/app/data
ENV NODE_ENV=production

VOLUME ["/app/data"]

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
