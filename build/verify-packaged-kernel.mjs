import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { hashBytes } from './release-inputs.mjs'

/** 在builder完成过滤/复制后核对，不能以打包前dist正确代替实际包正确。 */
export const verifyPackagedKernel = async (root, kernel, { hostLock = false } = {}) => {
  const lock = JSON.parse(await readFile(join(root, 'kernel-lock.json'), 'utf8'))
  if (JSON.stringify(lock) !== JSON.stringify(kernel))
    throw new Error('安装器中的内核锁与构建输入不一致')
  const actual = (await listFiles(join(root, 'kernel'))).sort()
  const expected = [
    ...Object.keys(kernel.files),
    ...(hostLock ? ['artifact-lock.json'] : []),
  ].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error('安装器遗漏或携带非锁定内核文件')
  // 开发应用目录附带宿主锁，安装器不带；允许时也必须与外锁逐字段相等。
  if (hostLock) {
    const host = JSON.parse(await readFile(join(root, 'kernel/artifact-lock.json'), 'utf8'))
    if (JSON.stringify(host) !== JSON.stringify(kernel)) throw new Error('宿主内核锁不一致')
  }
  for (const [file, digest] of Object.entries(kernel.files)) {
    if (hashBytes(await readFile(join(root, 'kernel', file))) !== digest)
      throw new Error(`安装器内核摘要不一致：${file}`)
  }
}

const listFiles = async (root, prefix = '') => {
  const files = []
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const local = `${prefix}${entry.name}`
    if (entry.isDirectory()) files.push(...(await listFiles(root, `${local}/`)))
    else if (entry.isFile()) files.push(local)
    else throw new Error('安装器包含非法内核文件类型')
  }
  return files
}
