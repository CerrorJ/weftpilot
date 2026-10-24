import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { initialRoleDraft, readRoleDraft, roleDraftKey } from '../apps/desktop/renderer/role-draft'

test('角色表单草稿绑定编辑起始版本；读最新配置不能静默覆盖旧草稿，旧格式补充缺省但不写存储', () => {
  const role: RoleVersion = {
    id: randomUUID(),
    version: 1,
    name: '原角色',
    responsibility: '职责',
    cli: 'codex',
    model: '',
    skills: [],
    permission: 'read-only',
    createdAt: new Date().toISOString(),
    slug: 'draft-unit-role',
    maxConcurrency: 2,
  }
  const original = initialRoleDraft(role)
  const current = initialRoleDraft({ ...role, version: 2, name: '新的共享版本' })
  assert.equal(roleDraftKey(role), roleDraftKey({ ...role, version: 2 }))
  const values = new Map([
    [roleDraftKey(role), JSON.stringify({ ...original, name: '保留的修改', step: 2 })],
  ])
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: { getItem: (key: string) => values.get(key) ?? null },
  })
  try {
    const key = roleDraftKey(role)
    const stored = values.get(key)
    assert.equal(readRoleDraft(key, current)?.baseVersion, 1)
    assert.equal(readRoleDraft(key, current)?.name, '保留的修改')
    assert.equal(values.get(key), stored)
    values.delete(key)
    const legacy = {
      name: original.name,
      responsibility: original.responsibility,
      cli: original.cli,
      profile: original.profile,
      model: original.model,
      permission: original.permission,
      skills: original.skills,
    }
    values.set(`${key}.1`, JSON.stringify(legacy))
    const restored = readRoleDraft(key, original)!
    assert.equal(restored.slug, role.slug)
    assert.equal(restored.maxConcurrency, 2)
    assert.equal(restored.baseVersion, 1)
    assert.equal(values.has(key), false)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous)
    else Reflect.deleteProperty(globalThis, 'sessionStorage')
  }
})
