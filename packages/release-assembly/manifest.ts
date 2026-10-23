import { z } from 'zod'
import { lstat, readFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const commit = z.string().regex(/^[a-f0-9]{40}$/)
const version = z
  .string()
  .max(32)
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
export const releaseManifestSchema = z
  .object({
    formatVersion: z.literal(1),
    operationId: z.string().uuid(),
    sourceCommit: commit,
    version,
    platform: z.enum(['win32', 'darwin']),
    arch: z.enum(['x64', 'arm64']),
    validation: z.boolean(),
    kernelVersion: version,
    kernelCommit: commit,
    protocolVersion: z.literal(1),
    dataSchemaVersion: z.number().int().positive(),
    kernelSha256: sha256,
    signing: z.literal('unsigned'),
    nativeValidation: z.literal('pending'),
    createdAt: z.string().datetime(),
    appId: z.enum(['io.weftpilot.desktop', 'io.weftpilot.desktop.validation']),
    artifacts: z
      .array(
        z
          .object({
            file: z
              .string()
              .max(200)
              .regex(/^[A-Za-z0-9._-]+$/),
            size: z.number().int().positive().max(4_294_967_295),
            sha256,
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict()
  .superRefine((manifest, context) => {
    const name = manifest.validation ? 'WeftPilotValidation' : 'WeftPilot'
    const appId = manifest.validation ? 'io.weftpilot.desktop.validation' : 'io.weftpilot.desktop'
    const platform = manifest.platform === 'win32' ? 'win' : 'mac'
    const prefix = `${name}-${manifest.version}-${platform}-${manifest.arch}`
    const suffixes =
      manifest.platform === 'win32'
        ? ['.exe', '.exe.blockmap']
        : ['.dmg', '.zip', '.dmg.blockmap', '.zip.blockmap']
    const allowed = new Set(suffixes.map((suffix) => prefix + suffix))
    const names = manifest.artifacts.map((artifact) => artifact.file)
    const installerPresent = names.includes(
      prefix + (manifest.platform === 'win32' ? '.exe' : '.dmg'),
    )
    if (
      manifest.appId !== appId ||
      new Set(names).size !== names.length ||
      !installerPresent ||
      names.some((file) => !allowed.has(file))
    )
      context.addIssue({ code: 'custom', message: '发行身份、平台、版本或文件集合不一致' })
  })

export type ReleaseManifest = z.infer<typeof releaseManifestSchema>

/** 仅验证本地装配材料，不执行安装器，也不将摘要一致当作签名或来源信任。 */
export const verifyReleaseDirectory = async (directory: string): Promise<ReleaseManifest> => {
  const manifestPath = join(directory, 'release-manifest.json')
  const information = await lstat(manifestPath)
  if (!information.isFile() || information.isSymbolicLink() || information.size > 1_000_000)
    throw new Error('RELEASE_MANIFEST_INVALID')
  const parsed = releaseManifestSchema.safeParse(await readManifestJson(manifestPath))
  if (!parsed.success) throw new Error('RELEASE_MANIFEST_INVALID')
  for (const artifact of parsed.data.artifacts) {
    const path = join(directory, artifact.file)
    const file = await lstat(path)
    if (
      !file.isFile() ||
      file.isSymbolicLink() ||
      file.size !== artifact.size ||
      (await digestFile(path)) !== artifact.sha256
    )
      throw new Error('RELEASE_DIGEST_MISMATCH')
  }
  return parsed.data
}

const readManifestJson = async (path: string): Promise<unknown> => {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown
  } catch {
    throw new Error('RELEASE_MANIFEST_INVALID')
  }
}

const digestFile = async (path: string): Promise<string> => {
  const hash = createHash('sha256')
  for await (const bytes of createReadStream(path)) hash.update(bytes)
  return hash.digest('hex')
}
