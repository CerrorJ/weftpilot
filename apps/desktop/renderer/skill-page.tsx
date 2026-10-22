import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { SkillSources } from './skill-sources'
import { SkillImports, InstalledSkills } from './skill-versions'
import './skills.css'

export const SkillPage = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const state = actions.state
  return (
    <div className="skill-page">
      <header className="page-header">
        <div>
          <h1>{t('技能中心')}</h1>
          <p>{t('固定来源与版本，先检查内容，再安装到角色。')}</p>
        </div>
      </header>
      {actions.error && (
        <p role="alert" className="error">
          {t(actions.error)}
        </p>
      )}
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <>
          <InstalledSkills skills={state.skills} actions={actions} />
          <SkillSources sources={state.skillSources} actions={actions} />
          <SkillImports imports={state.skillImports} skills={state.skills} actions={actions} />
        </>
      )}
    </div>
  )
}
