import { useRef, useState } from 'react'
import type { Project, TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { ProjectContextFields, projectFormContext } from './project-context-fields'

interface Context {
  project: Project
  teams: TeamVersion[]
  actions: WorkspaceActions
}

export const ProjectSettings = (props: Context) => (
  <CreateDialog title="项目设置" primary={false} error={props.actions.error}>
    {(close) => <ProjectSettingsForm {...props} close={close} />}
  </CreateDialog>
)

const ProjectSettingsForm = ({
  project,
  teams,
  actions,
  close,
}: Context & { close: () => void }) => {
  const { t } = useI18n()
  // 轮询不能更换本次编辑的 CAS 基准或表单选项；冲突时保留用户输入。
  const [basis] = useState(() => ({ project, teams }))
  const pending = useRef(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current) return
    const element = event.currentTarget
    const form = new FormData(element)
    pending.current = true
    try {
      const result = await actions.execute({
        type: 'project.configure',
        projectId: basis.project.id,
        expectedVersion: basis.project.version,
        name: formText(form, 'name'),
        ...projectFormContext(form),
      })
      if (result && element.isConnected) close()
    } finally {
      pending.current = false
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)}>
      <p className="field-note">
        {t('编辑项目版本')} · v{basis.project.version}
      </p>
      <TextField label={t('项目名称')} name="name" value={basis.project.name} />
      <ProjectContextFields project={basis.project} teams={basis.teams} />
      <button className="primary" disabled={actions.busy}>
        {t('保存项目设置')}
      </button>
    </form>
  )
}
