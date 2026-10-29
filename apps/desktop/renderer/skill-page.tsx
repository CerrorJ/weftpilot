import { useState } from 'react'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { PageHeading } from './page-heading'
import { CreateDialog } from './create-dialog'
import { CreationMark } from './creation-mark'
import { SkillSources } from './skill-sources'
import { skillCatalog, filterSkillCatalog, type SkillCatalogEntry } from './skill-catalog'
import { SkillCatalogControls, type SkillCatalogFilter } from './skill-catalog-controls'
import { SkillCatalogCard } from './skill-catalog-card'
import { SkillCatalogDetail } from './skill-catalog-detail'
import './skills.css'
import './skill-catalog.css'

export const SkillPage = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [filter, change] = useState<SkillCatalogFilter>({ installed: false, query: '', source: '' })
  const [selected, select] = useState('')
  const state = actions.state
  const entries = state ? skillCatalog(state) : []
  const visible = filterSkillCatalog(entries, filter)
  const entry = entries.find((item) => item.id === selected)
  return (
    <section className="skill-catalog-page">
      <PageHeading
        title="技能中心"
        description="为角色补充能力，从安装到引用都在这里完成。"
        eyebrow="SKILLS / EXTENSIONS"
      >
        <SkillSourceDialog actions={actions} imported={select} />
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <>
          <SkillCatalogControls
            filter={filter}
            change={change}
            sources={state.skillSources}
            count={state.skills.filter((skill) => skill.available).length}
          />
          <SkillCatalogResults entries={visible} filter={filter} select={select} />
          <p className="field-note">
            {t('目录仅展示已下载或安装的真实版本。添加公共来源并预览后，才能确认安装。')}
          </p>
          <p className="field-note">
            {t('外部依赖、CLI 兼容性和账号授权须按技能说明分别核对。安装不会扩大角色权限。')}
          </p>
        </>
      )}
      {entry && <SkillCatalogDetail entry={entry} actions={actions} close={() => select('')} />}
    </section>
  )
}

const SkillCatalogResults = ({
  entries,
  filter,
  select,
}: {
  entries: SkillCatalogEntry[]
  filter: SkillCatalogFilter
  select: (id: string) => void
}) =>
  entries.length ? (
    <div className="skill-catalog-grid">
      {entries.map((item) => (
        <SkillCatalogCard key={item.id} entry={item} open={() => select(item.id)} />
      ))}
    </div>
  ) : (
    <SkillCatalogEmpty filtered={!!filter.query || !!filter.source} installed={filter.installed} />
  )

const SkillSourceDialog = ({
  actions,
  imported,
}: {
  actions: WorkspaceActions
  imported: (id: string) => void
}) => (
  <CreateDialog
    title="管理技能源"
    trigger="添加来源 / 预览技能"
    error={actions.error}
    triggerIcon={<CreationMark />}
  >
    {(close) => (
      <SkillSources
        sources={actions.state?.skillSources ?? []}
        actions={actions}
        imported={(id) => {
          close()
          imported(id)
        }}
      />
    )}
  </CreateDialog>
)

const SkillCatalogEmpty = ({ filtered, installed }: { filtered: boolean; installed: boolean }) => {
  const { t } = useI18n()
  return (
    <section className="empty-state">
      <h2>
        {t(filtered ? '没有找到匹配的技能' : installed ? '尚未安装技能' : '从一个可信来源开始')}
      </h2>
      <p>
        {t(
          filtered
            ? '调整搜索内容或来源筛选，查看其他固定版本。'
            : '添加你已核验许可的公共来源，先查看说明与许可证，再确认安装。',
        )}
      </p>
    </section>
  )
}
