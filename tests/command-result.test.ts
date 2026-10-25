import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  parseCommandResult,
  parseProjectCreationResult,
} from '../packages/kernel-client/command-result'

test('创建选择只接受确切UUID回执，结果损坏不能猜测成功或对象ID', () => {
  const id = randomUUID()
  assert.deepEqual(parseCommandResult({ id }), { id })
  for (const value of [undefined, null, true, { id: 'not-an-id' }, { id, extra: true }]) {
    assert.throws(() => parseCommandResult(value), /^Error: COMMAND_RESULT_UNCERTAIN$/)
  }
})

test('系统选择器只接受明确取消或确切创建回执，畸形混合结果保持待确认', () => {
  const id = randomUUID()
  assert.deepEqual(parseProjectCreationResult({ cancelled: true }), { cancelled: true })
  assert.deepEqual(parseProjectCreationResult({ id }), { id })
  for (const raw of [
    { cancelled: false },
    { cancelled: true, id },
    { cancelled: true, extra: 1 },
    {},
  ])
    assert.throws(() => parseProjectCreationResult(raw), /COMMAND_RESULT_UNCERTAIN/)
})
