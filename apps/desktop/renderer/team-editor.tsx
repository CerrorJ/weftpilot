import { useState } from 'react'
import type { RoleVersion, TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { TextField } from './form-fields'
import { useI18n } from './preferences'
import { TeamMemberFields } from './team-member-fields'
import { CreationMark } from './creation-mark'
import { useTeamSubmission, type SavedTeam } from './use-team-submission'

interface Context {
  team?: TeamVersion
  roles: RoleVersion[]
  actions: WorkspaceActions
  saved: (team: SavedTeam) => void
  disabled?: boolean
  onClosed?: () => void
}

export const TeamEditor = (props: Context) => {
  const [error, setError] = useState('')
  return (
    <CreateDialog
      title={props.team ? '编辑团队' : '创建团队'}
      trigger={props.team ? '编辑当前版本' : '创建团队'}
      triggerIcon={props.team ? undefined : <CreationMark />}
      disabled={props.disabled ?? false}
      error={error || props.actions.error}
      onClosed={() => {
        setError('')
        props.onClosed?.()
      }}
    >
      {(close) => (
        <TeamEditorForm
          {...props}
          reportError={setError}
          saved={(team) => {
            close()
            props.saved(team)
          }}
        />
      )}
    </CreateDialog>
  )
}

const TeamEditorForm = ({
  team,
  roles,
  actions,
  saved,
  reportError,
}: Context & { reportError: (error: string) => void }) => {
  const { t } = useI18n()
  const { basis, leader, members, changeLeader, setMembers } = useTeamDraft(team, roles)
  const submit = useTeamSubmission({ actions, team: basis.team, saved, reportError })
  return (
    <form onSubmit={(event) => void submit(event)}>
      <TeamConfigurationFields team={basis.team} />
      <TeamMemberFields
        roles={basis.roles}
        leader={leader}
        members={members}
        changeLeader={changeLeader}
        changeMembers={setMembers}
      />
      <p className="field-note">
        {t(
          '负责人自动加入团队。保存只新增配置版本，不启用角色或启动任务；已有计划与执行保留原快照。',
        )}
      </p>
      <button className="primary" disabled={actions.busy || !leader || members.length > 12}>
        {t(basis.team ? '保存新版本' : '创建团队')}
      </button>
    </form>
  )
}

const useTeamDraft = (team: TeamVersion | undefined, roles: RoleVersion[]) => {
  // 打开时固定版本和成员选项；背景轮询不得换用新版本或重置未保存输入。
  const [basis] = useState(() => ({ team, roles }))
  const [leader, setLeader] = useState(basis.team?.coordinatorRoleId ?? basis.roles[0]?.id ?? '')
  const [members, setMembers] = useState(basis.team?.roleIds ?? (leader ? [leader] : []))
  const changeLeader = (id: string) => {
    setLeader(id)
    setMembers((current) => (current.includes(id) ? current : [...current, id]))
  }
  return { basis, leader, members, changeLeader, setMembers }
}

const TeamConfigurationFields = ({ team }: { team: TeamVersion | undefined }) => {
  const { t } = useI18n()
  return (
    <>
      {team && (
        <p className="field-note">
          {t('编辑团队版本')} · v{team.version}
        </p>
      )}
      <TextField label={t('团队名称')} name="name" value={team?.name ?? ''} />
      <TextField
        label={t('团队说明')}
        name="description"
        value={team?.description ?? ''}
        multiline
        optional
      />
    </>
  )
}
