import type { SkillCatalogEntry } from './skill-catalog'
import { NavigationIcon } from './navigation-icon'
import { useI18n } from './preferences'

export const skillCatalogStatus = (entry: SkillCatalogEntry): string => {
  if (entry.installed) return entry.installed.available ? '已安装' : '已卸载，历史保留'
  const state = entry.imported?.state
  if (state === 'failed') return '导入失败'
  if (state === 'preview_ready') return '待确认安装'
  if (state === 'activating') return '正在安装并核对'
  if (state === 'fetching') return '正在下载并校验'
  return '等待下载'
}

export const SkillCatalogCard = ({
  entry,
  open,
}: {
  entry: SkillCatalogEntry
  open: () => void
}) => {
  const { t } = useI18n()
  return (
    <article className="skill-catalog-card" data-catalog-id={entry.id}>
      <div className="skill-card-heading">
        <span className="skill-catalog-icon">
          <NavigationIcon name="skills" />
        </span>
        <div>
          <h2>{entry.package?.name ?? entry.directory}</h2>
          <small>
            {entry.source.name} · v{entry.source.version}
          </small>
        </div>
      </div>
      <p className="skill-card-description">
        {entry.package?.description ?? t('下载完成后可核对完整说明和许可证。')}
      </p>
      <p className="skill-card-source">{entry.source.repository}</p>
      <p className="skill-card-version">
        <code>{entry.source.commit.slice(0, 10)}</code>
        <span>{t(skillCatalogStatus(entry))}</span>
      </p>
      <div className="skill-card-bottom">
        <small>{t('固定来源与版本')}</small>
        <button onClick={open}>{t('查看详情')}</button>
      </div>
    </article>
  )
}
