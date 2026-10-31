import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseNotificationDiagnostic as parse } from './native/notification-diagnostics'

test('固定Electron通知诊断：授权和调度事件只投影有限字段，不保留UUID或错误正文', () => {
  assert.deepEqual(parse('[INFO] Notification authorization granted: 1'), {
    event: 'authorization',
    granted: true,
  })
  assert.deepEqual(parse('[INFO] Notification authorization granted: 0'), {
    event: 'authorization',
    granted: false,
  })
  assert.deepEqual(parse('[INFO] Notification created (1234-abcd)'), { event: 'created' })
  assert.deepEqual(parse('[INFO] Notification scheduled (1234-abcd)'), { event: 'scheduled' })
  const event = parse(
    '[INFO] Error scheduling notification (1234-abcd) Notifications are not allowed for this application. synthetic-secret',
  )!
  assert.equal(event.event, 'schedule_error')
  assert.equal('reason' in event && event.reason, 'not_allowed')
  assert.match(String('fingerprint' in event && event.fingerprint), /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(event).includes('synthetic-secret'), false)
  assert.equal(JSON.stringify(event).includes('1234-abcd'), false)
})

test('通知诊断拒绝任意日志及超长行；未知原因只保留分类和指纹', () => {
  assert.equal(parse('unrelated private path /private/profile'), undefined)
  assert.equal(parse('Notification authorization granted: 2'), undefined)
  assert.equal(parse('x'.repeat(4097)), undefined)
  const event = parse(
    '[INFO] Error requesting notification authorization: opaque synthetic-secret',
  )!
  assert.equal(event.event, 'authorization_error')
  assert.equal('reason' in event && event.reason, 'unknown')
  assert.equal(JSON.stringify(event).includes('opaque'), false)
  assert.equal(JSON.stringify(event).includes('synthetic-secret'), false)
})
