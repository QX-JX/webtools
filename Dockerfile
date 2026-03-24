# 构建前端
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:frontend

# 构建后端
FROM node:18-alpine AS backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server .
RUN npm run build

# 最终镜像
FROM node:18-alpine
WORKDIR /app

# 安装nginx
RUN apk add --no-cache nginx

# 复制前端文件
COPY --from=frontend /app/dist /app/frontend

# 复制后端文件
COPY --from=backend /app/server/dist /app/backend
COPY server/package*.json /app/backend/
WORKDIR /app/backend
RUN npm install --only=production

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 启动脚本
WORKDIR /app
COPY start.sh .
RUN chmod +x start.sh

# 暴露端口
EXPOSE 80

# 启动服务
CMD ["sh", "start.sh"]