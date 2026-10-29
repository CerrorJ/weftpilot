import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Task, Run } from '@weftpilot/agent-team-kernel/protocol'
import { taskBoardColumns } from '../apps/desktop/renderer/task-board-columns'
import { latestTaskRun, taskStatusText } from '../apps/desktop/renderer/task-display'

const task = (status: Task['status']): Task => ({
  id: randomUUID(),
  version: 1,
  projectId: randomUUID(),
  roleId: randomUUID(),
  title: '只读看板',
  goal: '投影不执行',
  acceptanceCriteria: '不生成Run或状态',
  status,
  createdAt: new Date().toISOString(),
})
const run = (
  value: Task,
  status: Run['status'],
  attempt = 1,
  processState: Run['processState'] = 'not_started',
) => ({ taskId: value.id, status, attempt, processState })

test('看板按最大attempt分栏：未知不视为结束，执行成功不等于验收，筛选输入和原快照不变', () => {
  const ready = task('ready'),
    active = task('in_progress'),
    uncertain = task('in_progress')
  const failed = task('in_progress'),
    review = task('in_review'),
    done = task('done')
  const state = {
    tasks: [ready, active, uncertain, failed, review, done],
    runs: [
      run(active, 'running', 2, 'active'),
      run(active, 'failed', 1, 'confirmed_ended'),
      run(uncertain, 'interrupted', 1, 'uncertain'),
      run(failed, 'failed', 1, 'confirmed_ended'),
    ],
  }
  const before = JSON.stringify(state)
  const columns = taskBoardColumns(state, state.tasks)
  assert.deepEqual(columns.ready, [ready])
  assert.deepEqual(columns.working, [uncertain, active])
  assert.deepEqual(columns.review, [review])
  assert.deepEqual(columns.ended, [done, failed])
  assert.equal(Object.values(columns).flat().length, state.tasks.length)
  assert.equal(latestTaskRun(state.runs, active.id)?.attempt, 2)
  assert.equal(taskStatusText(uncertain, state.runs[2]), '状态待确认')
  assert.equal(taskStatusText(active, run(active, 'succeeded', 3, 'confirmed_ended')), '执行成功')
  assert.equal(taskStatusText(done, run(done, 'failed')), '已验收')
  assert.equal(Object.values(taskBoardColumns(state, [ready])).flat().length, 1)
  assert.equal(JSON.stringify(state), before)
})

test('父任务无Run按子任务等待/已结束展示，不构造父执行或把全停止视为执行中', () => {
  const parent = { ...task('in_progress'), purpose: 'team_parent' as const }
  const child = { ...task('in_progress'), parentTaskId: parent.id }
  const state = { tasks: [parent, child], runs: [run(child, 'stopped', 1, 'confirmed_ended')] }
  assert.deepEqual(taskBoardColumns(state, [parent]).ended, [parent])
  assert.deepEqual(
    taskBoardColumns({ ...state, runs: [run(child, 'stopping', 1, 'uncertain')] }, [parent])
      .working,
    [parent],
  )
  assert.deepEqual(
    taskBoardColumns({ ...state, tasks: [parent, { ...child, status: 'in_review' }] }, [parent])
      .working,
    [parent],
  )
  assert.deepEqual(taskBoardColumns(state, [{ ...parent, status: 'in_review' }]).review, [
    { ...parent, status: 'in_review' },
  ])
  assert.equal(taskStatusText(parent, undefined), '等待子任务')
  assert.equal(taskStatusText(task('in_progress'), undefined), '等待执行状态')
  assert.equal(parent.status, 'in_progress')
  assert.equal(
    state.runs.some((value) => value.taskId === parent.id),
    false,
  )
})
