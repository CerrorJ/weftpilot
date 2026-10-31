import { execFileSync, spawnSync } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hashBytes } from './release-inputs.mjs'
import { verifyPackagedKernel } from './verify-packaged-kernel.mjs'

/** 仅为新建本机开发包补齐应用级ad-hoc签名，不使用证书、私钥、时间戳或公证服务。 */
export const signDevelopmentApp = async ({ appPath, kernel, applicationId }) => {
  if (process.platform !== 'darwin') throw new Error('开发应用签名仅在本机macOS执行')
  const payload = join(appPath, 'Contents/Resources/app/dist')
  await verifyPackagedKernel(payload, kernel, { hostLock: true })
  const before = await payloadDigests(payload)
  execFileSync(
    '/usr/bin/codesign',
    [
      '--force',
      '--deep',
      '--sign',
      '-',
      '--timestamp=none',
      '--preserve-metadata=entitlements,flags',
      appPath,
    ],
    { stdio: 'inherit', timeout: 120000 },
  )
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
    stdio: 'inherit',
    timeout: 30000,
  })
  assertDevelopmentIdentity(appPath, applicationId)
  if (JSON.stringify(await payloadDigests(payload)) !== JSON.stringify(before))
    throw new Error('开发签名改变了应用载荷，拒绝作为可用包')
  await verifyPackagedKernel(payload, kernel, { hostLock: true })
  return {
    formatVersion: 1,
    kind: 'development-adhoc',
    applicationId,
    strictVerified: true,
    payloadUnchanged: true,
    payloadFiles: before.length,
    payloadSha256: hashBytes(Buffer.from(JSON.stringify(before))),
    kernelCommit: kernel.sourceCommit,
    kernelSha256: kernel.sha256,
  }
}

const assertDevelopmentIdentity = (appPath, applicationId) => {
  const result = spawnSync('/usr/bin/codesign', ['-dv', '--verbose=4', appPath], {
    encoding: 'utf8',
    timeout: 30000,
  })
  const lines = result.stderr?.split('\n') ?? []
  if (
    result.status !== 0 ||
    !lines.includes(`Identifier=${applicationId}`) ||
    !lines.includes('Signature=adhoc')
  )
    throw new Error('开发包签名身份与应用身份不一致')
}

const payloadDigests = async (root, prefix = '') => {
  const result = []
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const local = `${prefix}${entry.name}`
    if (entry.isDirectory()) result.push(...(await payloadDigests(root, `${local}/`)))
    else if (entry.isFile()) result.push([local, hashBytes(await readFile(join(root, local)))])
    else throw new Error('开发包载荷包含非普通文件')
  }
  return result.sort(([left], [right]) => left.localeCompare(right, 'en'))
}
