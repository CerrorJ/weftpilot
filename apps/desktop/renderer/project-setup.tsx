import { useI18n } from './preferences'
import { useState } from 'react'
import type { Project } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
export const ProjectSetup = ({
  projects,
  actions,
}: {
  projects: Project[]
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('main')
  return (
    <section className="setup-section" aria-labelledby="projects-heading">
      <h2 id="projects-heading">{t('项目仓库')}</h2>
      <p>
        {t('选择已有 Git 仓库；每次执行使用独立分支与工作目录，主目录有未提交改动时阻止启动。')}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void actions.createProject({ name, defaultBranch: branch }).then((result) => {
            if (typeof result === 'object' && result !== null && 'id' in result) setName('')
          })
        }}
      >
        <label>
          {t('项目名称')}
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
          />
        </label>
        <label>
          {t('默认分支')}
          <input
            required
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            maxLength={200}
          />
        </label>
        <button className="primary" disabled={actions.busy}>
          {t('选择仓库并添加')}
        </button>
      </form>
      <ProjectList projects={projects} />
    </section>
  )
}
const ProjectList = ({ projects }: { projects: Project[] }) => {
  const { t } = useI18n()
  return (
    <ul className="object-list">
      {projects.map((project) => (
        <li key={project.id}>
          <strong>{project.name}</strong>
          <span>
            {t('默认分支：')}
            {project.defaultBranch}
          </span>
          <code>{project.gitUrl || t('本地仓库（未配置 origin）')}</code>
          <code>{project.repositoryPath}</code>
        </li>
      ))}
    </ul>
  )
}
