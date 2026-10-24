import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { parseInput } from '../apps/desktop/main/input-validation'
import { translateError } from '../apps/desktop/renderer/error-messages'

test('公开IPC拒绝空白、非法字段和类型时只暴露稳定错误，合法输入仍trim', () => {
  const schema = z.object({ title: z.string().trim().min(1).max(200) }).strict()
  assert.deepEqual(parseInput(schema, { title: ' 实际目标 ' }), { title: '实际目标' })
  for (const raw of [
    { title: '   ' },
    { title: 123 },
    { title: '目标', secret: 'synthetic-private' },
  ]) {
    assert.throws(
      () => parseInput(schema, raw),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.equal(error.message, 'INPUT_INVALID')
        assert.doesNotMatch(error.message, /synthetic-private|Zod|too_small|unrecognized_keys/)
        return true
      },
    )
  }
  assert.match(
    translateError('Error invoking remote method: Error: INPUT_INVALID', false)!,
    /必填项/,
  )
  assert.match(translateError('INPUT_INVALID', true)!, /Check required fields/)
})
