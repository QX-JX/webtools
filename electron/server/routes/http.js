import { Router } from 'express';
const router = Router();
// HTTP 状态检测
router.post('/check', async (req, res) => {
    try {
        const { url, method = 'GET', followRedirects = false } = req.body;
        if (!url) {
            res.json({ success: false, message: 'URL不能为空' });
            return;
        }
        // 确保 URL 有协议
        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        const startTime = Date.now();
        const response = await fetch(targetUrl, {
            method: method.toUpperCase(),
            redirect: followRedirects ? 'follow' : 'manual',
            headers: {
                'User-Agent': 'KunqiongWebTools/1.0'
            }
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        // 获取响应头
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        // 获取重定向信息
        let redirectUrl = '';
        if (response.status >= 300 && response.status < 400) {
            redirectUrl = response.headers.get('location') || '';
        }
        res.json({
            success: true,
            data: {
                url: targetUrl,
                method: method.toUpperCase(),
                statusCode: response.status,
                statusText: response.statusText,
                responseTime,
                headers,
                redirectUrl,
                contentType: response.headers.get('content-type') || '',
                contentLength: response.headers.get('content-length') || '',
                server: response.headers.get('server') || '',
            }
        });
    }
    catch (error) {
        console.error('HTTP check error:', error);
        res.json({
            success: false,
            message: '请求失败: ' + error.message
        });
    }
});
export default router;
