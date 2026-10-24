import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { parseCommandResult } from '../packages/kernel-client/command-result'

test('创建选择只接受确切UUID回执，结果损坏不能猜测成功或对象ID', () => {
  const id = randomUUID()
  assert.deepEqual(parseCommandResult({ id }), { id })
  for (const value of [undefined, null, true, { id: 'not-an-id' }, { id, extra: true }]) {
    assert.throws(() => parseCommandResult(value), /^Error: COMMAND_RESULT_UNCERTAIN$/)
  }
})
