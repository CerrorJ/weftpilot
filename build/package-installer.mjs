import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installerConfiguration, installerEnvironment } from './installer-config.mjs'
import { releaseInputs, sourceRevision, hashBytes } from './release-inputs.mjs'

const args = process.argv.slice(2)
const worker = args.includes('--worker')
const validation = args.includes('--validation')
const value = (flag) => {
  if (!args.includes(flag)) return undefined
  const result = args[args.indexOf(flag) + 1]
  if (!result || result.startsWith('--')) throw new Error(`参数缺少值：${flag}`)
  return result
}
if (!['win32', 'darwin'].includes(process.platform))
  throw new Error('首版安装包只装配本机Windows/macOS平台')
if (
  args.some(
    (arg, index) =>
      !['--worker', '--validation', '--output', '--validation-version'].includes(arg) &&
      !['--output', '--validation-version'].includes(args[index - 1]),
  )
)
  throw new Error('未知安装装配参数')

if (!worker) await startWorker()
else await assembleInstaller()

async function startWorker() {
  // 不加载electron-builder.env，不继承模型、飞书、发布或签名秘密。
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...args, '--worker'], {
    env: installerEnvironment(process.env),
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  })
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', resolve)
  })
  if (code !== 0) process.exitCode = 1
}

async function assembleInstaller() {
  const operationId = randomUUID()
  const initialRevision = sourceRevision()
  execFileSync(process.execPath, ['build/build-desktop.mjs'], { stdio: 'inherit' })
  const { sourceCommit, metadata, kernel } = await releaseInputs()
  if (sourceCommit !== initialRevision) throw new Error('构建期间源码提交变化，拒绝装配')
  const version = value('--validation-version') ?? metadata.version
  if (!/^\d+\.\d+\.\d+$/.test(version) || (!validation && version !== metadata.version))
    throw new Error('只有隔离验收安装器允许明确的合成版本号')
  const output = resolve(
    value('--output') ?? `.tmp/installers/${sourceCommit.slice(0, 10)}-${operationId}`,
  )
  if (existsSync(output)) throw new Error('安装器输出目录已存在，拒绝覆盖')
  await mkdir(output, { recursive: true })
  const context = assemblyProvenance({ operationId, sourceCommit, version, kernel })
  await writeFile(
    join(output, 'assembly-intent.json'),
    JSON.stringify({ ...context, phase: 'preparing' }, null, 2),
    { flag: 'wx', flush: true },
  )
  const appDirectory = resolve(`.kernel/installer-app-${operationId}`)
  const icons = resolve(`.kernel/installer-icons-${operationId}`)
  await prepareApp({ appDirectory, icons, metadata, version, validation })
  const { build } = await import('electron-builder')
  const config = installerConfiguration({ output, appDirectory, icons, validation })
  config.electronDist = join(
    dirname(createRequire(import.meta.url).resolve('electron/package.json')),
    'dist',
  )
  const artifacts = await build({ config, publish: 'never' })
  const files = await artifactDigests(output, artifacts)
  await writeFile(
    join(output, 'release-manifest.json'),
    JSON.stringify(
      {
        formatVersion: 1,
        ...context,
        createdAt: new Date().toISOString(),
        appId: config.appId,
        artifacts: files,
      },
      null,
      2,
    ),
    { flag: 'wx', flush: true },
  )
  console.log(`未签名本地安装器与更新清单：${output}`)
}

function assemblyProvenance({ operationId, sourceCommit, version, kernel }) {
  return {
    operationId,
    sourceCommit,
    version,
    platform: process.platform,
    arch: process.arch,
    validation,
    kernelVersion: kernel.kernelVersion,
    kernelCommit: kernel.sourceCommit,
    protocolVersion: kernel.protocolVersion,
    dataSchemaVersion: kernel.dataSchemaVersion,
    kernelSha256: kernel.sha256,
    signing: 'unsigned',
    nativeValidation: 'pending',
  }
}

async function prepareApp({ appDirectory, icons, metadata, version, validation }) {
  await mkdir(appDirectory, { recursive: true })
  await cp('dist', join(appDirectory, 'dist'), { recursive: true })
  const appMetadata = {
    name: validation ? 'weftpilot-validation' : metadata.name,
    productName: validation ? 'WeftPilotValidation' : 'WeftPilot',
    version,
    description: '纬舟 WeftPilot 本机 AI 团队工作台',
    main: 'dist/main.cjs',
    private: true,
  }
  await writeFile(join(appDirectory, 'package.json'), JSON.stringify(appMetadata, null, 2), {
    flag: 'wx',
  })
  const electron = createRequire(import.meta.url)('electron')
  execFileSync(electron, ['build/render-icons.mjs', icons], { stdio: 'inherit', timeout: 30_000 })
}

async function artifactDigests(output, artifacts) {
  const files = []
  for (const path of artifacts) {
    const name = relative(output, path).replaceAll('\\', '/')
    if (name.startsWith('..') || !/\.(exe|dmg|zip|blockmap)$/.test(name)) continue
    const bytes = await readFile(path)
    files.push({ file: name, size: bytes.length, sha256: hashBytes(bytes) })
  }
  if (!files.some((file) => /\.(exe|dmg)$/.test(file.file)))
    throw new Error(`未生成可验收的安装器：${(await readdir(output)).length}个输出文件`)
  return files
}
