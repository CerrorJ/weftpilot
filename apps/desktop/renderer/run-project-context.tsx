import type { Run } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

/** 只呈现该次执行的快照，旧记录缺省时不能展示当前项目冒充历史依据。 */
export const RunProjectContext = ({ run }: { run: Run }) => {
  const { t } = useI18n()
  if (run.purpose === 'role_trial') return null
  const project = run.projectContextSnapshot
  if (!project) return <p className="field-note">{t('此执行未记录项目上下文快照。')}</p>
  return (
    <details className="run-project-context">
      <summary>
        {t('固定项目上下文：')}
        {project.name} · v{project.projectVersion}
      </summary>
      {project.goal && (
        <>
          <h4>{t('项目目标')}</h4>
          <p className="preserve-text">{project.goal}</p>
        </>
      )}
      {project.description && (
        <>
          <h4>{t('项目描述')}</h4>
          <p className="preserve-text">{project.description}</p>
        </>
      )}
      {!project.goal && !project.description && (
        <p className="field-note">{t('本次项目未设置目标和描述。')}</p>
      )}
    </details>
  )
}
