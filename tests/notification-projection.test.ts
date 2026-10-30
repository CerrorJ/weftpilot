import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  notificationCandidates,
  type NotificationSnapshot,
} from '../apps/desktop/main/notification-projection'

test('通知投影只取当前Run的未决请求/未验收交付和失败，排除试运行/已验收/旧审批', () => {
  const state: NotificationSnapshot = {
    tasks: [
      { id: 'review-task', status: 'in_review' },
      { id: 'failed-task', status: 'in_progress' },
      { id: 'done-task', status: 'done' },
      { id: 'trial-task', status: 'in_progress', purpose: 'role_trial' },
    ],
    runs: [
      { id: 'new-run', taskId: 'review-task', attempt: 2, status: 'succeeded' },
      { id: 'old-run', taskId: 'review-task', attempt: 1, status: 'failed' },
      { id: 'failed-run', taskId: 'failed-task', attempt: 1, status: 'failed' },
      { id: 'done-run', taskId: 'done-task', attempt: 1, status: 'failed' },
      { id: 'trial-run', taskId: 'trial-task', attempt: 1, status: 'failed' },
    ],
    humanRequests: [
      { id: 'new-request', taskId: 'review-task', runId: 'new-run', status: 'pending' },
      { id: 'old-request', taskId: 'review-task', runId: 'old-run', status: 'pending' },
      { id: 'answered-request', taskId: 'review-task', runId: 'new-run', status: 'answered' },
    ],
    deliveries: [
      { id: 'old-delivery', taskId: 'review-task', runId: 'old-run' },
      { id: 'new-delivery', taskId: 'review-task', runId: 'new-run' },
      { id: 'accepted-delivery', taskId: 'review-task', runId: 'new-run' },
    ],
    acceptances: [{ deliveryId: 'accepted-delivery' }],
  }
  const before = structuredClone(state)
  assert.deepEqual(notificationCandidates(state), [
    { key: 'human:new-request', taskId: 'review-task', kind: 'human' },
    { key: 'review:new-delivery', taskId: 'review-task', kind: 'review' },
    { key: 'failure:failed-run', taskId: 'failed-task', kind: 'failure' },
  ])
  assert.deepEqual(state, before)
})
