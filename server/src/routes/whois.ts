import { Router, Request, Response } from 'express'
import whois from 'whois-json'

const router = Router()

interface WhoisRequest {
  domain: string
}

// WHOIS 查询
router.post('/lookup', async (req: Request<{}, {}, WhoisRequest>, res: Response) => {
  try {
    const { domain } = req.body

    if (!domain) {
      res.json({ success: false, message: '域名不能为空' })
      return
    }

    // 清理域名格式
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim()

    // 查询 WHOIS
    const result = await whois(cleanDomain)

    if (!result || Object.keys(result).length === 0) {
      res.json({ success: false, message: '未找到该域名的 WHOIS 信息' })
      return
    }

    // 格式化结果
    const formattedResult = {
      domainName: result.domainName || cleanDomain,
      registrar: result.registrar || result.registrarName || '',
      registrarUrl: result.registrarUrl || result.registrarURL || '',
      creationDate: result.creationDate || result.createdDate || result.created || '',
      expirationDate: result.registrarRegistrationExpirationDate || result.expirationDate || result.expires || '',
      updatedDate: result.updatedDate || result.lastUpdated || '',
      nameServers: result.nameServer || result.nameServers || [],
      status: result.domainStatus || result.status || [],
      registrant: {
        name: result.registrantName || '',
        organization: result.registrantOrganization || result.registrantOrg || '',
        country: result.registrantCountry || '',
        email: result.registrantEmail || '',
      },
      admin: {
        name: result.adminName || '',
        email: result.adminEmail || '',
      },
      tech: {
        name: result.techName || '',
        email: result.techEmail || '',
      },
      dnssec: result.dnssec || result.DNSSEC || '',
      raw: result
    }

    res.json({
      success: true,
      data: formattedResult
    })
  } catch (error) {
    console.error('WHOIS lookup error:', error)
    res.json({ success: false, message: '查询失败: ' + (error as Error).message })
  }
})

export default router
