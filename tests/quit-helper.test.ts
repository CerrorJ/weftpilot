import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { setImmediate as nextTurn } from 'node:timers/promises'
import { test } from 'node:test'
import type { ElectronApplication } from 'playwright'
import { quit } from './e2e/workflow-helpers'

const contextLost = () =>
  new Error('Execution context was destroyed, most likely because of a navigation.')

test('受控退出响应丢失：上下文销毁和app.close不足以成功，仍需真实exit0信号', async () => {
  const fixture = quitFixture(contextLost())
  let completed = false
  const closing = quit(fixture.application).then(() => {
    completed = true
  })
  await nextTurn()
  assert.equal(completed, false)
  fixture.closed()
  await nextTurn()
  assert.equal(completed, false)
  fixture.exited(0)
  await closing
  assert.equal(completed, true)
})

test('受控正常菜单响应：只有进程exit0也不足以通过，还需应用close', async () => {
  const fixture = quitFixture()
  let completed = false
  const closing = quit(fixture.application).then(() => {
    completed = true
  })
  fixture.exited(0)
  await nextTurn()
  assert.equal(completed, false)
  fixture.closed()
  await closing
  assert.equal(completed, true)
})

for (const outcome of [
  { code: 1, signal: null },
  { code: null, signal: 'SIGTERM' as const },
])
  test(`受控退出响应丢失：${outcome.signal ?? outcome.code}退出仍失败`, async () => {
    const fixture = quitFixture(contextLost())
    const closing = quit(fixture.application)
    const rejected = assert.rejects(closing, /原生退出必须等待实际进程exit 0/)
    fixture.closed()
    fixture.exited(outcome.code, outcome.signal)
    await rejected
  })

test('其他RPC错误即使随后exit0也不能吞掉', async () => {
  const fixture = quitFixture(new Error('UNRELATED_RPC_FAILURE'))
  const rejected = assert.rejects(quit(fixture.application), /UNRELATED_RPC_FAILURE/)
  fixture.closed()
  fixture.exited(0)
  await rejected
})

test('非Error的上下文字符串不能绕过错误分类', async () => {
  const fixture = quitFixture('Execution context was destroyed')
  const rejected = assert.rejects(
    quit(fixture.application),
    (error) => error === 'Execution context was destroyed',
  )
  fixture.closed()
  fixture.exited(0)
  await rejected
})

/** 仅模拟测试控制传输与进程通知，不代表Electron、内核停机或macOS通过。 */
const quitFixture = (error?: unknown) => {
  const app = new EventEmitter()
  const child = Object.assign(new EventEmitter(), {
    exitCode: null as number | null,
    signalCode: null as NodeJS.Signals | null,
  })
  const port = Object.assign(app, {
    process: () => child,
    evaluate: async () => {
      if (error !== undefined) throw error
    },
  })
  return {
    application: port as unknown as ElectronApplication,
    closed: () => app.emit('close'),
    exited: (code: number | null, signal: NodeJS.Signals | null = null) => {
      child.exitCode = code
      child.signalCode = signal
      child.emit('exit', code, signal)
    },
  }
}
