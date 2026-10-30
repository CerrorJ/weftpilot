import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { NotificationWatch } from '../apps/desktop/main/notification-watch'
import type { NotificationCandidate } from '../apps/desktop/main/notification-projection'
import { defaultNotificationPreferences } from '../packages/system-bridge/notification-contract'
import { prepareDeliveryFixture } from './e2e/delivery-fixture'

type Fixture = Awaited<ReturnType<typeof prepareDeliveryFixture>>

const deferredSnapshot = () => {
  let complete: ((value: unknown) => void) | undefined
  const promise = new Promise<unknown>((resolve) => {
    complete = resolve
  })
  return {
    promise,
    resolve: (value: unknown) => {
      assert.ok(complete)
      complete(value)
    },
  }
}

// 只改内存DTO供受控transport返回，绝不回写夹具SQLite或冒充真实CLI/OS通知。
const failureState = (fixture: Fixture, attempt: number) => {
  const state = structuredClone(fixture.state)
  const run = state.runs.find((item) => item.id === fixture.secondId)
  const task = state.tasks.find((item) => item.id === fixture.taskId)
  assert.ok(run)
  assert.ok(task)
  run.id = randomUUID()
  run.status = 'failed'
  run.attempt = attempt
  run.failureCode = 'CONTROLLED_NOTIFICATION_ONLY'
  task.status = 'in_progress'
  state.cursor += attempt
  return state
}

test(
  '通知观察基线、重复抑制和类别开关：开启不补发历史，关闭后新变化不积压',
  { timeout: 30000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    let state = fixture.state
    const preferences = { ...defaultNotificationPreferences, enabled: true }
    const delivered: NotificationCandidate[] = []
    const client = { request: async () => structuredClone(state) }
    const watch = new NotificationWatch({
      client: () => client,
      preferences: () => preferences,
      deliver: (candidate) => delivered.push(candidate),
    })
    try {
      await watch.poll()
      assert.equal(delivered.length, 0)
      assert.equal(watch.observation, 'watching')
      state = failureState(fixture, 3)
      await watch.poll()
      await watch.poll()
      assert.deepEqual(
        delivered.map((item) => item.kind),
        ['failure'],
      )
      preferences.enabled = false
      state = failureState(fixture, 4)
      await watch.poll()
      preferences.enabled = true
      await watch.poll()
      assert.equal(delivered.length, 1)
      preferences.failure = false
      state = failureState(fixture, 5)
      await watch.poll()
      preferences.failure = true
      await watch.poll()
      assert.equal(delivered.length, 1)
      state = failureState(fixture, 6)
      await watch.poll()
      assert.equal(delivered.length, 2)
      watch.stop()
      state = failureState(fixture, 7)
      await watch.poll()
      assert.equal(delivered.length, 2)
    } finally {
      watch.stop()
      await fixture.cleanup()
    }
  },
)

test(
  '受控传输观察：坏响应/恢复/host切换重新建基线，迟到旧host和退出后应答不发通知',
  { timeout: 30000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    let state: unknown = fixture.state
    let client = { request: async (): Promise<unknown> => structuredClone(state) }
    const delivered: NotificationCandidate[] = []
    const watch = new NotificationWatch({
      client: () => client,
      preferences: () => ({ ...defaultNotificationPreferences, enabled: true }),
      deliver: (candidate) => delivered.push(candidate),
    })
    try {
      await watch.poll()
      state = failureState(fixture, 3)
      await watch.poll()
      assert.equal(delivered.length, 1)
      state = {}
      await watch.poll()
      assert.equal(watch.observation, 'unavailable')
      state = failureState(fixture, 4)
      await watch.poll()
      assert.equal(delivered.length, 1)
      const previous = deferredSnapshot()
      client = { request: () => previous.promise }
      const pending = watch.poll()
      client = { request: async () => failureState(fixture, 5) }
      previous.resolve(failureState(fixture, 6))
      await pending
      assert.equal(delivered.length, 1)
      await watch.poll()
      assert.equal(delivered.length, 1)
      const closing = deferredSnapshot()
      client = { request: () => closing.promise }
      const duringQuit = watch.poll()
      watch.stop()
      closing.resolve(failureState(fixture, 7))
      await duringQuit
      assert.equal(delivered.length, 1)
    } finally {
      watch.stop()
      await fixture.cleanup()
    }
  },
)
