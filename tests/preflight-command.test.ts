import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { businessCommandSchema } from '@weftpilot/agent-team-kernel/protocol'
import { confirmedPreflightCommand } from '../apps/desktop/renderer/preflight-command'

test('预检确认只携带原始意图、版本和内核摘要，重试保持Run身份且不变成续接', () => {
  for (const operation of ['start', 'retry', 'team'] as const) {
    const input = Object.freeze({ operation, id: randomUUID(), expectedVersion: 7 })
    const command = businessCommandSchema.parse(confirmedPreflightCommand(input, 'a'.repeat(64)))
    assert.equal(
      command.type,
      operation === 'team' ? 'team.start' : operation === 'retry' ? 'run.retry' : 'run.start',
    )
    assert.deepEqual(command, {
      type: command.type,
      [operation === 'retry' ? 'runId' : 'taskId']: input.id,
      expectedVersion: 7,
      expectedConfigurationFingerprint: 'a'.repeat(64),
    })
    assert.equal(input.expectedVersion, 7)
  }
})
