import type {
  SkillImport,
  SkillPackage,
  WorkspaceSnapshot,
} from '@weftpilot/agent-team-kernel/protocol'

export interface SkillCatalogEntry {
  id: string
  source: SkillImport['source']
  directory: string
  imported?: SkillImport
  installed?: SkillPackage
  package?: SkillPackage
}

/** 目录只投影内核已下载或安装的版本，不制造远程市场条目或兼容性证明。 */
export const skillCatalog = (
  state: Pick<WorkspaceSnapshot, 'skills' | 'skillImports'>,
): SkillCatalogEntry[] => {
  const installed = new Map(state.skills.map((skill) => [skill.id, skill]))
  const entries = state.skillImports.map((item): SkillCatalogEntry => {
    const skill = installed.get(item.id)
    const contents = skill ?? item.package
    installed.delete(item.id)
    return {
      id: item.id,
      source: item.source,
      directory: item.directory,
      imported: item,
      ...(skill ? { installed: skill } : {}),
      ...(contents ? { package: contents } : {}),
    }
  })
  for (const skill of installed.values())
    entries.push({
      id: skill.id,
      source: skill.source,
      directory: skill.directory,
      installed: skill,
      package: skill,
    })
  return entries.reverse()
}

export const filterSkillCatalog = (
  entries: SkillCatalogEntry[],
  filter: { installed: boolean; source: string; query: string },
): SkillCatalogEntry[] => {
  const query = filter.query.trim().toLocaleLowerCase()
  return entries.filter((entry) => {
    if (filter.installed && !entry.installed?.available) return false
    if (filter.source && entry.source.id !== filter.source) return false
    return [
      entry.package?.name,
      entry.package?.description,
      entry.source.name,
      entry.source.repository,
      entry.source.commit,
      entry.directory,
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
}
