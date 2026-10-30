import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import type { Task, Run } from '@weftpilot/agent-team-kernel/protocol'
import { homeAttentionTasks } from '../apps/desktop/renderer/home-attention'

const task = (status: Task['status'] = 'in_progress'): Task => ({
  id: randomUUID(),
  version: 1,
  projectId: randomUUID(),
  roleId: randomUUID(),
  title: '工作台待办',
  goal: '只读投影',
  acceptanceCriteria: '不执行',
  status,
  createdAt: new Date().toISOString(),
})
const run = (
  task: Task,
  status: Run['status'],
  attempt = 1,
  processState: Run['processState'] = 'confirmed_ended',
) => ({ taskId: task.id, status, attempt, processState })

test('工作台待我处理：决定/验收/未知与最新失败，排除已验收/试运行/旧失败，不改快照', () => {
  const waiting = task(),
    review = task('in_review'),
    failed = task(),
    unknown = task()
  const retrying = task(),
    accepted = task('done'),
    stopped = task()
  const trial = { ...task(), purpose: 'role_trial' as const }
  const state = {
    tasks: [waiting, review, failed, unknown, retrying, accepted, stopped, trial],
    runs: [
      run(waiting, 'waiting_approval'),
      run(failed, 'failed'),
      run(unknown, 'interrupted', 1, 'uncertain'),
      run(retrying, 'running', 2, 'active'),
      run(retrying, 'failed', 1),
      run(accepted, 'failed'),
      run(stopped, 'stopped'),
      run(trial, 'failed'),
    ],
    humanRequests: [{ taskId: waiting.id, status: 'pending' as const }],
  }
  const before = structuredClone(state)
  assert.deepEqual(homeAttentionTasks(state), [waiting, review, failed, unknown])
  assert.deepEqual(state, before)
  assert.deepEqual(homeAttentionTasks({ tasks: [], runs: [], humanRequests: [] }), [])
})
