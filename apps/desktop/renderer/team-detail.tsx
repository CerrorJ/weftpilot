import { useId, useRef, useState, type RefObject } from 'react'
import type { RoleVersion, TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { useI18n } from './preferences'
import { TeamEditor } from './team-editor'
import { TeamMembers } from './team-members'

interface Context {
  team: TeamVersion
  versions: TeamVersion[]
  roles: RoleVersion[]
  actions: WorkspaceActions
}

export const TeamDetail = (props: Context) => (
  <CreateDialog title="团队详情" trigger="查看团队" primary={false} closeIcon error="">
    {() => <TeamDetailContent {...props} />}
  </CreateDialog>
)

const TeamDetailContent = ({ team, versions, roles, actions }: Context) => {
  const { t, language } = useI18n()
  const [version, setVersion] = useState(team.version)
  const selector = useRef<HTMLSelectElement>(null)
  const selected = versions.find((item) => item.version === version)
  return (
    <section className="team-detail">
      <TeamVersionSelector
        versions={versions}
        version={version}
        change={setVersion}
        reference={selector}
      />
      {selected ? (
        <>
          <div className="team-detail-heading">
            <h3>{selected.name}</h3>
            <span className="badge">v{selected.version}</span>
          </div>
          <p className="preserve-text">{selected.description || t('尚未记录团队说明')}</p>
          <p className="field-note">
            {t('版本创建时间')} · {new Date(selected.createdAt).toLocaleString(language)}
          </p>
          <TeamMembers team={selected} roles={roles} />
          <p className="field-note">
            {t('成员ID与负责人属于所选团队版本；角色资料展示当前配置，每次执行另有固定快照。')}
          </p>
          {selected.version !== team.version && (
            <p role="status">{t('历史版本只读，请选择当前版本后编辑。')}</p>
          )}
          <TeamEditor
            team={selected}
            roles={roles}
            actions={actions}
            disabled={selected.version !== team.version}
            saved={(result) => setVersion(result.version)}
            onClosed={() => {
              if (selected.version !== team.version) selector.current?.focus()
            }}
          />
        </>
      ) : (
        <p role="status">{t('正在读取团队版本…')}</p>
      )}
    </section>
  )
}

const TeamVersionSelector = ({
  versions,
  version,
  change,
  reference,
}: {
  versions: TeamVersion[]
  version: number
  change: (value: number) => void
  reference: RefObject<HTMLSelectElement | null>
}) => {
  const { t } = useI18n()
  const label = useId()
  return (
    <label>
      <span id={label}>{t('团队历史版本')}</span>
      <select
        ref={reference}
        aria-labelledby={label}
        value={version}
        onChange={(event) => change(Number(event.target.value))}
      >
        {[...versions].reverse().map((item) => (
          <option key={item.version} value={item.version}>
            v{item.version} · {item.name}
          </option>
        ))}
      </select>
    </label>
  )
}
