import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { initialRoleDraft, roleDraftKey } from '../apps/desktop/renderer/role-draft'
import {
  newRoleDraftTarget,
  readRoleDraftEntries,
} from '../apps/desktop/renderer/role-draft-entries'

test('新建使用独立键，继续索引保留旧new与编辑草稿的起始版本；读取无写入', () => {
  const role: RoleVersion = {
    id: randomUUID(),
    version: 1,
    name: '来源',
    responsibility: '职责',
    cli: 'codex',
    model: '',
    skills: [],
    permission: 'read-only',
    slug: 'draft-entries',
    createdAt: new Date().toISOString(),
  }
  const draft = initialRoleDraft(undefined)
  const first = newRoleDraftTarget()
  const second = newRoleDraftTarget()
  assert.notEqual(first, second)
  const values = new Map([
    [roleDraftKey(undefined), JSON.stringify({ ...draft, name: '旧new草稿' })],
    [roleDraftKey(undefined, first), JSON.stringify({ ...draft, name: '独立A' })],
    [roleDraftKey(undefined, second), JSON.stringify({ ...draft, name: '独立B' })],
    [roleDraftKey(role), JSON.stringify({ ...initialRoleDraft(role), name: '旧版编辑' })],
    ['weftpilot.role-draft.new.not-valid', JSON.stringify(draft)],
    ['weftpilot.role-draft.invalid', '{broken'],
  ])
  withStorage(values, () => {
    const before = [...values]
    const entries = readRoleDraftEntries([{ ...role, version: 2 }])
    assert.equal(entries.length, 4)
    assert.deepEqual(
      entries.find((item) => item.target === role.id),
      {
        target: role.id,
        name: '旧版编辑',
        baseVersion: 1,
        unavailable: false,
      },
    )
    assert.deepEqual(
      entries
        .filter((item) => item.baseVersion === 0)
        .map((item) => item.name)
        .sort(),
      ['旧new草稿', '独立A', '独立B'].sort(),
    )
    assert.equal(
      readRoleDraftEntries([]).find((item) => item.target === role.id)?.unavailable,
      true,
    )
    assert.deepEqual([...values], before)
  })
})

const withStorage = (values: Map<string, string>, action: () => void) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      get length() {
        return values.size
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
    },
  })
  try {
    action()
  } finally {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous)
    else Reflect.deleteProperty(globalThis, 'sessionStorage')
  }
}
