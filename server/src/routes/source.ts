import { Router, Request, Response } from 'express'

const router = Router()

interface SourceRequest {
  url: string
}

// 获取网页源码
router.post('/fetch', async (req: Request<{}, {}, SourceRequest>, res: Response) => {
  try {
    const { url } = req.body

    if (!url) {
      res.json({ success: false, message: 'URL不能为空' })
      return
    }

    // 确保 URL 有协议
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    })

    const html = await response.text()
    const contentType = response.headers.get('content-type') || ''
    const contentLength = html.length

    res.json({
      success: true,
      data: {
        url: targetUrl,
        statusCode: response.status,
        contentType,
        contentLength,
        html,
        lineCount: html.split('\n').length,
      }
    })
  } catch (error) {
    console.error('Source fetch error:', error)
    res.json({ 
      success: false, 
      message: '获取失败: ' + (error as Error).message 
    })
  }
})

export default router
