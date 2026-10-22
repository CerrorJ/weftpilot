import { useI18n } from './preferences'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { ProjectSetup } from './project-setup'
import { RoleSetup } from './role-setup'
import { TaskCreate } from './task-create'
import { TaskWorkspace } from './task-workspace'
const latestRoles = (roles: RoleVersion[]) => {
  const latest = new Map<string, RoleVersion>()
  for (const role of roles) {
    if ((latest.get(role.id)?.version ?? 0) < role.version) latest.set(role.id, role)
  }
  return [...latest.values()]
}
export const WorkflowPage = ({ setup, actions }: { setup: boolean; actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const { state, error, busy } = actions
  const roles = latestRoles(state?.roles ?? [])
  return (
    <>
      <header>
        <div>
          <h1>{setup ? t('项目与角色') : t('任务与交付')}</h1>
          <p>
            {setup
              ? t('连接本机 Git 仓库，为真实执行配置职责与权限。')
              : t('从明确目标出发，执行结果由你验收。')}
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => {
            void actions.refresh()
          }}
        >
          {t('刷新状态')}
        </button>
      </header>
      {error && <p role="alert">{t(error)}</p>}
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : setup ? (
        <>
          <ProjectSetup projects={state.projects} actions={actions} />
          <RoleSetup roles={roles} actions={actions} />
        </>
      ) : (
        <>
          <TaskCreate projects={state.projects} roles={roles} actions={actions} />
          <TaskWorkspace state={state} actions={actions} />
        </>
      )}
    </>
  )
}
