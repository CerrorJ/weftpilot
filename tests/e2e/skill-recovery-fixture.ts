import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { createKernel, type EmbeddedKernel } from '@weftpilot/agent-team-kernel/kernel'
import {
  workspaceSnapshotSchema,
  type BusinessCommand,
} from '@weftpilot/agent-team-kernel/protocol'
import { createFixture } from './workflow-helpers'
import { fixtureSkillDirectory, skillFixtureCommits } from './skill-helpers'

/** 初始失败来自受控fetch；恢复按钮后的网络由实际打包内核发起，不继承此替身。 */
export const prepareSkillRecovery = async () => {
  const fixture = await createFixture()
  const kernel = createKernel({
    dataDirectory: join(fixture.data, 'kernel'),
    sourceCommit: '73b4498966954b64b1d622ba50fb983a3e62ce2f',
    skillFetch: async (url) =>
      String(url).includes('/unsafe-source/')
        ? new Response(JSON.stringify({ truncated: true, tree: [] }))
        : new Response('synthetic-private-marker', { status: 429 }),
  })
  let completed = false
  try {
    await seedRecovery(kernel)
    await waitForFailures(kernel)
    completed = true
  } finally {
    await kernel.shutdown()
    if (!completed) await fixture.cleanup()
  }
  return fixture
}

const seedRecovery = async (kernel: EmbeddedKernel) => {
  const source = await command(kernel, {
    type: 'skill.source.save',
    expectedVersion: 0,
    name: '原固定来源',
    repository: 'https://github.com/CerrorJ/weftpilot',
    commit: skillFixtureCommits[0],
  })
  await command(kernel, {
    type: 'skill.import',
    sourceId: source.id,
    sourceVersion: 1,
    directory: fixtureSkillDirectory,
    licensePath: `${fixtureSkillDirectory}/LICENSE`,
  })
  await command(kernel, {
    type: 'skill.source.save',
    id: source.id,
    expectedVersion: 1,
    name: '后来更新的来源',
    repository: 'https://github.com/CerrorJ/weftpilot',
    commit: skillFixtureCommits[1],
  })
  const unsafe = await command(kernel, {
    type: 'skill.source.save',
    expectedVersion: 0,
    name: '不可直接重下的来源',
    repository: 'https://github.com/example/unsafe-source',
    commit: 'a'.repeat(40),
  })
  await command(kernel, {
    type: 'skill.import',
    sourceId: unsafe.id,
    sourceVersion: 1,
    directory: 'skills/unsafe',
    licensePath: 'LICENSE',
  })
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
  return response.result as { id: string }
}

const waitForFailures = async (kernel: EmbeddedKernel) => {
  for (let count = 0; count < 100; count++) {
    const response = await kernel.dispatch({
      protocolVersion: 1,
      requestId: randomUUID(),
      method: 'workspace.snapshot',
    })
    if (response.status === 'rejected') throw new Error(response.error.code)
    const state = workspaceSnapshotSchema.parse(response.result)
    if (
      state.skillImports.length === 2 &&
      state.skillImports.every((item) => item.state === 'failed')
    )
      return
    await delay(20)
  }
  throw new Error('CONTROLLED_SKILL_RECOVERY_SETUP_TIMEOUT')
}
