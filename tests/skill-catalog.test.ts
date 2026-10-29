import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import type { SkillImport, SkillPackage } from '@weftpilot/agent-team-kernel/protocol'
import { skillCatalog, filterSkillCatalog } from '../apps/desktop/renderer/skill-catalog'

const skill = (): SkillPackage => ({
  id: randomUUID(),
  version: 1,
  name: 'User Skill 名称',
  description: 'User-authored content',
  source: {
    id: randomUUID(),
    version: 1,
    name: 'My Source',
    repository: 'https://github.com/owner/repo',
    commit: 'a'.repeat(40),
    createdAt: new Date().toISOString(),
  },
  directory: 'skills/proof',
  instructions: 'Read the pinned proof.',
  licensePath: 'LICENSE',
  licenseText: 'MIT',
  files: [{ path: 'SKILL.md', size: 22, sha256: 'b'.repeat(64) }],
  digest: 'c'.repeat(64),
  available: true,
  installedAt: new Date().toISOString(),
})
const imported = (value: SkillPackage): SkillImport => ({
  id: value.id,
  version: 3,
  source: value.source,
  directory: value.directory,
  licensePath: value.licensePath,
  comparisonPackageId: null,
  state: 'installed',
  package: { ...value, available: false },
  failureCode: null,
  createdAt: value.installedAt,
  updatedAt: value.installedAt,
})

test('目录合并导入与安装时服从当前卸载状态，不因旧预览而重新放行，也不改写输入', () => {
  const value = skill()
  const state = { skills: [{ ...value, available: false }], skillImports: [imported(value)] }
  const original = JSON.stringify(state)
  const entries = skillCatalog(state)
  assert.equal(entries.length, 1)
  assert.equal(entries[0]!.installed!.available, false)
  assert.equal(entries[0]!.package!.available, false)
  assert.deepEqual(filterSkillCatalog(entries, { installed: true, source: '', query: '' }), [])
  assert.equal(JSON.stringify(state), original)
})

test('不同摘要和来源版本分别保留，搜索不翻译用户内容，来源筛选跨版本使用稳定ID', () => {
  const first = skill()
  const second = {
    ...first,
    id: randomUUID(),
    digest: 'd'.repeat(64),
    source: { ...first.source, version: 2, commit: 'e'.repeat(40) },
  }
  const entries = skillCatalog({
    skills: [first, second],
    skillImports: [imported(first), imported(second)],
  })
  assert.equal(entries.length, 2)
  assert.equal(
    filterSkillCatalog(entries, {
      installed: false,
      source: first.source.id,
      query: ' user SKILL 名称 ',
    }).length,
    2,
  )
  assert.equal(
    filterSkillCatalog(entries, { installed: false, source: '', query: second.source.commit })
      .length,
    1,
  )
  assert.equal(
    filterSkillCatalog(entries, { installed: false, source: randomUUID(), query: '' }).length,
    0,
  )
  assert.equal(first.name, 'User Skill 名称')
})

test('失败导入仍可查确切来源；没有内容的记录不被当成已安装，空内核不生成示例条目', () => {
  const failed = {
    ...imported(skill()),
    package: null,
    state: 'failed' as const,
    failureCode: 'SKILL_DOWNLOAD_FAILED',
  }
  const entries = skillCatalog({ skills: [], skillImports: [failed] })
  assert.equal(entries[0]!.imported!.failureCode, 'SKILL_DOWNLOAD_FAILED')
  assert.equal(entries[0]!.package, undefined)
  assert.equal(filterSkillCatalog(entries, { installed: true, source: '', query: '' }).length, 0)
  assert.deepEqual(skillCatalog({ skills: [], skillImports: [] }), [])
})
