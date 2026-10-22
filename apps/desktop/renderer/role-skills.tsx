import type { SkillPackage, SkillReference } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import './skills.css'

export const RoleSkills = ({
  skills,
  selected,
}: {
  skills: SkillPackage[]
  selected: SkillReference[]
}) => {
  const { t } = useI18n()
  const visible = skills.filter(
    (skill) => skill.available || selected.some((ref) => ref.id === skill.id),
  )
  return (
    <fieldset className="role-skills">
      <legend>{t('固定技能版本')}</legend>
      {!visible.length && <p>{t('在技能中心安装并确认版本后，可在此选择。')}</p>}
      {visible.map((skill) => (
        <label key={skill.id}>
          <input
            name="skills"
            type="checkbox"
            value={`${skill.id}@${skill.digest}`}
            defaultChecked={selected.some(
              (ref) => ref.id === skill.id && ref.digest === skill.digest,
            )}
          />
          <span>
            {skill.name} · {skill.source.commit.slice(0, 10)}
            {!skill.available && <> · {t('已卸载，请取消或选择新版本')}</>}
          </span>
        </label>
      ))}
      <p className="field-note">
        {t('修改技能会生成角色新版本并要求重新试运行，已有 Run 保留原快照。')}
      </p>
    </fieldset>
  )
}

export const selectedSkills = (form: FormData): SkillReference[] =>
  form.getAll('skills').map((value) => {
    const [id, digest] = String(value).split('@')
    return { id: id!, digest: digest! }
  })
