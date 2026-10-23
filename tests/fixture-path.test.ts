import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, symlink, realpath, rm } from 'node:fs/promises'
import { join, relative, isAbsolute } from 'node:path'
import { tmpdir } from 'node:os'
import { createFixture } from './e2e/workflow-helpers'

test('真实Git夹具在TEMP目录别名下仍返回内核使用的规范路径', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-temp-alias-'))
  const target = join(directory, '实际 temp #')
  const alias = join(directory, 'alias temp')
  const key = process.platform === 'win32' ? 'TEMP' : 'TMPDIR'
  const previous = process.env[key]
  let fixture: Awaited<ReturnType<typeof createFixture>> | undefined
  try {
    await mkdir(target)
    await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
    process.env[key] = alias
    fixture = await createFixture()
    assert.equal(fixture.directory, await realpath(fixture.directory))
    assert.equal(fixture.repository, await realpath(fixture.repository))
    const local = relative(await realpath(target), fixture.directory)
    assert.ok(local && !local.startsWith('..') && !isAbsolute(local))
  } finally {
    if (previous === undefined) delete process.env[key]
    else process.env[key] = previous
    await fixture?.cleanup()
    // 仅删除本次新建的temp父目录及其内部自有链接/夹具，不触及其他测试或用户数据。
    await rm(directory, { recursive: true, force: true })
  }
})
