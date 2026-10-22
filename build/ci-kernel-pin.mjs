import { appendFile, readFile } from 'node:fs/promises'

const pin = JSON.parse(await readFile('config/kernel-lock.json', 'utf8'))
if (!/^[a-f0-9]{40}$/.test(pin.sourceCommit)) throw new Error('内核锁定提交无效')
if (!process.env.AGENT_TEAM_READ_TOKEN) {
  throw new Error(
    '缺少 AGENT_TEAM_READ_TOKEN：请为 CI 配置仅能读取 Agent-Team Contents 的专用凭据，不得复制开发者登录凭据',
  )
}
if (!process.env.GITHUB_OUTPUT) throw new Error('此命令仅用于 GitHub Actions')
await appendFile(process.env.GITHUB_OUTPUT, `commit=${pin.sourceCommit}\n`)
