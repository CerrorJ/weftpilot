import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'
import type { SecretEncryption } from '../../apps/desktop/main/model-vault'

/** 单元测试只验证凭据端口；真实系统加密由 Electron E2E 验证。 */
export const secretEncryption = (): SecretEncryption => {
  const key = randomBytes(32)
  return {
    available: () => true,
    encrypt: (value) => {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
      return Buffer.concat([iv, cipher.getAuthTag(), data])
    },
    decrypt: (value) => {
      const cipher = createDecipheriv('aes-256-gcm', key, value.subarray(0, 12))
      cipher.setAuthTag(value.subarray(12, 28))
      return Buffer.concat([cipher.update(value.subarray(28)), cipher.final()]).toString('utf8')
    },
  }
}
