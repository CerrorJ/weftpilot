import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { latestVersions } from './object-versions'
import { PageHeading } from './page-heading'
import { TeamEditor } from './team-editor'
import { TeamCard } from './team-card'
import { useTeamCatalogFocus } from './use-team-catalog-focus'
import './team-catalog.css'

export const TeamSetup = ({
  state,
  actions,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const teams = latestVersions(state.teams)
  const selection = useTeamCatalogFocus(teams)
  return (
    <div className="team-page" ref={selection.root}>
      <PageHeading
        title="团队管理"
        description="选好成员，定义由谁负责、如何协作。"
        eyebrow="TEAMS / COLLABORATION"
      >
        <TeamEditor
          roles={latestVersions(state.roles)}
          actions={actions}
          saved={(team) => selection.created(team.id)}
        />
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <section className="team-catalog" aria-label={t('团队列表')}>
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} state={state} actions={actions} />
        ))}
      </section>
      {!teams.length && (
        <section className="empty-state">
          <h2>{t('还没有团队')}</h2>
          <p>{t('选择已有角色和负责人，组建第一个真实团队。')}</p>
        </section>
      )}
      <p className="field-note">
        {t('项目关联团队身份；计划固定团队版本。角色变更和团队编辑不会改写已有执行。')}
      </p>
    </div>
  )
}
