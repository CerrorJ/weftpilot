import { useState } from 'react'
import type {
  RoleVersion,
  WorkspaceSnapshot,
  RoleReadiness,
  Run,
} from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { RunActivity } from './run-activity'
import { runLabel } from './task-status'
const labels: Record<RoleReadiness['state'], string> = {
  draft: '待试运行',
  trial_running: '试运行中',
  ready: '试运行通过',
  disabled: '已停用',
}
interface Context {
  role: RoleVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}
interface Health {
  readiness: RoleReadiness | undefined
  run: Run | undefined
}

export const RoleHealth = ({ role, state, actions }: Context) => {
  const { t } = useI18n()
  const readiness = state.roleReadiness.find(
    (item) => item.roleId === role.id && item.roleVersion === role.version,
  )
  const run = state.runs.find((item) => item.id === readiness?.latestTrialRunId)
  if (state.roles.some((item) => item.id === role.id && item.version > role.version))
    return (
      <article className="role-health">
        <strong>
          {role.name} · v{role.version}
        </strong>
        <p role="status">
          {t('此配置已有新版本，请关闭并选择当前配置；旧版本不能用于新的试运行或启用。')}
        </p>
      </article>
    )
  return (
    <article className="role-health">
      <div className="section-heading">
        <strong>
          {role.name} · v{role.version} · {role.cli}
        </strong>
        <span className="badge">
          {t(readiness ? labels[readiness.state] : '待试运行')} ·{' '}
          {t(readiness?.enabled ? '已启用' : '未启用')}
        </span>
      </div>
      <RoleTrialControls
        role={role}
        state={state}
        actions={actions}
        readiness={readiness}
        run={run}
      />
      {readiness?.failureCode && <p role="alert">{readiness.failureCode}</p>}
      {run && (
        <details>
          <summary>
            {t('试运行记录')} · {t(runLabel(run))}
          </summary>
          <code>{run.id}</code>
          <RunActivity runId={run.id} cursor={state.cursor} />
        </details>
      )}
    </article>
  )
}
const RoleTrialControls = ({ role, state, actions, readiness, run }: Context & Health) => {
  const { t } = useI18n()
  const [project, setProject] = useState('')
  const projectId = project || state.projects[0]?.id || ''
  const active = run ? run.processState !== 'confirmed_ended' : false
  return (
    <>
      <label>
        {t('试运行项目')}
        <select value={projectId} onChange={(event) => setProject(event.target.value)}>
          {!state.projects.length && <option value="">{t('请先添加项目')}</option>}
          {state.projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="run-controls">
        <button
          disabled={actions.busy || !projectId || active}
          onClick={() => {
            void actions.execute({
              type: 'role.trial',
              roleId: role.id,
              expectedRoleVersion: role.version,
              projectId,
            })
          }}
        >
          {t('真实试运行')}
        </button>
        {readiness && <RoleEnable role={role} readiness={readiness} actions={actions} />}
        <TrialStop run={run} actions={actions} />
      </div>
    </>
  )
}
const TrialStop = ({ run, actions }: { run: Run | undefined; actions: WorkspaceActions }) => {
  const { t } = useI18n()
  if (!run || !['queued', 'preparing', 'running'].includes(run.status)) return null
  return (
    <button
      disabled={actions.busy}
      onClick={() => {
        void actions.execute({ type: 'run.stop', runId: run.id, expectedVersion: run.version })
      }}
    >
      {t('请求停止')}
    </button>
  )
}
const RoleEnable = ({
  role,
  readiness,
  actions,
}: {
  role: RoleVersion
  readiness: RoleReadiness
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <button
      disabled={actions.busy || (!readiness.enabled && readiness.state !== 'ready')}
      onClick={() => {
        void actions.execute({
          type: 'role.setEnabled',
          roleId: role.id,
          expectedRoleVersion: role.version,
          expectedReadinessVersion: readiness.version,
          enabled: !readiness.enabled,
        })
      }}
    >
      {readiness.enabled ? t('停用角色') : t('启用角色')}
    </button>
  )
}
