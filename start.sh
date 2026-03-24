#!/bin/sh
# Docker 内：Nginx 反代静态页 + 后端 API（与根目录 Dockerfile、nginx.conf 一致）

cd /app/backend || exit 1
node index.js &

nginx -g 'daemon off;'
