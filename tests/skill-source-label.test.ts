import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SkillSource } from '@weftpilot/agent-team-kernel/protocol'
import { skillSourceLabel } from '../apps/desktop/renderer/skill-source-label'

test('同名同仓库同提交的来源仍可区分，短ID冲突延长；同一来源历史不制造冲突', () => {
  const first: SkillSource = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    version: 1,
    name: '相同名称',
    repository: 'https://github.com/owner/repo',
    commit: 'b'.repeat(40),
    createdAt: new Date().toISOString(),
  }
  const second = { ...first, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' }
  const sources = [first, second]
  assert.notEqual(skillSourceLabel(first, sources), skillSourceLabel(second, sources))
  assert.ok(skillSourceLabel(first, sources).startsWith(first.id))
  assert.ok(skillSourceLabel(second, sources).startsWith(second.id))
  assert.equal(skillSourceLabel(first, [first, { ...first, version: 2 }]), first.name)
  assert.deepEqual(sources, [first, second])
})
