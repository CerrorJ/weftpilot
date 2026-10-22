import { useI18n } from './preferences'
import { useBackup } from './use-backup'
import './backup.css'

export const BackupPanel = () => {
  const { t } = useI18n()
  const backup = useBackup()
  return (
    <section className="setup-section backup-panel" aria-labelledby="backup-heading">
      <h2 id="backup-heading">{t('工作台数据备份')}</h2>
      <p>{t('备份业务历史、交付记录与技能版本。项目代码请单独备份。')}</p>
      <p className="field-note">
        {t('不包含项目仓库、执行目录、系统凭据或 CLI 登录。新设备需重新配置项目位置与凭据。')}
      </p>
      <p>{t('请先结束所有任务、人工等待和技能安装；状态待确认的执行必须先核对。')}</p>
      {backup.busy && <p role="status">{t('正在核对和处理数据，请保持应用运行…')}</p>}
      {backup.error && (
        <p role="alert" className="error">
          {t(backup.error)}
        </p>
      )}
      <div className="backup-actions">
        <button disabled={backup.busy} onClick={() => void backup.create()}>
          {t('创建工作台备份')}
        </button>
        <button disabled={backup.busy} onClick={() => void backup.select()}>
          {t('选择并检查备份')}
        </button>
        {backup.error && backup.canChooseAgain && (
          <button disabled={backup.busy} onClick={() => void backup.create(true)}>
            {t('改选备份存放目录')}
          </button>
        )}
      </div>
      {backup.created && (
        <div className="backup-result" role="status">
          <strong>{t('备份已完成并核对摘要')}</strong>
          <p>
            <code>{backup.created.directory}</code>
          </p>
          <p>
            {t('备份编号：')}
            {backup.created.manifest.id}
          </p>
        </div>
      )}
      {backup.preview && <RestorePreview backup={backup} />}
      <RestoreStatus backup={backup} />
    </section>
  )
}

const RestorePreview = ({ backup }: { backup: ReturnType<typeof useBackup> }) => {
  const { t } = useI18n()
  const preview = backup.preview!
  return (
    <div className="restore-preview">
      <h3>{t('已核对的恢复预览')}</h3>
      <p>
        <code>{preview.directory}</code>
      </p>
      <dl>
        <div>
          <dt>{t('备份时间')}</dt>
          <dd>{new Date(preview.manifest.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>{t('项目 / 任务 / 技能')}</dt>
          <dd>
            {preview.projects} / {preview.tasks} / {preview.skills}
          </dd>
        </div>
        <div>
          <dt>{t('备份内核 / 数据版本')}</dt>
          <dd>
            {preview.manifest.kernelVersion} / {preview.manifest.dataSchemaVersion}
          </dd>
        </div>
      </dl>
      <p>{t('恢复会切换到新工作台并重新连接内核；旧数据保留，不合并备份后的新增内容。')}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void backup.restore()
        }}
      >
        <label className="backup-consent">
          <input type="checkbox" required />
          {t('我已核对备份范围与时间，确认切换到此备份。')}
        </label>
        <button className="primary" disabled={backup.busy}>
          {t('恢复到新工作台')}
        </button>
      </form>
    </div>
  )
}

const RestoreStatus = ({ backup }: { backup: ReturnType<typeof useBackup> }) => {
  const { t } = useI18n()
  const operation = backup.status?.operation
  if (!operation) return null
  const phase = operation.phase
  return (
    <p className={phase === 'uncertain' ? 'error' : 'field-note'} role="status">
      {phase === 'activated'
        ? t('已从备份启动当前工作台，旧数据仍保留。')
        : phase === 'rolled_back'
          ? t('上次恢复未切换成功，已恢复原工作台。')
          : t(
              '上次恢复的切换未确认。当前使用位置指针指定的数据，请检查后重新选择备份；不会自动重放恢复。',
            )}
    </p>
  )
}
