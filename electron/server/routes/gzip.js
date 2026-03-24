import { Router } from 'express';
const router = Router();
// Gzip 压缩检测
router.post('/check', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            res.json({ success: false, message: 'URL不能为空' });
            return;
        }
        // 确保 URL 有协议
        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        // 发送请求，声明支持 gzip
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'KunqiongWebTools/1.0',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });
        const contentEncoding = response.headers.get('content-encoding') || '';
        const contentLength = response.headers.get('content-length') || '';
        const contentType = response.headers.get('content-type') || '';
        const transferEncoding = response.headers.get('transfer-encoding') || '';
        // 判断是否启用了压缩
        const isGzipEnabled = contentEncoding.toLowerCase().includes('gzip');
        const isDeflateEnabled = contentEncoding.toLowerCase().includes('deflate');
        const isBrEnabled = contentEncoding.toLowerCase().includes('br');
        const isCompressed = isGzipEnabled || isDeflateEnabled || isBrEnabled;
        // 获取实际内容大小（如果可能）
        let originalSize = 0;
        let compressedSize = parseInt(contentLength) || 0;
        // 尝试获取原始大小
        try {
            const uncompressedResponse = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'KunqiongWebTools/1.0',
                    'Accept-Encoding': 'identity'
                }
            });
            const text = await uncompressedResponse.text();
            originalSize = new TextEncoder().encode(text).length;
        }
        catch {
            // 忽略错误
        }
        // 计算压缩率
        let compressionRatio = 0;
        if (originalSize > 0 && compressedSize > 0) {
            compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
        }
        res.json({
            success: true,
            data: {
                url: targetUrl,
                isCompressed,
                compressionType: contentEncoding || 'none',
                isGzipEnabled,
                isDeflateEnabled,
                isBrEnabled,
                originalSize,
                compressedSize,
                compressionRatio: compressionRatio > 0 ? compressionRatio : null,
                contentType,
                transferEncoding,
                headers: {
                    'content-encoding': contentEncoding,
                    'content-length': contentLength,
                    'content-type': contentType,
                    'transfer-encoding': transferEncoding,
                }
            }
        });
    }
    catch (error) {
        console.error('Gzip check error:', error);
        res.json({
            success: false,
            message: '检测失败: ' + error.message
        });
    }
});
export default router;
