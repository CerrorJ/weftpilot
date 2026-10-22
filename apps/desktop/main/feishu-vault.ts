import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, link, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import {
  feishuCredentialBindingSchema,
  type FeishuCredentialBinding,
} from '@weftpilot/agent-team-kernel/protocol'
import type { SecretEncryption } from './model-vault'

const payloadSchema = z
  .object({ binding: feishuCredentialBindingSchema, secret: z.string().min(1).max(16384) })
  .strict()

/** 飞书 secret 与应用 ID 绑定；引用不可覆盖，也不能跨应用复用旧密文。 */
export class FeishuVault {
  constructor(
    private readonly directory: string,
    private readonly encryption: SecretEncryption,
  ) {}

  async save(raw: FeishuCredentialBinding, secret: string): Promise<void> {
    const binding = feishuCredentialBindingSchema.parse(raw)
    this.assertAvailable()
    const payload = payloadSchema.parse({ binding, secret })
    await mkdir(this.directory, { recursive: true })
    const target = join(this.directory, `${binding.reference}.bin`)
    const temporary = `${target}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, this.encryption.encrypt(JSON.stringify(payload)), {
        flag: 'wx',
        mode: 0o600,
      })
      await link(temporary, target)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      if ((await this.read(binding)) !== secret) throw new Error('IDEMPOTENCY_CONFLICT')
    } finally {
      await rm(temporary, { force: true })
    }
  }

  async read(raw: FeishuCredentialBinding): Promise<string> {
    const binding = feishuCredentialBindingSchema.parse(raw)
    this.assertAvailable()
    const ciphertext = await readFile(join(this.directory, `${binding.reference}.bin`))
    const payload = payloadSchema.parse(JSON.parse(this.encryption.decrypt(ciphertext)))
    if (payload.binding.appId !== binding.appId || payload.binding.reference !== binding.reference)
      throw new Error('FEISHU_APP_SECRET_REQUIRED')
    return payload.secret
  }

  private assertAvailable(): void {
    if (!this.encryption.available()) throw new Error('CREDENTIAL_STORAGE_UNAVAILABLE')
  }
}
