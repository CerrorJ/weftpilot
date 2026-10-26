import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'

/** 损坏的嵌套 Git 缓存可能向上发现桌面仓库，任何检出前先核对真实根目录。 */
export const assertKernelSource = (source) => {
  const git = (args) =>
    execFileSync('git', args, { cwd: source, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const root = git(['rev-parse', '--show-toplevel']).trim()
  // Windows短名不能把同一物理根误判成外来仓库，仍严格拒绝向上发现父仓。
  if (realpathSync.native(resolve(root)) !== realpathSync.native(source))
    throw new Error('内核缓存不是独立 Git 仓库，拒绝检出；请保留现场后重建缓存')
  git(['rev-parse', '--verify', 'HEAD^{commit}'])
  if (git(['status', '--porcelain']).trim()) throw new Error('内核构建检出包含改动，拒绝装配')
}
