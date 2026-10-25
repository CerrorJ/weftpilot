import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pnpmInvocation } from './pnpm-invocation.mjs'
import { assertKernelSource } from './kernel-source-state.mjs'

const lock = JSON.parse(await readFile('config/kernel-lock.json', 'utf8'))
const root = resolve('.kernel')
const source = resolve(root, 'source')
const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: false })
const pnpm = await pnpmInvocation(process.env.npm_execpath)
const runPnpm = (args) => run(pnpm.command, [...pnpm.prefix, ...args], source)
await mkdir(root, { recursive: true })
if (!existsSync(`${source}/.git`)) run('git', ['clone', lock.repository, source], root)
assertKernelSource(source)
// CI 通过有范围的 checkout 提供私有源码，不保存 token；已有固定对象时无需再联网。
try {
  execFileSync('git', ['cat-file', '-e', `${lock.sourceCommit}^{commit}`], {
    cwd: source,
    stdio: 'ignore',
  })
} catch {
  run('git', ['fetch', 'origin', lock.sourceCommit], source)
}
run('git', ['checkout', '--detach', lock.sourceCommit], source)
if (execFileSync('git', ['status', '--porcelain'], { cwd: source, encoding: 'utf8' }).trim()) {
  throw new Error('内核构建检出包含改动，拒绝装配')
}
runPnpm(['install', '--frozen-lockfile'])
runPnpm(['build:kernel'])
// npm pack 的 tarball 记录规范化时间戳，可重复重建同一固定源码产物。
const npmEntry = [
  resolve(process.execPath, '..', 'node_modules/npm/bin/npm-cli.js'),
  resolve(process.execPath, '../..', 'lib/node_modules/npm/bin/npm-cli.js'),
].find((path) => existsSync(path))
if (!npmEntry) throw new Error('未找到 Node 随附的 npm CLI，请使用锁定的官方 Node 工具链')
run(process.execPath, [npmEntry, 'pack', '--pack-destination', root], `${source}/dist-kernel`)
const archive = resolve(root, lock.artifact)
const digest = createHash('sha256')
  .update(await readFile(archive))
  .digest('hex')
if (digest !== lock.sha256) throw new Error('内核产物 SHA-256 不匹配，拒绝装配')
const staging = resolve(root, 'staging')
await mkdir(staging, { recursive: true })
run('tar', ['-xf', archive, '-C', staging], root)
await writeFile(`${staging}/package/artifact-lock.json`, JSON.stringify(lock, null, 2) + '\n')
if (existsSync(`${root}/package`)) await rm(`${root}/package`, { recursive: true })
await rename(`${staging}/package`, `${root}/package`)
console.log(`已装配内核 ${lock.kernelVersion} / ${lock.sourceCommit}`)
