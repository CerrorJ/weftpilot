import type { Project, TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import { useId } from 'react'
import { useI18n } from './preferences'
import { TextField } from './form-fields'

export const ProjectContextFields = ({
  project,
  teams,
}: {
  project?: Project
  teams: TeamVersion[]
}) => {
  const { t } = useI18n()
  return (
    <>
      <TextField label={t('项目目标')} name="goal" value={project?.goal ?? ''} multiline optional />
      <TextField
        label={t('项目描述')}
        name="description"
        value={project?.description ?? ''}
        multiline
        optional
      />
      <ProjectDefaultTeamField project={project} teams={teams} />
      <p className="field-note">
        {t(
          '默认团队关联团队身份；创建计划时固定当时的团队版本。项目上下文在新执行开始时固定，已有执行保持原样。',
        )}
      </p>
    </>
  )
}

const ProjectDefaultTeamField = ({
  project,
  teams,
}: {
  project: Project | undefined
  teams: TeamVersion[]
}) => {
  const { t } = useI18n()
  const teamLabel = useId()
  const selected = project?.defaultTeamId ?? ''
  const missing = selected && !teams.some((team) => team.id === selected)
  return (
    <label>
      <span id={teamLabel}>{t('默认团队')}</span>
      <select aria-labelledby={teamLabel} name="defaultTeamId" defaultValue={selected}>
        <option value="">{t('未设置默认团队')}</option>
        {missing && <option value={selected}>{t('原团队不可用')}</option>}
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name} · v{team.version}
          </option>
        ))}
      </select>
    </label>
  )
}

/** 只将明确的空选项解释为解除关联；非法空白或 UUID 必须由主进程拒绝。 */
export const projectFormContext = (form: FormData) => ({
  goal: String(form.get('goal') ?? '').trim(),
  description: String(form.get('description') ?? '').trim(),
  defaultTeamId: form.get('defaultTeamId') === '' ? null : String(form.get('defaultTeamId')),
})
