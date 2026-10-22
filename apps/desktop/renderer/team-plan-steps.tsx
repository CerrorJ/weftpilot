import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { TextField } from './form-fields'
interface Context {
  steps: string[]
  roles: RoleVersion[]
  remove: (key: string) => void
}
export const TeamPlanSteps = ({ steps, roles, remove }: Context) => (
  <>
    {steps.map((step, index) => (
      <StepEditor
        key={step}
        step={step}
        index={index}
        steps={steps}
        roles={roles}
        remove={remove}
      />
    ))}
  </>
)
const StepEditor = ({
  step,
  index,
  steps,
  roles,
  remove,
}: Context & { step: string; index: number }) => {
  const { t } = useI18n()
  return (
    <fieldset className="plan-step">
      <legend>
        {t('子任务')} {index + 1}
      </legend>
      <TextField label={t('子任务名称')} name={`title:${step}`} />
      <label>
        {t('执行角色')}
        <select name={`role:${step}`} defaultValue={roles[index % roles.length]?.id} required>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} · {role.cli}
            </option>
          ))}
        </select>
      </label>
      <TextField label={t('子任务目标')} name={`goal:${step}`} multiline />
      <TextField label={t('子任务验收条件')} name={`criteria:${step}`} multiline />
      <fieldset>
        <legend>{t('依赖的子任务')}</legend>
        {steps
          .filter((other) => other !== step)
          .map((other) => (
            <label className="check-label" key={other}>
              <input type="checkbox" name={`dependencies:${step}`} value={other} />
              {t('子任务')} {steps.indexOf(other) + 1}
            </label>
          ))}
        {steps.length === 1 && <p>{t('独立执行，无上游依赖。')}</p>}
      </fieldset>
      <button type="button" disabled={steps.length === 1} onClick={() => remove(step)}>
        {t('移除此子任务')}
      </button>
    </fieldset>
  )
}
