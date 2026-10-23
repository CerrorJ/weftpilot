import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID, createHash } from 'node:crypto'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  releaseManifestSchema,
  verifyReleaseDirectory,
} from '../packages/release-assembly/manifest'

const fixtureManifest = () => ({
  formatVersion: 1,
  operationId: randomUUID(),
  sourceCommit: 'a'.repeat(40),
  version: '0.0.1',
  platform: 'win32',
  arch: 'x64',
  validation: true,
  kernelVersion: '0.5.8',
  kernelCommit: 'b'.repeat(40),
  protocolVersion: 1,
  dataSchemaVersion: 7,
  kernelSha256: 'c'.repeat(64),
  signing: 'unsigned',
  nativeValidation: 'pending',
  createdAt: new Date().toISOString(),
  appId: 'io.weftpilot.desktop.validation',
  artifacts: [
    {
      file: 'WeftPilotValidation-0.0.1-win-x64.exe',
      size: 3,
      sha256: createHash('sha256').update('abc').digest('hex'),
    },
  ],
})

test('发行输入拒绝路径遍历、重复文件和身份/平台/版本混淆，不以兼容元数据自动执行程序', () => {
  const valid = fixtureManifest()
  assert.equal(releaseManifestSchema.safeParse(valid).success, true)
  for (const modified of [
    { ...valid, appId: 'io.weftpilot.desktop' },
    { ...valid, version: '0.0.2' },
    { ...valid, platform: 'darwin' },
    { ...valid, protocolVersion: 2 },
    { ...valid, artifacts: [...valid.artifacts, ...valid.artifacts] },
    { ...valid, artifacts: [{ ...valid.artifacts[0], file: '../outside.exe' }] },
  ])
    assert.equal(releaseManifestSchema.safeParse(modified).success, false)
})

test('实际本地更新材料逐文件摘要核对，损坏明确失败；仅校验不执行合成exe', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-release-integrity-'))
  const manifest = fixtureManifest()
  try {
    await writeFile(join(directory, 'release-manifest.json'), JSON.stringify(manifest))
    await writeFile(join(directory, manifest.artifacts[0]!.file), 'abc')
    assert.deepEqual(await verifyReleaseDirectory(directory), manifest)
    await writeFile(join(directory, manifest.artifacts[0]!.file), 'xyz')
    await assert.rejects(verifyReleaseDirectory(directory), /RELEASE_DIGEST_MISMATCH/)
    await writeFile(
      join(directory, 'release-manifest.json'),
      JSON.stringify({ ...manifest, signing: 'trusted' }),
    )
    await assert.rejects(verifyReleaseDirectory(directory), /RELEASE_MANIFEST_INVALID/)
    await writeFile(join(directory, 'release-manifest.json'), 'broken synthetic json')
    await assert.rejects(verifyReleaseDirectory(directory), /RELEASE_MANIFEST_INVALID/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
