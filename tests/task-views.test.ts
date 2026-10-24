import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import type { Task, Run } from '@weftpilot/agent-team-kernel/protocol'
import { taskGroups } from '../apps/desktop/renderer/task-views'

const task = (status: Task['status']): Task => ({
  id: randomUUID(),
  version: 1,
  projectId: randomUUID(),
  roleId: randomUUID(),
  title: '分组测试',
  goal: '投影',
  acceptanceCriteria: '无需执行',
  status,
  createdAt: new Date().toISOString(),
})
const run = (
  task: Task,
  status: Run['status'],
  attempt = 1,
  processState: Run['processState'] = 'not_started',
) => ({ taskId: task.id, status, attempt, processState })

test('筛选与概览共享权威快照投影：人工/交付/不确定状态不冒充执行中，重试取最大attempt', () => {
  const ready = task('ready'),
    running = task('in_progress'),
    waiting = task('in_progress')
  const uncertain = task('in_progress'),
    review = task('in_review'),
    done = task('done')
  const trial = { ...task('ready'), purpose: 'role_trial' as const }
  const state = {
    tasks: [ready, running, waiting, uncertain, review, done, trial],
    runs: [
      run(running, 'running', 2, 'active'),
      run(running, 'failed', 1, 'confirmed_ended'),
      run(waiting, 'waiting_approval'),
      run(uncertain, 'stopping', 1, 'uncertain'),
    ],
    humanRequests: [{ taskId: waiting.id, status: 'pending' as const }],
  }
  const before = JSON.stringify(state)
  const groups = taskGroups(state)
  assert.deepEqual(
    groups.all.map((item) => item.id),
    state.tasks.slice(0, 6).map((item) => item.id),
  )
  assert.deepEqual(groups.running, [running])
  assert.deepEqual(groups.pending, [waiting, uncertain, review])
  assert.deepEqual(groups.done, [done])
  assert.equal(JSON.stringify(state), before)
})

test('团队父任务没有Run：按实际子任务投影，待处理优先，全部停止不冒充活动，权威验收状态保留', () => {
  const parent = { ...task('in_progress'), purpose: 'team_parent' as const }
  const child = { ...task('in_progress'), parentTaskId: parent.id }
  const other = { ...task('in_progress'), parentTaskId: parent.id }
  const state = {
    tasks: [parent, child, other],
    runs: [run(child, 'running', 1, 'active'), run(other, 'queued')],
    humanRequests: [],
  }
  assert.deepEqual(taskGroups(state).running, [parent, child, other])
  const waiting = {
    ...state,
    runs: [state.runs[0]!, run(other, 'waiting_approval')],
    humanRequests: [{ taskId: other.id, status: 'pending' as const }],
  }
  assert.deepEqual(taskGroups(waiting).pending, [parent, other])
  assert.deepEqual(taskGroups(waiting).running, [child])
  const uncertain = { ...state, runs: [state.runs[0]!, run(other, 'stopping', 1, 'uncertain')] }
  assert.deepEqual(taskGroups(uncertain).pending, [parent, other])
  const stopped = {
    ...state,
    runs: [run(child, 'stopped', 1, 'confirmed_ended'), run(other, 'failed', 1, 'confirmed_ended')],
  }
  assert.deepEqual(taskGroups(stopped).running, [])
  assert.deepEqual(taskGroups(stopped).pending, [])
  const reviewing = {
    ...state,
    tasks: [
      { ...parent, status: 'in_review' as const },
      { ...child, status: 'in_review' as const },
    ],
  }
  assert.deepEqual(taskGroups(reviewing).pending, reviewing.tasks)
  const done = { ...state, tasks: [{ ...parent, status: 'done' as const }] }
  assert.deepEqual(taskGroups(done).done, done.tasks)
  assert.equal(
    state.runs.some((item) => item.taskId === parent.id),
    false,
  )
  assert.equal(parent.status, 'in_progress')
})
