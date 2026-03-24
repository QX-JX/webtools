const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const tar = require('tar');
const crypto = require('crypto');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const archiveName = `kunqiong-webtools-${timestamp}.tar.gz`;

const excludePatterns = [
  'node_modules',
  'dist',
  '.git',
  '.vscode',
  '.idea',
  'project-backup',
  '*.log',
  '*.local',
  'deploy.zip'
];

console.log(`开始打包: ${archiveName}`);
console.log(`排除模式: ${excludePatterns.join(', ')}`);

const gzip = require('zlib').createGzip();
const output = createWriteStream(archiveName);
const hash = crypto.createHash('md5');

// 监听输出流
output.on('finish', () => {
  const stats = fs.statSync(archiveName);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n 打包完成`);
  console.log(`文件名: ${archiveName}`);
  console.log(`文件大小: ${sizeMB} MB (${stats.size} bytes)`);
  console.log(`MD5校验值: ${hash.digest('hex')}`);
});

output.on('error', (err) => {
  console.error('输出流错误:', err);
  process.exit(1);
});

gzip.on('error', (err) => {
  console.error('压缩错误:', err);
  process.exit(1);
});

// 创建 tar 流
const tarStream = tar.create(
  {
    gzip: false,
    filter: (path, stat) => {
      // 检查是否应该排除
      for (const pattern of excludePatterns) {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          if (regex.test(path)) return false;
        } else if (path.includes(pattern)) {
          return false;
        }
      }
      return true;
    }
  },
  ['.']
);

tarStream.on('error', (err) => {
  console.error('tar 错误:', err);
  process.exit(1);
});

// 管道连接
pipeline(
  tarStream,
  gzip,
  output,
  (err) => {
    if (err) {
      console.error('管道错误:', err);
      process.exit(1);
    }
  }
);

// 计算 MD5
output.on('data', (chunk) => {
  hash.update(chunk);
});
