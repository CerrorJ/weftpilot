import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { setImmediate as nextTurn } from 'node:timers/promises'
import { test } from 'node:test'
import { ProjectClipboard } from '../apps/desktop/main/project-clipboard'

const projectId = randomUUID()
const input = { projectId, projectVersion: 1, gitUrl: 'https://example.invalid/a.git' }
const report = (patch: Record<string, unknown> = {}) => ({
  formatVersion: 1,
  projectId,
  projectVersion: 1,
  repositoryPath: '/synthetic/repository',
  defaultBranch: 'main',
  gitUrl: input.gitUrl,
  checkedAt: '2026-10-26T00:00:00.000Z',
  git: {
    state: 'verified',
    dirty: false,
    currentBranch: 'main',
    currentCommit: 'a'.repeat(40),
    defaultCommit: 'a'.repeat(40),
  },
  ...patch,
})
type Ports = ConstructorParameters<typeof ProjectClipboard>[0]
const fixture = (overrides: Partial<Ports> = {}) => {
  const writes: string[] = []
  const inspected: string[] = []
  let value = ''
  const copy = new ProjectClipboard({
    inspect: async (id) => {
      inspected.push(id)
      return report()
    },
    write: (text) => {
      writes.push(text)
      value = text
    },
    read: () => value,
    ...overrides,
  })
  return { copy, writes, inspected, value: () => value }
}
const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const authorized = () => undefined

test('剪贴板命名输入严格校验：坏UUID/版本/空地址/额外路径不查询或写系统', async () => {
  const f = fixture()
  for (const invalid of [
    { ...input, projectId: 'not-a-uuid' },
    { ...input, projectVersion: 0 },
    { ...input, gitUrl: '' },
    { ...input, gitUrl: 'a'.repeat(4097) },
    { ...input, path: '/arbitrary' },
    { ...input, html: '<script>synthetic</script>' },
  ])
    await assert.rejects(f.copy.copy(invalid, authorized), /INPUT_INVALID/)
  assert.deepEqual(f.inspected, [])
  assert.deepEqual(f.writes, [])
})

test('只复制内核匹配的项目地址并核对系统读回；已登记地址不依赖仓库当前可用', async () => {
  for (const git of [report().git, { state: 'unavailable', code: 'GIT_ROOT_REQUIRED' }]) {
    const f = fixture({ inspect: async () => report({ git }) })
    assert.deepEqual(await f.copy.copy(input, authorized), { ...input, copied: true })
    assert.deepEqual(f.writes, [input.gitUrl])
    assert.equal(f.value(), input.gitUrl)
  }
})

test('错误回执/项目/版本/地址与不可用标记均拒绝，不把任意文本当Git地址', async () => {
  const cases = [
    { result: {}, error: /COMMAND_RESULT_UNCERTAIN/ },
    { result: report({ projectId: randomUUID() }), error: /COMMAND_RESULT_UNCERTAIN/ },
    { result: report({ projectVersion: 2 }), error: /PROJECT_GIT_COPY_STALE/ },
    {
      result: report({ gitUrl: 'https://example.invalid/new.git' }),
      error: /PROJECT_GIT_COPY_STALE/,
    },
    { result: report({ gitUrl: '' }), error: /PROJECT_GIT_COPY_UNAVAILABLE/ },
    { result: report({ gitUrl: '[invalid remote URL]' }), error: /PROJECT_GIT_COPY_UNAVAILABLE/ },
  ]
  for (const item of cases) {
    const f = fixture({ inspect: async () => item.result })
    await assert.rejects(f.copy.copy(input, authorized), item.error)
    assert.deepEqual(f.writes, [])
  }
})

test('异步查询后重新核对顶层发送者，离开原窗口不能再写剪贴板', async () => {
  const gate = deferred<unknown>()
  const f = fixture({ inspect: () => gate.promise })
  let allowed = true
  const copying = f.copy.copy(input, () => {
    if (!allowed) throw new Error('SENDER_INVALID')
  })
  const rejected = assert.rejects(copying, /SENDER_INVALID/)
  allowed = false
  gate.resolve(report())
  await rejected
  assert.deepEqual(f.writes, [])
})

test('迟到的旧查询不得覆盖已完成的新复制，只有新请求有成功回执', async () => {
  const gate = deferred<unknown>()
  const second = { ...input, projectId: randomUUID(), gitUrl: 'https://example.invalid/b.git' }
  const f = fixture({ inspect: async (id) => (id === projectId ? gate.promise : report(second)) })
  const old = assert.rejects(f.copy.copy(input, authorized), /PROJECT_GIT_COPY_SUPERSEDED/)
  assert.deepEqual(await f.copy.copy(second, authorized), { ...second, copied: true })
  gate.resolve(report())
  await old
  assert.deepEqual(f.writes, [second.gitUrl])
})

test('已开始的原生写入不可撤销：串行收尾后新复制最终生效，不并发覆盖', async () => {
  const started = deferred<void>()
  const release = deferred<void>()
  const second = { ...input, projectId: randomUUID(), gitUrl: 'https://example.invalid/b.git' }
  let value = ''
  const writes: string[] = []
  const f = fixture({
    inspect: async (id) => report(id === projectId ? input : second),
    write: async (text) => {
      if (text === input.gitUrl) {
        started.resolve()
        await release.promise
      }
      writes.push(text)
      value = text
    },
    read: () => value,
  })
  const old = assert.rejects(f.copy.copy(input, authorized), /PROJECT_GIT_COPY_SUPERSEDED/)
  await started.promise
  const current = f.copy.copy(second, authorized)
  await nextTurn()
  assert.deepEqual(writes, [])
  release.resolve()
  assert.deepEqual(await current, { ...second, copied: true })
  await old
  assert.deepEqual(writes, [input.gitUrl, second.gitUrl])
  assert.equal(value, second.gitUrl)
})

test('系统写入失败/读回不符不泄露原剪贴板，失败释放队列供下一次显式操作', async () => {
  for (const mode of ['write-error', 'mismatch']) {
    let failed = true
    let value = ''
    const f = fixture({
      write: (text) => {
        if (failed && mode === 'write-error') throw new Error('synthetic-private-clipboard')
        value = text
      },
      read: () => (failed ? 'synthetic-private-clipboard' : value),
    })
    await assert.rejects(
      f.copy.copy(input, authorized),
      (error) => error instanceof Error && error.message === 'PROJECT_GIT_COPY_FAILED',
    )
    failed = false
    assert.deepEqual(await f.copy.copy(input, authorized), { ...input, copied: true })
  }
})
