import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { createKernel, type EmbeddedKernel } from '@weftpilot/agent-team-kernel/kernel'
import { workspaceSnapshotSchema } from '@weftpilot/agent-team-kernel/protocol'
import type { BusinessCommand } from '@weftpilot/agent-team-kernel/protocol'
import { createFixture } from './workflow-helpers'

/** 通过真实内核用例持久化受控网络失败；不是实际GitHub连通或成功安装证明。 */
export const prepareSkillErrors = async () => {
  const fixture = await createFixture()
  const kernel = createKernel({
    dataDirectory: join(fixture.data, 'kernel'),
    sourceCommit: '73b4498966954b64b1d622ba50fb983a3e62ce2f',
    skillFetch: async (url) => {
      if (String(url).includes('/rate-source/'))
        return new Response('synthetic-private-marker', {
          status: 403,
          headers: { 'x-ratelimit-remaining': '0' },
        })
      throw new Error('synthetic-private-marker', { cause: { code: 'CERT_HAS_EXPIRED' } })
    },
  })
  let completed = false
  try {
    for (const name of ['rate-source', 'tls-source']) {
      const saved = await command(kernel, {
        type: 'skill.source.save',
        expectedVersion: 0,
        name,
        repository: `https://github.com/example/${name}`,
        commit: 'a'.repeat(40),
      })
      await command(kernel, {
        type: 'skill.import',
        sourceId: (saved.result as { id: string }).id,
        sourceVersion: 1,
        directory: 'skills/controlled-errors',
        licensePath: 'LICENSE',
      })
    }
    await waitForErrors(kernel)
    completed = true
  } finally {
    await kernel.shutdown()
    if (!completed) await fixture.cleanup()
  }
  return fixture
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
  return response
}

const waitForErrors = async (kernel: EmbeddedKernel): Promise<void> => {
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
  throw new Error('CONTROLLED_ERROR_TIMEOUT')
}
