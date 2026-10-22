import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** 本地发行候选也必须可追踪到干净提交，不能把相邻仓库/缓存当源码来源。 */
export const releaseInputs = async () => {
  const sourceCommit = sourceRevision()
  const metadata = JSON.parse(await readFile('package.json', 'utf8'))
  const kernel = JSON.parse(await readFile('config/kernel-lock.json', 'utf8'))
  const builtLock = JSON.parse(await readFile('dist/kernel-lock.json', 'utf8'))
  if (JSON.stringify(kernel) !== JSON.stringify(builtLock))
    throw new Error('桌面内核锁已过期，请重新构建')
  for (const [file, digest] of Object.entries(kernel.files)) {
    if (hashBytes(await readFile(join('dist/kernel', file))) !== digest)
      throw new Error(`内核产物摘要不一致：${file}`)
  }
  return { sourceCommit, metadata, kernel }
}

export const sourceRevision = () => {
  const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
  if (git(['status', '--porcelain']))
    throw new Error('发行装配需要干净提交，请先完成并提交当前改动')
  return git(['rev-parse', 'HEAD'])
}

export const hashBytes = (bytes) => createHash('sha256').update(bytes).digest('hex')
