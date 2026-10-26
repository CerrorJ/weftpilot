import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, basename } from 'node:path'
import { assertKernelSource } from '../build/kernel-source-state.mjs'

const git = (directory, args) =>
  execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

test('真实 Git 缓存：拒绝向上发现父仓、损坏 HEAD 与已有改动，保留原文件及提交', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-kernel-source-'))
  try {
    git(directory, ['init'])
    git(directory, [
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '--allow-empty',
      '-m',
      'parent',
    ])
    const parentHead = git(directory, ['rev-parse', 'HEAD'])
    const source = join(directory, 'nested')
    await mkdir(source)
    assert.throws(() => assertKernelSource(source), /不是独立 Git 仓库/)
    await mkdir(join(source, '.git'))
    await writeFile(join(source, '.git', 'HEAD'), Buffer.alloc(41))
    assert.throws(() => assertKernelSource(source), /不是独立 Git 仓库/)
    await rm(join(source, '.git'), { recursive: true })
    git(source, ['init'])
    git(source, [
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '--allow-empty',
      '-m',
      'kernel',
    ])
    assert.doesNotThrow(() => assertKernelSource(source))
    await writeFile(join(source, 'user-change.txt'), '保留')
    assert.throws(() => assertKernelSource(source), /包含改动/)
    assert.equal(git(directory, ['rev-parse', 'HEAD']), parentHead)
    assert.match(git(source, ['status', '--porcelain']), /user-change\.txt/)
  } finally {
    assert.equal(dirname(await realpath(directory)), await realpath(tmpdir()))
    assert.ok(basename(directory).startsWith('weftpilot-kernel-source-'))
    await rm(directory, { recursive: true, force: true })
  }
})

test(
  'Windows原生8.3缓存路径与Git长路径属于同一独立仓，父仓保护不放宽',
  { skip: process.platform !== 'win32' },
  async (context) => {
    const directory = await mkdtemp(join(tmpdir(), '纬舟 native cache 中文 '))
    const parent = dirname(await realpath(directory))
    try {
      // 原生PowerShell的stdout码页不保证UTF-8；ASCII信封保留中文短名的原始字节。
      const encoded = execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '$taskFso = New-Object -ComObject Scripting.FileSystemObject; [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($taskFso.GetFolder($env:WEFTPILOT_CACHE_ROOT).ShortPath))',
        ],
        {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 15000,
          env: { ...process.env, WEFTPILOT_CACHE_ROOT: directory },
        },
      ).trim()
      const short = Buffer.from(encoded, 'base64').toString('utf8')
      assert.equal(await realpath(short), await realpath(directory))
      if (short === (await realpath(directory))) {
        context.skip('文件系统未提供8.3短名，不冒认已验证')
        return
      }
      const source = join(short, 'source')
      await mkdir(source)
      git(source, ['init'])
      git(source, [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.invalid',
        'commit',
        '--allow-empty',
        '-m',
        'source',
      ])
      assert.doesNotThrow(() => assertKernelSource(source))
      const nested = join(source, 'nested')
      await mkdir(nested)
      assert.throws(() => assertKernelSource(nested), /不是独立 Git 仓库/)
    } finally {
      assert.equal(dirname(await realpath(directory)), parent)
      assert.ok(basename(directory).startsWith('纬舟 native cache 中文 '))
      await rm(directory, { recursive: true, force: true })
    }
  },
)
