import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { taskOwnerName } from '../apps/desktop/renderer/task-owner'

test('任务负责人投影：无Run选择最大版本，有Run保留当时名称，不改写历史快照', () => {
  const id = randomUUID()
  const original = { id, version: 1, name: '原名称' }
  const current = { id, version: 3, name: '最新名称' }
  const middle = { id, version: 2, name: '中间名称' }
  // 刻意打乱版本顺序，防止依赖数组首项或末项代替版本比较。
  const roles = [current, original, middle]
  const task = { roleId: id }
  const recorded = { roleSnapshot: { name: original.name } }
  assert.equal(taskOwnerName({ run: undefined, task, roles }), '最新名称')
  assert.equal(taskOwnerName({ run: recorded, task, roles }), '原名称')
  assert.deepEqual(recorded, { roleSnapshot: { name: '原名称' } })
  assert.deepEqual(original, { id, version: 1, name: '原名称' })
})
