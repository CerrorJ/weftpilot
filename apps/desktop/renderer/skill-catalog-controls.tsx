import type { SkillSource } from '@weftpilot/agent-team-kernel/protocol'
import { latestVersions } from './object-versions'
import { useI18n } from './preferences'
import { skillSourceLabel } from './skill-source-label'

export interface SkillCatalogFilter {
  installed: boolean
  query: string
  source: string
}

export const SkillCatalogControls = ({
  filter,
  change,
  count,
  sources,
}: {
  filter: SkillCatalogFilter
  change: (filter: SkillCatalogFilter) => void
  count: number
  sources: SkillSource[]
}) => {
  const { t } = useI18n()
  return (
    <div className="skill-catalog-toolbar">
      <div className="skill-catalog-tabs" aria-label={t('技能视图')}>
        <button
          aria-pressed={!filter.installed}
          onClick={() => change({ ...filter, installed: false })}
        >
          {t('技能市场')}
        </button>
        <button
          aria-pressed={filter.installed}
          onClick={() => change({ ...filter, installed: true })}
        >
          {t('已安装')} <span className="tab-count">{count}</span>
        </button>
      </div>
      <SkillSourceFilter
        sources={sources}
        selected={filter.source}
        change={(source) => change({ ...filter, source })}
      />
      <label className="skill-catalog-search">
        <span className="visually-hidden">{t('搜索技能')}</span>
        <input
          type="search"
          value={filter.query}
          placeholder={t('搜索 Skills…')}
          onChange={(event) => change({ ...filter, query: event.target.value })}
        />
      </label>
    </div>
  )
}

const SkillSourceFilter = ({
  sources,
  selected,
  change,
}: {
  sources: SkillSource[]
  selected: string
  change: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <label className="skill-catalog-source">
      <span className="visually-hidden">{t('筛选技能源')}</span>
      <select value={selected} onChange={(event) => change(event.target.value)}>
        <option value="">{t('全部来源')}</option>
        {latestVersions(sources).map((source) => (
          <option key={source.id} value={source.id}>
            {skillSourceLabel(source, latestVersions(sources))}
          </option>
        ))}
      </select>
    </label>
  )
}
