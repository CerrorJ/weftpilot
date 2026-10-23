import { verifyReleaseDirectory } from '../packages/release-assembly/manifest.ts'

if (!process.argv[2]) throw new Error('请提供本地安装器装配目录')
const manifest = await verifyReleaseDirectory(process.argv[2])
console.log(
  `安装器与更新材料摘要通过：${manifest.appId} ${manifest.version} ${manifest.platform}/${manifest.arch}`,
)
console.log(
  `桌面 ${manifest.sourceCommit}；内核 ${manifest.kernelVersion}/${manifest.kernelCommit}；协议 ${manifest.protocolVersion}/schema ${manifest.dataSchemaVersion}`,
)
console.log('本地未签名材料；原生验收以单独验收记录为准。此命令不执行安装或发布。')
