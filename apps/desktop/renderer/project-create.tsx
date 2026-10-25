import { useRef, useState } from 'react'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { CreateDialog } from './create-dialog'
import { CreationMark } from './creation-mark'

export const ProjectCreate = ({
  actions,
  created,
}: {
  actions: WorkspaceActions
  created: (id: string) => void
}) => (
  <CreateDialog title="新建项目" triggerIcon={<CreationMark />} error={actions.error}>
    {(close) => (
      <ProjectCreateForm
        actions={actions}
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
}: {
  actions: WorkspaceActions
  created: (id: string) => void
}) => {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('main')
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    submitting.current = true
    setPending(true)
    try {
      const result = await actions.createProject({ name, defaultBranch: branch })
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
      <ProjectRepositoryFields
        name={name}
        branch={branch}
        changeName={setName}
        changeBranch={setBranch}
      />
      <button className="primary" disabled={pending || actions.busy}>
        {t(pending ? '正在添加项目…' : '选择仓库并添加')}
      </button>
    </form>
  )
}

const ProjectRepositoryFields = ({
  name,
  branch,
  changeName,
  changeBranch,
}: {
  name: string
  branch: string
  changeName: (value: string) => void
  changeBranch: (value: string) => void
}) => {
  const { t } = useI18n()
  return (
    <>
      <label>
        {t('项目名称')}
        <input
          required
          maxLength={200}
          value={name}
          onChange={(event) => changeName(event.target.value)}
        />
      </label>
      <label>
        {t('默认分支')}
        <input
          required
          maxLength={200}
          value={branch}
          onChange={(event) => changeBranch(event.target.value)}
        />
      </label>
    </>
  )
}
