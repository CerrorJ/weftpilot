import {
  requirementPrioritySchema,
  requirementStageSchema,
  type RequirementVersion,
} from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

const priorityLabels: Record<NonNullable<RequirementVersion['priority']>, string> = {
  low: '低',
  medium: '中',
  high: '高',
}
const stageLabels: Record<NonNullable<RequirementVersion['stage']>, string> = {
  needs_clarification: '待澄清',
  awaiting_confirmation: '待确认',
  plan_confirmed: '方案已确认',
  implementing: '实现中',
}

export const RequirementMetadataFields = ({ base }: { base: RequirementVersion | undefined }) => {
  const { t } = useI18n()
  return (
    <>
      <div className="form-pair">
        <label>
          {t('需求优先级')}
          <select
            aria-label={t('需求优先级')}
            name="priority"
            defaultValue={base ? (base.priority ?? '') : 'medium'}
          >
            <option value="">{t('未设置')}</option>
            {requirementPrioritySchema.options.map((value) => (
              <option key={value} value={value}>
                {t(priorityLabels[value])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('需求阶段')}
          <select
            aria-label={t('需求阶段')}
            name="stage"
            defaultValue={base ? (base.stage ?? '') : 'needs_clarification'}
          >
            <option value="">{t('未设置')}</option>
            {requirementStageSchema.options.map((value) => (
              <option key={value} value={value}>
                {t(stageLabels[value])}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="field-note">{t('阶段由你记录，不替代任务执行、方案审批或交付验收。')}</p>
    </>
  )
}

export const RequirementStage = ({ requirement }: { requirement: RequirementVersion }) => {
  const { t } = useI18n()
  return (
    <span className="badge">
      {t(requirement.stage ? stageLabels[requirement.stage] : '阶段未设置')}
    </span>
  )
}

export const RequirementPriority = ({ requirement }: { requirement: RequirementVersion }) => {
  const { t } = useI18n()
  return (
    <span>
      {t('需求优先级')} ·{' '}
      {t(requirement.priority ? priorityLabels[requirement.priority] : '未设置')}
    </span>
  )
}

export const RequirementMetadataSummary = ({
  requirement,
}: {
  requirement: RequirementVersion
}) => (
  <div className="requirement-metadata">
    <RequirementStage requirement={requirement} />
    <RequirementPriority requirement={requirement} />
  </div>
)
