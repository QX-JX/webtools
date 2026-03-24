import { Router, Request, Response } from 'express'
import forge from 'node-forge'

const router = Router()

interface CsrGenerateRequest {
  commonName: string
  organization?: string
  organizationUnit?: string
  city?: string
  state?: string
  country?: string
  email?: string
  keySize?: string
}

interface CsrParseRequest {
  csr: string
}

// 生成 CSR 和私钥
router.post('/generate', (req: Request<{}, {}, CsrGenerateRequest>, res: Response) => {
  try {
    const {
      commonName,
      organization = '',
      organizationUnit = '',
      city = '',
      state = '',
      country = 'CN',
      email = '',
      keySize = '2048'
    } = req.body

    if (!commonName) {
      res.json({ success: false, message: '域名不能为空' })
      return
    }

    // 生成密钥对
    const keys = forge.pki.rsa.generateKeyPair(parseInt(keySize))

    // 创建 CSR
    const csr = forge.pki.createCertificationRequest()
    csr.publicKey = keys.publicKey

    // 设置主题属性
    const attrs: forge.pki.CertificateField[] = []
    if (country) attrs.push({ shortName: 'C', value: country })
    if (state) attrs.push({ shortName: 'ST', value: state })
    if (city) attrs.push({ shortName: 'L', value: city })
    if (organization) attrs.push({ shortName: 'O', value: organization })
    if (organizationUnit) attrs.push({ shortName: 'OU', value: organizationUnit })
    if (commonName) attrs.push({ shortName: 'CN', value: commonName })
    if (email) attrs.push({ shortName: 'E', value: email })

    csr.setSubject(attrs)

    // 签名 CSR
    csr.sign(keys.privateKey, forge.md.sha256.create())

    // 转换为 PEM 格式
    const csrPem = forge.pki.certificationRequestToPem(csr)
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)

    res.json({
      success: true,
      data: {
        csr: csrPem,
        privateKey: privateKeyPem
      }
    })
  } catch (error) {
    console.error('CSR generation error:', error)
    res.json({ success: false, message: '生成失败: ' + (error as Error).message })
  }
})

// 解析 CSR
router.post('/parse', (req: Request<{}, {}, CsrParseRequest>, res: Response) => {
  try {
    const { csr } = req.body

    if (!csr) {
      res.json({ success: false, message: 'CSR内容不能为空' })
      return
    }

    // 解析 CSR
    const csrObj = forge.pki.certificationRequestFromPem(csr)

    // 提取主题信息
    const subject = csrObj.subject.attributes.reduce((acc, attr) => {
      acc[attr.shortName || ''] = attr.value as string
      return acc
    }, {} as Record<string, string>)

    // 获取公钥信息
    const publicKey = csrObj.publicKey as forge.pki.rsa.PublicKey
    let keySize = 0
    if (publicKey.n) {
      keySize = publicKey.n.bitLength()
    }

    res.json({
      success: true,
      data: {
        commonName: subject.CN || '',
        organization: subject.O || '',
        organizationUnit: subject.OU || '',
        city: subject.L || '',
        state: subject.ST || '',
        country: subject.C || '',
        email: subject.E || subject.emailAddress || '',
        keyAlgorithm: 'RSA',
        keySize: keySize,
        signatureAlgorithm: csrObj.signatureOid ? (forge.pki.oids as Record<string, string>)[csrObj.signatureOid] || csrObj.signatureOid : 'SHA256withRSA'
      }
    })
  } catch (error) {
    console.error('CSR parse error:', error)
    res.json({ success: false, message: '解析失败，请检查CSR格式是否正确' })
  }
})

export default router
