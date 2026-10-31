import type { SkillCatalogEntry } from './skill-catalog'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { SkillImports, SkillPreview, SkillAvailability } from './skill-versions'
import { useI18n } from './preferences'

export const SkillCatalogDetail = ({
  entry,
  actions,
  close,
  openImport,
}: {
  entry: SkillCatalogEntry
  actions: WorkspaceActions
  close: () => void
  openImport: (id: string) => void
}) => (
  <CreateDialog
    key={entry.id}
    title="技能版本详情"
    error=""
    autoOpen
    hideTrigger
    closeIcon
    onClosed={close}
  >
    {() => <SkillCatalogContent entry={entry} actions={actions} openImport={openImport} />}
  </CreateDialog>
)

const SkillCatalogContent = ({
  entry,
  actions,
  openImport,
}: {
  entry: SkillCatalogEntry
  actions: WorkspaceActions
  openImport: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="skill-catalog-detail">
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <dl className="object-facts">
        <dt>{t('公共仓库地址')}</dt>
        <dd>
          <code>{entry.source.repository}</code>
        </dd>
        <dt>{t('固定提交（40位 SHA）')}</dt>
        <dd>
          <code>{entry.source.commit}</code>
        </dd>
        <dt>{t('技能目录（仓库内）')}</dt>
        <dd>
          <code>{entry.directory}</code>
        </dd>
      </dl>
      {entry.imported ? (
        <SkillImports
          imports={[entry.imported]}
          skills={actions.state?.skills ?? []}
          actions={actions}
          openImport={openImport}
        />
      ) : (
        entry.package && <SkillPreview skill={entry.package} previous={undefined} />
      )}
      {entry.installed && <SkillAvailability skill={entry.installed} actions={actions} />}
    </div>
  )
}
