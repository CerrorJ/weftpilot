import { packager } from '@electron/packager'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { signDevelopmentApp } from './macos-development-signature.mjs'

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
if (process.platform === 'darwin') {
  const kernel = JSON.parse(await readFile('config/kernel-lock.json', 'utf8'))
  for (const directory of paths) {
    const signature = await signDevelopmentApp({
      appPath: join(directory, 'WeftPilot.app'),
      kernel,
      applicationId: 'io.weftpilot.desktop',
    })
    await writeFile(
      join(directory, 'development-signature.json'),
      JSON.stringify(signature, null, 2),
      {
        flag: 'wx',
        flush: true,
      },
    )
  }
  console.log('本机开发ad-hoc签名校验通过；不含正式证书或公证，不作为公开发行包')
}
console.log(paths.join('\n'))
