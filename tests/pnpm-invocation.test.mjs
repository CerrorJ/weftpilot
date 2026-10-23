import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile, rm, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, basename } from 'node:path'
import { pnpmInvocation } from '../build/pnpm-invocation.mjs'

const removeFixture = async (directory, prefix) => {
  assert.equal(dirname(await realpath(directory)), await realpath(tmpdir()))
  assert.ok(basename(directory).startsWith(prefix))
  await rm(directory, { recursive: true, force: true })
}

test('真实原生进程直接运行，参数保留且不经过shell', async () => {
  const invocation = await pnpmInvocation(process.execPath)
  assert.equal(invocation.command, process.execPath)
  assert.deepEqual(invocation.prefix, [])
  const args = ['中文 space #', '$(must-not-execute)', 'a;b']
  const actual = execFileSync(
    invocation.command,
    [...invocation.prefix, '-p', 'JSON.stringify(process.argv.slice(1))', '--', ...args],
    { shell: false, encoding: 'utf8' },
  )
  assert.deepEqual(JSON.parse(actual), args)
})

test('JS与无扩展名Node包装器仍使用当前Node，中文空格路径可执行', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-pnpm-'))
  try {
    for (const name of ['中文 wrapper #.cjs', 'pnpm']) {
      const entry = join(directory, name)
      await writeFile(
        entry,
        '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)))',
      )
      const invocation = await pnpmInvocation(entry)
      assert.equal(invocation.command, process.execPath)
      const result = execFileSync(invocation.command, [...invocation.prefix, 'literal space #'], {
        shell: false,
        encoding: 'utf8',
      })
      assert.deepEqual(JSON.parse(result), ['literal space #'])
    }
  } finally {
    await removeFixture(directory, 'weftpilot-pnpm-')
  }
})

test('无扩展名Mach-O/ELF入口不交给Node；未知包装器与缺少入口明确拒绝', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-pnpm-header-'))
  try {
    const entry = join(directory, 'pnpm')
    for (const signature of ['cffaedfe', 'feedfacf', 'cafebabe', 'cafebabf', '7f454c46']) {
      await writeFile(entry, Buffer.from(signature, 'hex'))
      assert.deepEqual(await pnpmInvocation(entry), { command: entry, prefix: [] })
    }
    await writeFile(entry, '@echo off\r\n')
    await assert.rejects(pnpmInvocation(entry), /无法识别pnpm入口/)
    await assert.rejects(pnpmInvocation(undefined), /请使用 pnpm/)
  } finally {
    await removeFixture(directory, 'weftpilot-pnpm-header-')
  }
})
