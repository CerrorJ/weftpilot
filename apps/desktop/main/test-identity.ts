import { createHash } from 'node:crypto'

/** macOS测试实例使用独立系统条目，避免不同程序路径/测试目录共享Keychain权限。
 * 只在显式测试数据目录下生效；正式名称、用户已有密文与Windows安装器身份不变。
 */
export const macOSTestName = (input: {
  platform: NodeJS.Platform
  testData: string | undefined
  executable: string
}): string | undefined => {
  if (input.platform !== 'darwin' || !input.testData) return undefined
  const identity = createHash('sha256')
    .update(JSON.stringify([input.executable, input.testData]))
    .digest('hex')
    .slice(0, 20)
  return `WeftPilot Test ${identity}`
}
