import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  roleVersionSchema,
  roleReadinessSchema,
  runSchema,
} from '@weftpilot/agent-team-kernel/protocol'
import {
  roleCardStatus,
  roleTrialPassed,
  roleTrials,
  roleHasActiveTrial,
  roleCardSkills,
} from '../apps/desktop/renderer/role-card-view'

test('卡片技能使用固定摘要且读取最新可用性，不把已卸载或不同内容显示为可用', () => {
  const { role } = fixture()
  const id = randomUUID(),
    digest = 'a'.repeat(64)
  const bound = { ...role, skills: [{ id, digest }] }
  const original = { id, version: 1, name: '固定技能', digest, available: true }
  assert.equal(roleCardSkills({ skills: [original] }, bound)[0]?.available, true)
  const removed = { ...original, version: 2, available: false }
  assert.equal(roleCardSkills({ skills: [original, removed] }, bound)[0]?.available, false)
  const replaced = { ...original, version: 2, digest: 'b'.repeat(64) }
  assert.equal(roleCardSkills({ skills: [original, replaced] }, bound)[0]?.available, false)
  assert.equal(bound.skills[0]?.digest, digest)
})

const fixture = () => {
  const role = roleVersionSchema.parse({
    id: randomUUID(),
    version: 1,
    name: '状态角色',
    responsibility: '投影夹具',
    cli: 'codex',
    model: '',
    permission: 'read-only',
    skills: [],
    createdAt: new Date().toISOString(),
  })
  const readiness = roleReadinessSchema.parse({
    roleId: role.id,
    roleVersion: 1,
    version: 4,
    state: 'disabled',
    enabled: false,
    latestTrialRunId: randomUUID(),
    failureCode: null,
    updatedAt: role.createdAt,
  })
  const run = runSchema.parse({
    id: readiness.latestTrialRunId,
    version: 4,
    taskId: randomUUID(),
    projectId: randomUUID(),
    attempt: 1,
    retryOfRunId: null,
    status: 'succeeded',
    purpose: 'role_trial',
    roleSnapshot: role,
    baselineCommit: 'a'.repeat(40),
    goalSnapshot: '随机挑战',
    acceptanceSnapshot: '匹配文件',
    executionBranch: 'fixture',
    workDirectory: 'fixture',
    createdAt: role.createdAt,
    startedAt: role.createdAt,
    endedAt: role.createdAt,
    failureCode: null,
    processState: 'confirmed_ended',
  })
  return { role, readiness, run }
}

test('已停用但确切版本试运行通过仍能展示重新启用，旧/失败/未知/普通Run不能当启用证明', () => {
  const f = fixture()
  assert.equal(roleTrialPassed(f.role, f.run), true)
  assert.equal(roleCardStatus({ roleReadiness: [f.readiness] }, f.role), '已停用')
  assert.equal(roleTrialPassed({ ...f.role, version: 2 }, f.run), false)
  assert.equal(roleTrialPassed(f.role, { ...f.run, status: 'failed' }), false)
  assert.equal(roleTrialPassed(f.role, { ...f.run, processState: 'uncertain' }), false)
  assert.equal(roleTrialPassed(f.role, { ...f.run, purpose: 'task' }), false)
  assert.equal(roleTrialPassed(f.role, undefined), false)
})

test('新版本不继承旧就绪，缺少启用证明及失败/运行中/未启用分开投影，不写权威状态', () => {
  const f = fixture()
  const state = { roleReadiness: [f.readiness] }
  const before = JSON.stringify(state)
  assert.equal(roleCardStatus(state, { ...f.role, version: 2 }), '待试运行')
  assert.equal(
    roleCardStatus(
      { roleReadiness: [{ ...f.readiness, state: 'draft', failureCode: 'FIXTURE_FAILED' }] },
      f.role,
    ),
    '试运行未通过',
  )
  assert.equal(
    roleCardStatus({ roleReadiness: [{ ...f.readiness, state: 'trial_running' }] }, f.role),
    '试运行中',
  )
  assert.equal(
    roleCardStatus({ roleReadiness: [{ ...f.readiness, state: 'ready' }] }, f.role),
    '待启用',
  )
  assert.equal(
    roleCardStatus({ roleReadiness: [{ ...f.readiness, state: 'ready', enabled: true }] }, f.role),
    '已启用',
  )
  assert.equal(JSON.stringify(state), before)
})

test('旧版本未结束试运行仍可见且阻止新试运行提示，普通任务不混入试运行历史', () => {
  const f = fixture()
  const active = {
    ...f.run,
    id: randomUUID(),
    status: 'stopping' as const,
    processState: 'uncertain' as const,
  }
  const business = {
    ...f.run,
    id: randomUUID(),
    purpose: 'task' as const,
    processState: 'active' as const,
  }
  const state = { runs: [f.run, active, business] }
  assert.deepEqual(roleTrials(state, f.role.id), [f.run, active])
  assert.equal(roleHasActiveTrial(state, f.role.id), true)
  assert.equal(roleHasActiveTrial({ runs: [f.run, business] }, f.role.id), false)
  assert.equal(roleHasActiveTrial(state, randomUUID()), false)
})
