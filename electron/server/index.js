import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import csrRoutes from './routes/csr.js';
import whoisRoutes from './routes/whois.js';
import dnsRoutes from './routes/dns.js';
import httpRoutes from './routes/http.js';
import gzipRoutes from './routes/gzip.js';
import sslRoutes from './routes/ssl.js';
import sourceRoutes from './routes/source.js';
import metaRoutes from './routes/meta.js';
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3002;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 安全中间件
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // 允许前端资源加载
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// 请求速率限制 - 防止滥用
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100次请求
    message: { success: false, message: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false
});
// 对敏感API应用更严格的限制
const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 10, // 每个IP最多10次请求
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});
// 应用速率限制
app.use('/api/', apiLimiter);
app.use('/api/whois', strictLimiter);
app.use('/api/ssl', strictLimiter);
// Routes
app.use('/api/csr', csrRoutes);
app.use('/api/whois', whoisRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/http', httpRoutes);
app.use('/api/gzip', gzipRoutes);
app.use('/api/ssl', sslRoutes);
app.use('/api/source', sourceRoutes);
app.use('/api/meta', metaRoutes);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 托管前端静态文件 (生产环境)
// 优先使用环境变量指定的路径
const clientPath = process.env.STATIC_PATH || (process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../client')
    : path.join(__dirname, '../../dist'));
console.log('Serving static files from:', clientPath);
app.use(express.static(clientPath));
// 所有非API请求返回前端入口文件 (支持前端路由)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
});
// 全局错误处理中间件
app.use((err, _req, res, _next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
});
// WebSocket Echo 服务
const wss = new WebSocketServer({ server, path: '/ws/echo' });
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('message', (message) => {
        // Echo 回发消息
        const msgStr = message.toString();
        console.log('Received:', msgStr);
        ws.send(msgStr);
    });
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    // 发送欢迎消息
    ws.send('已连接到鲲穹 WebSocket Echo 服务');
});
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Echo available at ws://localhost:${PORT}/ws/echo`);
});
