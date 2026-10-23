import { open } from 'node:fs/promises'

/** pnpm 12可能返回无扩展名的Mach-O/ELF原生入口，不能按路径后缀一律交给Node。 */
export const pnpmInvocation = async (entry) => {
  if (!entry) throw new Error('请使用 pnpm kernel:assemble')
  const file = await open(entry, 'r')
  let header
  try {
    const bytes = Buffer.alloc(256)
    const { bytesRead } = await file.read(bytes, 0, bytes.length, 0)
    header = bytes.subarray(0, bytesRead)
  } finally {
    await file.close()
  }
  const signature = header.subarray(0, 4).toString('hex')
  const native =
    signature.startsWith('4d5a') ||
    [
      '7f454c46',
      'feedface',
      'cefaedfe',
      'feedfacf',
      'cffaedfe',
      'cafebabe',
      'bebafeca',
      'cafebabf',
      'bfbafeca',
    ].includes(signature)
  if (native) return { command: entry, prefix: [] }
  const shebang = header.toString('utf8').split('\n')[0]
  if (/\.(?:c|m)?js$/i.test(entry) || /^#!.*\bnode(?:js)?(?:\s|$)/.test(shebang))
    return { command: process.execPath, prefix: [entry] }
  // 不通过shell执行cmd/任意文本包装器，也不把未知二进制作为JavaScript解析。
  throw new Error('无法识别pnpm入口；请使用锁定的官方pnpm工具链')
}
