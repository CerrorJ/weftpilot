import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, link, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import {
  credentialBindingSchema,
  type CredentialBinding,
} from '@weftpilot/agent-team-kernel/protocol'

export interface SecretEncryption {
  available(): boolean
  encrypt(value: string): Buffer
  decrypt(value: Buffer): string
}

/** 引用不可覆盖，旧 Run 始终解析旧密钥；密文同时固定提供方和目标地址。 */
export class ModelVault {
  constructor(
    private readonly directory: string,
    private readonly encryption: SecretEncryption,
  ) {}

  async save(raw: CredentialBinding, secret: string): Promise<void> {
    const binding = credentialBindingSchema.parse(raw)
    this.assertAvailable()
    if (!secret || secret.length > 16384) throw new Error('MODEL_CREDENTIAL_REQUIRED')
    await mkdir(this.directory, { recursive: true })
    const target = this.path(binding)
    const temporary = `${target}.${randomUUID()}.tmp`
    const payload = JSON.stringify({ binding, secret })
    try {
      await writeFile(temporary, this.encryption.encrypt(payload), { flag: 'wx', mode: 0o600 })
      // 同目录硬链接提供不覆盖的原子发布；不支持时失败，不回退到覆盖旧引用。
      await link(temporary, target)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const existing = await this.read(binding)
      if (existing !== secret) throw new Error('IDEMPOTENCY_CONFLICT')
    } finally {
      await rm(temporary, { force: true })
    }
  }

  async read(raw: CredentialBinding): Promise<string> {
    const binding = credentialBindingSchema.parse(raw)
    this.assertAvailable()
    const encrypted = await readFile(this.path(binding))
    const payload: unknown = JSON.parse(this.encryption.decrypt(encrypted))
    if (!matchesBinding(payload, binding)) throw new Error('MODEL_CREDENTIAL_REQUIRED')
    return payload.secret
  }

  private path(binding: CredentialBinding): string {
    return join(this.directory, `${binding.reference}.bin`)
  }

  private assertAvailable(): void {
    if (!this.encryption.available()) throw new Error('CREDENTIAL_STORAGE_UNAVAILABLE')
  }
}

const matchesBinding = (
  payload: unknown,
  expected: CredentialBinding,
): payload is { secret: string; binding: CredentialBinding } => {
  const parsed = z
    .object({ binding: credentialBindingSchema, secret: z.string().min(1).max(16384) })
    .strict()
    .safeParse(payload)
  if (!parsed.success) return false
  const actual = parsed.data.binding
  return (
    actual.reference === expected.reference &&
    actual.provider === expected.provider &&
    actual.baseUrl === expected.baseUrl
  )
}
