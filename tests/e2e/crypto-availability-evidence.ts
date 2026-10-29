import { mkdir, writeFile } from 'node:fs/promises'
import type { ElectronApplication } from 'playwright'

/** 仅在失败后观察公开可用性；不读取密钥、用户目录或重试原始写入。 */
export const recordCryptoAvailability = async (application: ElectronApplication): Promise<void> => {
  const observation = await application.evaluate(({ app, safeStorage }) => ({
    observedAt: new Date().toISOString(),
    phase: 'after-backup-test-credential-failure',
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    applicationReady: app.isReady(),
    applicationName: app.getName(),
    encryptionAvailable: safeStorage.isEncryptionAvailable(),
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    },
  }))
  await mkdir('.tmp/evidence', { recursive: true })
  await writeFile(
    `.tmp/evidence/credential-availability-${observation.platform}-${observation.pid}.json`,
    JSON.stringify(observation, null, 2) + '\n',
    { flag: 'wx' },
  )
}
