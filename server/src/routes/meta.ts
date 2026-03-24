import { Router } from 'express'

const router = Router()

router.post('/check', async (req, res) => {
  const { url } = req.body
  
  if (!url) {
    return res.status(400).json({ error: '请输入URL' })
  }

  try {
    let targetUrl = url
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })

    const html = await response.text()
    
    // 解析 META 标签
    const metaTags: Array<{ name: string; content: string; type: string }> = []
    
    // 匹配 <title>
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch) {
      metaTags.push({ name: 'title', content: titleMatch[1].trim(), type: 'title' })
    }

    // 匹配 meta name="xxx" content="xxx"
    const metaNameRegex = /<meta\s+[^>]*name\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi
    let match
    while ((match = metaNameRegex.exec(html)) !== null) {
      metaTags.push({ name: match[1], content: match[2], type: 'name' })
    }

    // 匹配 meta content="xxx" name="xxx" (顺序相反)
    const metaNameRegex2 = /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']([^"']+)["'][^>]*>/gi
    while ((match = metaNameRegex2.exec(html)) !== null) {
      metaTags.push({ name: match[2], content: match[1], type: 'name' })
    }

    // 匹配 meta property="xxx" content="xxx" (Open Graph)
    const metaPropertyRegex = /<meta\s+[^>]*property\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi
    while ((match = metaPropertyRegex.exec(html)) !== null) {
      metaTags.push({ name: match[1], content: match[2], type: 'property' })
    }

    // 匹配 meta content="xxx" property="xxx"
    const metaPropertyRegex2 = /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*property\s*=\s*["']([^"']+)["'][^>]*>/gi
    while ((match = metaPropertyRegex2.exec(html)) !== null) {
      metaTags.push({ name: match[2], content: match[1], type: 'property' })
    }

    // 匹配 meta http-equiv="xxx" content="xxx"
    const metaHttpEquivRegex = /<meta\s+[^>]*http-equiv\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi
    while ((match = metaHttpEquivRegex.exec(html)) !== null) {
      metaTags.push({ name: match[1], content: match[2], type: 'http-equiv' })
    }

    // 匹配 meta charset
    const charsetMatch = html.match(/<meta\s+[^>]*charset\s*=\s*["']?([^"'\s>]+)["']?[^>]*>/i)
    if (charsetMatch) {
      metaTags.push({ name: 'charset', content: charsetMatch[1], type: 'charset' })
    }

    // 去重
    const uniqueTags = metaTags.filter((tag, index, self) =>
      index === self.findIndex(t => t.name === tag.name && t.type === tag.type)
    )

    res.json({
      url: targetUrl,
      metaTags: uniqueTags,
      totalCount: uniqueTags.length
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '检测失败' })
  }
})

export default router
