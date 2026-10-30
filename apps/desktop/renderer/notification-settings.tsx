import type { NotificationPreferences } from '../../../packages/system-bridge/notification-contract'
import { useNotificationSettings } from './use-notification-settings'
import { useI18n } from './preferences'

const categories = [
  ['human', '任务需要澄清或审批时通知'],
  ['review', '交付物等待验收时通知'],
  ['failure', '执行失败时通知'],
] as const
type Settings = ReturnType<typeof useNotificationSettings>

export const NotificationSettings = () => {
  const settings = useNotificationSettings()
  const { t } = useI18n()
  return (
    <section className="notification-settings" aria-label={t('通知与后台')}>
      <h2>{t('通知与后台')}</h2>
      <p>{t('在需要你介入时提醒。默认关闭本机通知，任务状态仍由内核维护。')}</p>
      {settings.error && (
        <p role="alert" className="error">
          {t(settings.error)}
        </p>
      )}
      {settings.draft &&
        settings.status &&
        settings.draft.version !== settings.status.preferences.version && (
          <p className="field-note">
            {t('通知偏好已在其他操作中更新，当前输入保留；重新载入会替换当前输入。')}
          </p>
        )}
      {!settings.status || !settings.draft ? (
        <p role="status">{t(settings.error ? '本机通知设置未载入' : '正在读取本机通知设置…')}</p>
      ) : (
        <NotificationPreferencesForm settings={settings} />
      )}
      <button disabled={settings.busy} onClick={() => void settings.perform('reload')}>
        {t('重新载入偏好')}
      </button>
      <p className="field-note">{t('关闭窗口后继续运行；从托盘或系统菜单完全退出。')}</p>
    </section>
  )
}

const NotificationPreferencesForm = ({ settings }: { settings: Settings }) => {
  const { t } = useI18n()
  const draft = settings.draft
  if (!draft) return null
  const change = (key: keyof Omit<NotificationPreferences, 'version'>, value: boolean) =>
    settings.setDraft((current) => (current ? { ...current, [key]: value } : current))
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void settings.perform('save')
      }}
    >
      <label className="check-line">
        <input
          type="checkbox"
          checked={draft.enabled}
          disabled={settings.busy || (!settings.status?.supported && !draft.enabled)}
          onChange={(event) => change('enabled', event.target.checked)}
        />
        {t('启用本机系统通知')}
      </label>
      <fieldset disabled={settings.busy || !draft.enabled}>
        <legend>{t('提醒内容')}</legend>
        {categories.map(([key, label]) => (
          <label className="check-line" key={key}>
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(event) => change(key, event.target.checked)}
            />
            {t(label)}
          </label>
        ))}
      </fieldset>
      <button className="primary" disabled={settings.busy}>
        {t('保存通知偏好')}
      </button>
      <NotificationReadout settings={settings} />
    </form>
  )
}

const NotificationReadout = ({ settings }: { settings: Settings }) => {
  const { t, language } = useI18n()
  const status = settings.status
  if (!status) return null
  const observation = {
    starting: '正在建立通知基线',
    watching: '正在观察内核变化',
    unavailable: '通知观察暂不可用',
  }
  const states = {
    requested: '已提交系统通知请求',
    shown: '系统已确认通知',
    failed: '系统通知未能显示',
  }
  const kinds = { human: '澄清或审批', review: '交付验收', failure: '执行失败', test: '测试通知' }
  return (
    <div className="notification-readout">
      <p>{t(status.supported ? '当前系统支持通知接口' : '当前系统不支持通知接口')}</p>
      <p role="status">{t(observation[status.observation])}</p>
      {status.last && (
        <p role="status">
          {t(kinds[status.last.kind])} · {t(states[status.last.state])} ·{' '}
          <time dateTime={status.last.at}>
            {new Date(status.last.at).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN')}
          </time>
        </p>
      )}
      <button
        type="button"
        disabled={settings.busy || !status.supported}
        onClick={() => void settings.perform('test')}
      >
        {t('发送测试通知')}
      </button>
      <p className="field-note">
        {t('同类变化合并提醒，不补发启动前历史待办；系统权限、勿扰和安装状态会影响显示。')}
      </p>
      <p className="field-note">
        {t('通知只含固定提示，不包含任务正文。点击后打开对应任务，不自动批准或验收。')}
      </p>
    </div>
  )
}
