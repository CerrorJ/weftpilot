import { CreateDialog } from './create-dialog'
import { useI18n } from './preferences'
import type { RoleDraftEntry } from './role-draft-entries'

interface Context {
  entries: RoleDraftEntry[]
  busy: boolean
  select: (target: string) => void
}

/** 单草稿保持原型的一键继续；多份表单必须明确选择，避免悄悄覆盖另一份。 */
export const RoleDraftPicker = ({ entries, busy, select }: Context) => {
  const { t } = useI18n()
  if (!entries.length) return null
  const only = entries.length === 1 ? entries[0] : undefined
  if (only && !only.unavailable)
    return (
      <button disabled={busy} onClick={() => select(only.target)}>
        {t('继续角色草稿')}
      </button>
    )
  return (
    <CreateDialog title="继续角色草稿" error="" primary={false} disabled={busy}>
      {(close) => (
        <ul className="role-draft-options">
          {entries.map((entry) => (
            <li key={entry.target}>
              <button
                disabled={busy || entry.unavailable}
                onClick={() => {
                  close()
                  select(entry.target)
                }}
              >
                <strong>{entry.name || t('未命名角色')}</strong>
                <span>
                  {t(entry.baseVersion ? '编辑草稿' : '新角色草稿')}
                  {entry.baseVersion ? ` · v${entry.baseVersion}` : ''}
                  {entry.unavailable ? ` · ${t('来源角色不可用，草稿仍保留')}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </CreateDialog>
  )
}
