import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'

// 显式开发操作，发行构建只使用 assemble，不隐式读取相邻源码。
if (!process.argv[2]) throw new Error('请提供已经提交并构建产物的内核检出目录')
const source = resolve(process.argv[2])
const git = (args) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim()
if (git(['status', '--porcelain'])) throw new Error('内核检出不干净，拒绝更新锁定')
const manifest = JSON.parse(await readFile(`${source}/dist-kernel/manifest.json`, 'utf8'))
if (git(['rev-parse', 'HEAD']) !== manifest.sourceCommit)
  throw new Error('内核构建早于当前提交，请重新构建')
const digest = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex')
const files = {}
const collect = async (directory) => {
  for (const entry of await readdir(`${source}/dist-kernel/${directory}`, {
    withFileTypes: true,
  })) {
    const path = `${directory}${entry.name}`
    if (entry.isDirectory()) await collect(`${path}/`)
    else files[path] = await digest(`${source}/dist-kernel/${path}`)
  }
}
await collect('')
const artifact = `weftpilot-agent-team-kernel-${manifest.kernelVersion}.tgz`
const lock = {
  repository: 'https://github.com/CerrorJ/Agent-Team.git',
  ...manifest,
  artifact,
  sha256: await digest(`${source}/artifacts/${artifact}`),
  files,
}
await writeFile('config/kernel-lock.json.tmp', JSON.stringify(lock, null, 2) + '\n', { flag: 'wx' })
await rename('config/kernel-lock.json.tmp', 'config/kernel-lock.json')
console.log(`锁定已提交内核 ${manifest.sourceCommit}`)
