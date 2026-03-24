import { Router, Request, Response } from 'express'
import https from 'https'
import tls from 'tls'

const router = Router()

interface SslCheckRequest {
  domain: string
}

// SSL 证书检测
router.post('/check', async (req: Request<{}, {}, SslCheckRequest>, res: Response) => {
  try {
    const { domain } = req.body

    if (!domain) {
      res.json({ success: false, message: '域名不能为空' })
      return
    }

    // 清理域名格式
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0].trim()

    const result = await new Promise<any>((resolve, reject) => {
      const options = {
        host: cleanDomain,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false, // 允许自签名证书
        agent: false,
      }

      const req = https.request(options, (response) => {
        const socket = response.socket as tls.TLSSocket
        const cert = socket.getPeerCertificate(true)

        if (!cert || Object.keys(cert).length === 0) {
          reject(new Error('无法获取证书信息'))
          return
        }

        // 计算证书有效期
        const validFrom = new Date(cert.valid_from)
        const validTo = new Date(cert.valid_to)
        const now = new Date()
        const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const isExpired = daysRemaining < 0
        const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0

        // 获取证书链
        const chain: any[] = []
        let currentCert: any = cert
        while (currentCert) {
          chain.push({
            subject: currentCert.subject,
            issuer: currentCert.issuer,
            validFrom: currentCert.valid_from,
            validTo: currentCert.valid_to,
          })
          currentCert = currentCert.issuerCertificate
          // 防止循环引用
          if (currentCert === cert) break
          if (chain.length > 10) break
        }

        resolve({
          domain: cleanDomain,
          valid: socket.authorized,
          authorizationError: socket.authorizationError || null,
          subject: {
            commonName: cert.subject?.CN || '',
            organization: cert.subject?.O || '',
            organizationUnit: cert.subject?.OU || '',
            country: cert.subject?.C || '',
            state: cert.subject?.ST || '',
            locality: cert.subject?.L || '',
          },
          issuer: {
            commonName: cert.issuer?.CN || '',
            organization: cert.issuer?.O || '',
            country: cert.issuer?.C || '',
          },
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining,
          isExpired,
          isExpiringSoon,
          serialNumber: cert.serialNumber || '',
          fingerprint: cert.fingerprint || '',
          fingerprint256: cert.fingerprint256 || '',
          subjectAltNames: cert.subjectaltname?.split(', ').map((s: string) => s.replace('DNS:', '')) || [],
          protocol: socket.getProtocol() || '',
          cipher: socket.getCipher() || {},
          chain: chain.slice(0, 5), // 最多返回5层证书链
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      req.setTimeout(10000, () => {
        req.destroy()
        reject(new Error('连接超时'))
      })

      req.end()
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('SSL check error:', error)
    res.json({ 
      success: false, 
      message: '检测失败: ' + (error as Error).message 
    })
  }
})

export default router
