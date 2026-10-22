import { safeStorage } from 'electron'
import { mkdir, writeFile, rename, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

/** 凭据仅由主进程保存；系统加密不可用时拒绝写入，不回退明文。 */
export class CredentialStore {
  constructor(private readonly directory: string) {}

  available(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async save(reference: 'feishu-secret' | 'model-secret', value: string): Promise<void> {
    if (!this.available()) throw new Error('系统凭据存储不可用')
    if (!value || value.length > 16384) throw new Error('凭据内容无效')
    const encrypted = safeStorage.encryptString(value)
    await mkdir(this.directory, { recursive: true })
    const target = join(this.directory, `${reference}.bin`)
    const temporary = `${target}.${randomUUID()}.tmp`
    await writeFile(temporary, encrypted, { mode: 0o600, flag: 'wx' })
    await rename(temporary, target)
  }

  async readForKernel(reference: 'feishu-secret' | 'model-secret'): Promise<string> {
    if (!this.available()) throw new Error('系统凭据存储不可用')
    return safeStorage.decryptString(await readFile(join(this.directory, `${reference}.bin`)))
  }
}
