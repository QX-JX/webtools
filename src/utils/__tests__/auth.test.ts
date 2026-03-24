import { generateSignedNonce, encodeSignedNonce } from '../auth'
import CryptoJS from 'crypto-js'

const SECRET_KEY = '7530bfb1ad6c41627b0f0620078fa5ed'

describe('Auth Utils', () => {
  describe('generateSignedNonce', () => {
    it('应该生成有效的签名nonce', () => {
      const signedNonce = generateSignedNonce()

      // 检查必要字段
      expect(signedNonce).toHaveProperty('nonce')
      expect(signedNonce).toHaveProperty('timestamp')
      expect(signedNonce).toHaveProperty('signature')

      // 检查字段类型
      expect(typeof signedNonce.nonce).toBe('string')
      expect(typeof signedNonce.timestamp).toBe('number')
      expect(typeof signedNonce.signature).toBe('string')

      // 检查nonce长度（UUID去掉-后应该是32个字符）
      expect(signedNonce.nonce.length).toBe(32)

      // 检查timestamp是否合理（应该是当前时间戳）
      const now = Math.floor(Date.now() / 1000)
      expect(Math.abs(signedNonce.timestamp - now)).toBeLessThan(2)
    })

    it('应该生成不同的nonce', () => {
      const nonce1 = generateSignedNonce()
      const nonce2 = generateSignedNonce()

      expect(nonce1.nonce).not.toBe(nonce2.nonce)
      expect(nonce1.signature).not.toBe(nonce2.signature)
    })

    it('签名应该正确验证', () => {
      const signedNonce = generateSignedNonce()
      const message = `${signedNonce.nonce}|${signedNonce.timestamp}`

      // 使用相同的密钥和算法验证签名
      const hmacHash = CryptoJS.HmacSHA256(message, SECRET_KEY)
      const expectedSignature = CryptoJS.enc.Base64.stringify(hmacHash)

      expect(signedNonce.signature).toBe(expectedSignature)
    })
  })

  describe('encodeSignedNonce', () => {
    it('应该正确编码签名nonce', () => {
      const signedNonce = generateSignedNonce()
      const encoded = encodeSignedNonce(signedNonce)

      // 检查编码结果
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)

      // 检查是否是URL安全的（不包含+、/、=）
      expect(encoded).not.toMatch(/\+/)
      expect(encoded).not.toMatch(/\//)
      expect(encoded).not.toMatch(/=/)
    })

    it('应该能够解码回原始数据', () => {
      const signedNonce = generateSignedNonce()
      const encoded = encodeSignedNonce(signedNonce)

      // 解码
      const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4)
      const urlSafeStr = padded.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = CryptoJS.enc.Base64.parse(urlSafeStr).toString(CryptoJS.enc.Utf8)
      const decodedObj = JSON.parse(decoded)

      // 验证解码结果
      expect(decodedObj.nonce).toBe(signedNonce.nonce)
      expect(decodedObj.timestamp).toBe(signedNonce.timestamp)
      expect(decodedObj.signature).toBe(signedNonce.signature)
    })

    it('编码结果应该是URL安全的', () => {
      const signedNonce = generateSignedNonce()
      const encoded = encodeSignedNonce(signedNonce)

      // 可以安全地用在URL中
      const testUrl = `https://example.com/login?client_nonce=${encoded}`
      expect(() => new URL(testUrl)).not.toThrow()
    })
  })

  describe('HMAC-SHA256签名算法', () => {
    it('应该使用正确的算法生成签名', () => {
      const testMessage = 'test_nonce|1234567890'

      // 使用auth.ts中的逻辑
      const hmacHash = CryptoJS.HmacSHA256(testMessage, SECRET_KEY)
      const signature = CryptoJS.enc.Base64.stringify(hmacHash)

      // 验证签名不为空
      expect(signature.length).toBeGreaterThan(0)

      // 验证签名是base64格式
      expect(signature).toMatch(/^[A-Za-z0-9+/]*={0,2}$/)
    })

    it('相同的消息应该生成相同的签名', () => {
      const testMessage = 'test_nonce|1234567890'

      const hmacHash1 = CryptoJS.HmacSHA256(testMessage, SECRET_KEY)
      const signature1 = CryptoJS.enc.Base64.stringify(hmacHash1)

      const hmacHash2 = CryptoJS.HmacSHA256(testMessage, SECRET_KEY)
      const signature2 = CryptoJS.enc.Base64.stringify(hmacHash2)

      expect(signature1).toBe(signature2)
    })

    it('不同的消息应该生成不同的签名', () => {
      const message1 = 'nonce1|1234567890'
      const message2 = 'nonce2|1234567890'

      const hmacHash1 = CryptoJS.HmacSHA256(message1, SECRET_KEY)
      const signature1 = CryptoJS.enc.Base64.stringify(hmacHash1)

      const hmacHash2 = CryptoJS.HmacSHA256(message2, SECRET_KEY)
      const signature2 = CryptoJS.enc.Base64.stringify(hmacHash2)

      expect(signature1).not.toBe(signature2)
    })
  })
})
