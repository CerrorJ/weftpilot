import { packager } from '@electron/packager'

const paths = await packager({
  dir: '.kernel/desktop-app',
  out: 'release',
  name: 'WeftPilot',
  executableName: 'WeftPilot',
  appBundleId: 'io.weftpilot.desktop',
  electronVersion: '42.0.0',
  overwrite: true,
  prune: true,
  asar: false,
  platform: process.platform,
  arch: process.arch,
})
console.log(paths.join('\n'))
