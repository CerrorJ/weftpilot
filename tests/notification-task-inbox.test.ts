import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { createNotificationTaskInbox } from '../packages/system-bridge/notification-task-inbox'

test('通知点击导航：仅UUID，挂载前最新意图一次续接，取消订阅不向旧页面投递', async () => {
  const inbox = createNotificationTaskInbox()
  const first = randomUUID(),
    second = randomUUID(),
    third = randomUUID()
  const received: string[] = []
  inbox.receive(first)
  inbox.receive(second)
  inbox.receive({ taskId: third, command: 'approve' })
  inbox.receive('file:///private-path')
  const stop = inbox.subscribe((id) => received.push(id))
  await Promise.resolve()
  assert.deepEqual(received, [second])
  stop()
  inbox.receive(third)
  const newer: string[] = []
  const stopNew = inbox.subscribe((id) => newer.push(id))
  await Promise.resolve()
  assert.deepEqual(newer, [third])
  stop()
  inbox.receive(first)
  assert.deepEqual(received, [second])
  assert.deepEqual(newer, [third, first])
  stopNew()
})
