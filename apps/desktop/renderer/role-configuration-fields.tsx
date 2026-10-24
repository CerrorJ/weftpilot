import type { RoleDraft } from './role-draft'
import { TextField } from './form-fields'
import { useI18n } from './preferences'

export const RoleBasics = ({ draft, existing }: { draft: RoleDraft; existing: boolean }) => {
  const { t } = useI18n()
  return (
    <>
      <div className="form-pair">
        <TextField name="name" label={t('角色名称')} value={draft.name} />
        <label>
          {t('角色标识')}
          <input
            name="slug"
            defaultValue={draft.slug}
            readOnly={existing}
            required
            maxLength={64}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </label>
      </div>
      <p className="field-note">{t('小写字母、数字与连字符；保存后标识保持不变。')}</p>
      <TextField name="responsibility" label={t('职责')} value={draft.responsibility} multiline />
      <TextField
        name="inputRequirements"
        label={t('输入要求')}
        value={draft.inputRequirements}
        multiline
        optional
      />
      <TextField
        name="deliveryRequirements"
        label={t('交付要求')}
        value={draft.deliveryRequirements}
        multiline
        optional
      />
    </>
  )
}

export const RolePermission = ({ draft }: { draft: RoleDraft }) => {
  const { t } = useI18n()
  return (
    <>
      <label>
        {t('工具权限')}
        <select name="permission" defaultValue={draft.permission}>
          <option value="read-only">{t('只读建议')}</option>
          <option value="workspace-write">{t('隔离工作目录内写入')}</option>
        </select>
      </label>
      <div className="form-pair">
        <label>
          {t('文件范围')}
          <input readOnly value={t('当前任务的隔离工作目录')} />
        </label>
        <label>
          {t('最大并发任务数')}
          <select name="maxConcurrency" defaultValue={draft.maxConcurrency}>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
      </div>
      <p>{t('本机最多同时执行2项任务；同一项目只有一个写者。')}</p>
      <p className="field-note">
        {t('Codex 使用受控沙箱；Claude 当前仅开放受限文件工具。试运行失败或状态待确认时不能启用。')}
      </p>
    </>
  )
}
