import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  runSchema,
  type Task,
  type Delivery,
  type Acceptance,
} from '@weftpilot/agent-team-kernel/protocol'
import {
  deliveryReviewView,
  taskRuns,
  runDelivery,
  reviewCriteriaLines,
} from '../apps/desktop/renderer/task-run-history'

const fixture = () => {
  const now = new Date().toISOString()
  const task: Task = {
    id: randomUUID(),
    projectId: randomUUID(),
    roleId: randomUUID(),
    version: 5,
    title: '历史展示夹具',
    goal: '当前目标',
    acceptanceCriteria: '当前标准',
    status: 'in_review',
    createdAt: now,
  }
  const role = {
    id: task.roleId,
    version: 1,
    name: '历史角色',
    responsibility: '固定职责',
    cli: 'codex',
    model: '',
    permission: 'read-only',
    skills: [],
    createdAt: now,
  }
  const old = runSchema.parse({
    id: randomUUID(),
    version: 3,
    taskId: task.id,
    projectId: task.projectId,
    attempt: 1,
    retryOfRunId: null,
    status: 'succeeded',
    roleSnapshot: role,
    baselineCommit: 'a'.repeat(40),
    goalSnapshot: '旧目标',
    acceptanceSnapshot: '旧标准',
    feedbackSnapshot: '',
    executionBranch: 'fixture',
    workDirectory: 'fixture',
    createdAt: now,
    startedAt: now,
    endedAt: now,
    failureCode: null,
    processState: 'confirmed_ended',
  })
  const current = {
    ...old,
    id: randomUUID(),
    attempt: 2,
    retryOfRunId: old.id,
    feedbackSnapshot: '保留退回原因',
  }
  const delivery = (runId: string, version: number): Delivery => ({
    id: randomUUID(),
    version,
    runId,
    taskId: task.id,
    answer: '仅单元夹具',
    diff: '',
    headCommit: old.baselineCommit,
    createdAt: now,
  })
  const first = delivery(old.id, 1),
    latest = delivery(current.id, 2)
  const state = {
    tasks: [task],
    runs: [current, old],
    deliveries: [latest, first],
    acceptances: [] as Acceptance[],
  }
  return { state, task, old, current, first, latest }
}

test('历史执行和交付从权威快照投影，旧Run不能显示决定当前任务的验收动作', () => {
  const f = fixture()
  const before = JSON.stringify(f.state)
  assert.deepEqual(
    taskRuns(f.state, f.task.id).map((run) => run.id),
    [f.old.id, f.current.id],
  )
  assert.equal(runDelivery(f.state, f.current.id)?.id, f.latest.id)
  assert.equal(deliveryReviewView(f.state, f.old).current, false)
  assert.equal(deliveryReviewView(f.state, f.old).offerDecision, false)
  assert.equal(deliveryReviewView(f.state, f.current).offerDecision, true)
  for (const update of [{ status: 'failed' as const }, { processState: 'uncertain' as const }]) {
    const run = { ...f.current, ...update }
    const state = { ...f.state, runs: [f.old, run] }
    assert.equal(deliveryReviewView(state, run).offerDecision, false)
  }
  assert.equal(JSON.stringify(f.state), before)
  assert.equal(f.old.roleSnapshot.version, 1)
  assert.equal(f.old.goalSnapshot, '旧目标')
})

test('已处理交付只显示原验收记录，退回原因及交付版本不会被新Run替代', () => {
  const f = fixture()
  const acceptance: Acceptance = {
    id: randomUUID(),
    deliveryId: f.first.id,
    taskId: f.task.id,
    decision: 'returned',
    reason: '明确退回原因',
    actor: 'local-owner',
    createdAt: new Date().toISOString(),
  }
  f.state.acceptances.push(acceptance)
  assert.equal(deliveryReviewView(f.state, f.old).acceptance, acceptance)
  assert.equal(deliveryReviewView(f.state, f.old).summaryKind, 'returned')
  assert.equal(deliveryReviewView(f.state, f.current).acceptance, undefined)
  f.state.acceptances.push({
    ...acceptance,
    id: randomUUID(),
    deliveryId: f.latest.id,
    decision: 'accepted',
  })
  assert.equal(deliveryReviewView(f.state, f.current).offerDecision, false)
  assert.equal(deliveryReviewView(f.state, f.current).summaryKind, 'accepted')
  assert.equal(deliveryReviewView(f.state, f.old).delivery?.version, 1)
  assert.equal(f.current.feedbackSnapshot, '保留退回原因')
})

test('核对标准按固定文本非空行呈现，超量合并仍保留全部原文，不推断执行进度', () => {
  assert.deepEqual(reviewCriteriaLines('第一项\r\n\r\n  第二项'), ['第一项', '  第二项'])
  const text = Array.from({ length: 80 }, (_, index) => `标准 ${index}`).join('\n')
  const criteria = reviewCriteriaLines(text)
  assert.equal(criteria.length, 50)
  assert.equal(criteria.join('\n'), text)
})
