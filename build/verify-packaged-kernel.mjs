import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { hashBytes } from './release-inputs.mjs'

/** 在builder完成过滤/复制后核对，不能以打包前dist正确代替实际包正确。 */
export const verifyPackagedKernel = async (root, kernel) => {
  const lock = JSON.parse(await readFile(join(root, 'kernel-lock.json'), 'utf8'))
  if (JSON.stringify(lock) !== JSON.stringify(kernel))
    throw new Error('安装器中的内核锁与构建输入不一致')
  const actual = (await listFiles(join(root, 'kernel'))).sort()
  if (JSON.stringify(actual) !== JSON.stringify(Object.keys(kernel.files).sort()))
    throw new Error('安装器遗漏或携带非锁定内核文件')
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
