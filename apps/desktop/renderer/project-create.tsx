import { useRef, useState } from 'react'
import type { TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import { latestVersions } from './object-versions'
import { ProjectContextFields, projectFormContext } from './project-context-fields'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { CreateDialog } from './create-dialog'
import { CreationMark } from './creation-mark'
import { formText, TextField } from './form-fields'

export const ProjectCreate = ({
  actions,
  created,
  teams,
}: {
  actions: WorkspaceActions
  created: (id: string) => void
  teams: TeamVersion[]
}) => (
  <CreateDialog title="新建项目" triggerIcon={<CreationMark />} error={actions.error}>
    {(close) => (
      <ProjectCreateForm
        actions={actions}
        teams={teams}
        created={(id) => {
          close()
          created(id)
        }}
      />
    )}
  </CreateDialog>
)

const ProjectCreateForm = ({
  actions,
  created,
  teams,
}: {
  actions: WorkspaceActions
  created: (id: string) => void
  teams: TeamVersion[]
}) => {
  const { t } = useI18n()
  const [basisTeams] = useState(() => latestVersions(teams))
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    const values = new FormData(form)
    submitting.current = true
    setPending(true)
    try {
      const result = await actions.createProject({
        name: formText(values, 'name'),
        defaultBranch: formText(values, 'branch'),
        ...projectFormContext(values),
      })
      if (result && 'id' in result && form.isConnected) created(result.id)
    } finally {
      submitting.current = false
      if (form.isConnected) setPending(false)
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)}>
      <p className="field-note">
        {t('选择已有 Git 仓库；每次执行使用独立分支与工作目录，主目录有未提交改动时阻止启动。')}
      </p>
      <TextField label={t('项目名称')} name="name" />
      <TextField label={t('默认分支')} name="branch" value="main" />
      <ProjectContextFields teams={basisTeams} />
      <button className="primary" disabled={pending || actions.busy}>
        {t(pending ? '正在添加项目…' : '选择仓库并添加')}
      </button>
    </form>
  )
}
