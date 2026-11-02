import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  createKernel,
  type EmbeddedKernel,
  type KernelOptions,
} from '@weftpilot/agent-team-kernel/kernel'
import {
  workspaceSnapshotSchema,
  type BusinessCommand,
} from '@weftpilot/agent-team-kernel/protocol'
import { createFixture } from './workflow-helpers'

const issue = async (kernel: EmbeddedKernel, command: BusinessCommand) => {
  const response = await kernel.dispatch({
    protocolVersion: 1,
    requestId: randomUUID(),
    method: 'workspace.command',
    key: randomUUID(),
    command,
  })
  if (response.status === 'rejected') throw new Error(response.error.code)
  return (response.result as { id: string }).id
}

const readState = async (kernel: EmbeddedKernel) => {
  const response = await kernel.dispatch({
    protocolVersion: 1,
    requestId: randomUUID(),
    method: 'workspace.snapshot',
  })
  if (response.status === 'rejected') throw new Error(response.error.code)
  return workspaceSnapshotSchema.parse(response.result)
}

const waitForEnded = async (kernel: EmbeddedKernel, id: string) => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const state = await readState(kernel)
    if (state.runs.find((run) => run.id === id)?.processState === 'confirmed_ended') return state
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error('CONTROLLED_HUMAN_FIXTURE_TIMEOUT')
}

// 只生成展示用等待态；真正的决定、超时、停止和持久化全部走未修改的内核。
const controlledRequests = (): NonNullable<KernelOptions['execute']> => {
  let businessCalls = 0
  return async (input) => {
    const trial = (await readdir(input.cwd)).find((name) =>
      /^weftpilot-trial-.*\.input\.txt$/.test(name),
    )
    if (trial) return { answer: (await readFile(join(input.cwd, trial), 'utf8')).trim() }
    const index = businessCalls++
    assert.ok(index < 3, '夹具不允许隐式续接或额外执行')
    const humanRequest =
      index === 1
        ? { kind: 'plan' as const, title: '受控方案', summary: '仅核对拒绝及历史，不是真实模型。' }
        : {
            kind: 'operation' as const,
            request: {
              operation: index === 0 ? '受控到期操作' : '受控撤销操作',
              detail: '不执行文件写入，只生成等待态。',
              impact: '自己的合成项目',
              rollback: '无外部副作用',
              timeoutSeconds: index === 0 ? 60 : 3600,
            },
          }
    return { answer: '', sessionId: randomUUID(), humanRequest }
  }
}

const enableRole = async (kernel: EmbeddedKernel, projectId: string) => {
  const roleId = await issue(kernel, {
    type: 'role.save',
    expectedVersion: 0,
    name: '受控审批角色',
    responsibility: '仅用于负向状态展示验收，不证明真实CLI。',
    cli: 'codex',
    model: '',
    permission: 'read-only',
  })
  const trialId = await issue(kernel, {
    type: 'role.trial',
    roleId,
    projectId,
    expectedRoleVersion: 1,
  })
  const state = await waitForEnded(kernel, trialId)
  assert.equal(state.runs.find((run) => run.id === trialId)?.status, 'succeeded')
  const readiness = state.roleReadiness.find((item) => item.roleId === roleId)!
  await issue(kernel, {
    type: 'role.setEnabled',
    roleId,
    expectedRoleVersion: 1,
    expectedReadinessVersion: readiness.version,
    enabled: true,
  })
  return roleId
}

export const prepareHumanStateFixture = async () => {
  const fixture = await createFixture()
  const lock = JSON.parse(await readFile('config/kernel-lock.json', 'utf8')) as {
    sourceCommit: string
  }
  const kernel = createKernel({
    dataDirectory: join(fixture.data, 'kernel'),
    sourceCommit: lock.sourceCommit,
    execute: controlledRequests(),
  })
  let completed = false
  try {
    const projectId = await issue(kernel, {
      type: 'project.create',
      name: '受控审批项目',
      repositoryPath: fixture.repository,
      defaultBranch: 'main',
    })
    const roleId = await enableRole(kernel, projectId)
    const tasks: string[] = []
    for (const kind of ['到期', '拒绝', '撤销']) {
      const taskId = await issue(kernel, {
        type: 'task.create',
        projectId,
        roleId,
        title: `受控审批 · ${kind}`,
        goal: '只核对状态，不是真实CLI。',
        acceptanceCriteria: '未批准不得产生交付或执行副作用。',
      })
      const runId = await issue(kernel, { type: 'run.start', taskId, expectedVersion: 1 })
      const state = await waitForEnded(kernel, runId)
      assert.equal(state.runs.find((run) => run.id === runId)?.status, 'waiting_approval')
      tasks.push(taskId)
    }
    const state = await readState(kernel)
    completed = true
    return { ...fixture, tasks, state }
  } finally {
    await kernel.shutdown()
    if (!completed) await fixture.cleanup()
  }
}
