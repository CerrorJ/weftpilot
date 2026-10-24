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

// 受控执行端口仅生成可审计的展示夹具；不作为真实CLI/认证/模型或进程终止证明。
const controlledAnswer: NonNullable<KernelOptions['execute']> = async (input) => {
  const trial = (await readdir(input.cwd)).find((name) =>
    /^weftpilot-trial-.*\.input\.txt$/.test(name),
  )
  if (trial) return { answer: (await readFile(join(input.cwd, trial), 'utf8')).trim() }
  return { answer: 'CONTROLLED_DELIVERY_ONLY · 不代表真实CLI执行。' }
}

const command = async (kernel: EmbeddedKernel, command: BusinessCommand) => {
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

const snapshot = async (kernel: EmbeddedKernel) => {
  const response = await kernel.dispatch({
    protocolVersion: 1,
    requestId: randomUUID(),
    method: 'workspace.snapshot',
  })
  if (response.status === 'rejected') throw new Error(response.error.code)
  return workspaceSnapshotSchema.parse(response.result)
}

const waitForRun = async (kernel: EmbeddedKernel, id: string) => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const state = await snapshot(kernel)
    const run = state.runs.find((item) => item.id === id)
    if (run?.processState === 'confirmed_ended') {
      assert.equal(run.status, 'succeeded')
      return state
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error('CONTROLLED_FIXTURE_TIMEOUT')
}

const enableRole = async (kernel: EmbeddedKernel, projectId: string) => {
  const roleId = await command(kernel, {
    type: 'role.save',
    expectedVersion: 0,
    name: '固定历史角色',
    responsibility: '只用于受控展示夹具',
    cli: 'codex',
    model: '',
    permission: 'read-only',
  })
  const id = await command(kernel, {
    type: 'role.trial',
    roleId,
    projectId,
    expectedRoleVersion: 1,
  })
  const state = await waitForRun(kernel, id)
  const readiness = state.roleReadiness.find((item) => item.roleId === roleId)!
  await command(kernel, {
    type: 'role.setEnabled',
    roleId,
    expectedRoleVersion: 1,
    expectedReadinessVersion: readiness.version,
    enabled: true,
  })
  return roleId
}

const createHistory = async (
  kernel: EmbeddedKernel,
  input: { roleId: string; projectId: string },
) => {
  const taskId = await command(kernel, {
    type: 'task.create',
    ...input,
    title: '受控历史任务',
    goal: '只测试展示与决定绑定，不证明CLI执行。',
    acceptanceCriteria: '核对交付目标\n核对变更与证据',
  })
  const firstId = await command(kernel, { type: 'run.start', taskId, expectedVersion: 1 })
  let state = await waitForRun(kernel, firstId)
  const first = state.runs.find((run) => run.id === firstId)!
  const delivery = state.deliveries.find((item) => item.runId === first.id)!
  await command(kernel, {
    type: 'delivery.accept',
    deliveryId: delivery.id,
    expectedTaskVersion: state.tasks.find((task) => task.id === taskId)!.version,
    decision: 'returned',
    reason: '第一版退回原因必须保留',
  })
  const secondId = await command(kernel, {
    type: 'run.retry',
    runId: first.id,
    expectedVersion: first.version,
  })
  state = await waitForRun(kernel, secondId)
  return { taskId, firstId, secondId, state }
}

export const prepareDeliveryFixture = async () => {
  const fixture = await createFixture()
  const lock = JSON.parse(await readFile('config/kernel-lock.json', 'utf8')) as {
    sourceCommit: string
  }
  const kernel = createKernel({
    dataDirectory: join(fixture.data, 'kernel'),
    sourceCommit: lock.sourceCommit,
    execute: controlledAnswer,
  })
  let completed = false
  try {
    const projectId = await command(kernel, {
      type: 'project.create',
      name: '受控展示项目',
      repositoryPath: fixture.repository,
      defaultBranch: 'main',
    })
    const roleId = await enableRole(kernel, projectId)
    const history = await createHistory(kernel, { projectId, roleId })
    completed = true
    return { ...fixture, ...history, roleId }
  } finally {
    await kernel.shutdown()
    if (!completed) await fixture.cleanup()
  }
}
