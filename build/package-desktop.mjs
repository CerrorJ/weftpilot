import { packager } from '@electron/packager'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const output = process.argv[2] ?? 'release'
if (existsSync(join(output, `WeftPilot-${process.platform}-${process.arch}`)))
  throw new Error('应用目录已存在，拒绝覆盖；请指定新的输出目录保留原验收现场')

const paths = await packager({
  dir: '.kernel/desktop-app',
  out: output,
  name: 'WeftPilot',
  executableName: 'WeftPilot',
  appBundleId: 'io.weftpilot.desktop',
  electronVersion: '42.0.0',
  overwrite: false,
  prune: true,
  asar: false,
  platform: process.platform,
  arch: process.arch,
})
console.log(paths.join('\n'))
