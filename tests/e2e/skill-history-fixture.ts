import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { createKernel } from '@weftpilot/agent-team-kernel/kernel'
import { skillPackageSchema, type SkillPackage } from '@weftpilot/agent-team-kernel/protocol'
import { createFixture } from './workflow-helpers'

/** 仅准备旧技能展示记录；无真实下载/安装或资源证明，禁止把本夹具用于Run。 */
export const prepareSkillHistory = async () => {
  const fixture = await createFixture()
  const kernel = createKernel({
    dataDirectory: join(fixture.data, 'kernel'),
    sourceCommit: '2750d66321d4920745c2f3f2a88428fcc73f78bd',
  })
  await kernel.shutdown()
  const database = new DatabaseSync(join(fixture.data, 'kernel/kernel.sqlite'))
  const first = historySkill('受控旧技能A')
  const second = historySkill('受控旧技能B')
  try {
    database.exec('BEGIN IMMEDIATE')
    for (const skill of [first, second]) {
      database
        .prepare('INSERT INTO skill_sources (id,version,data) VALUES (?,?,?)')
        .run(skill.source.id, 1, JSON.stringify(skill.source))
      database
        .prepare('INSERT INTO skill_packages (id,version,data) VALUES (?,?,?)')
        .run(skill.id, 1, JSON.stringify(skill))
    }
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  } finally {
    database.close()
  }
  return { ...fixture, first, second }
}

const historySkill = (name: string): SkillPackage =>
  skillPackageSchema.parse({
    id: randomUUID(),
    version: 1,
    name,
    description: '受控历史展示，不代表实际下载或安装。',
    source: {
      id: randomUUID(),
      version: 1,
      name: '受控历史来源',
      repository: 'https://github.com/CerrorJ/weftpilot',
      commit: 'a'.repeat(40),
      createdAt: new Date().toISOString(),
    },
    directory: 'skills/controlled-history',
    instructions: 'CONTROLLED HISTORY FOR FOCUS ONLY',
    licensePath: 'LICENSE',
    licenseText: 'CONTROLLED LICENSE TEXT',
    files: [
      { path: 'SKILL.md', size: 1, sha256: 'b'.repeat(64) },
      { path: 'LICENSE', size: 1, sha256: 'c'.repeat(64) },
    ],
    digest: 'd'.repeat(64),
    available: true,
    installedAt: new Date().toISOString(),
  })
