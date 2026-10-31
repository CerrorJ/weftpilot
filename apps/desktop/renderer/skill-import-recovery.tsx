import { useRef, useState } from 'react'
import type { SkillImport } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'

const downloadFailures = new Set([
  'SKILL_DOWNLOAD_FAILED',
  'SKILL_DOWNLOAD_NETWORK_FAILED',
  'SKILL_DOWNLOAD_TIMEOUT',
  'SKILL_DOWNLOAD_DNS_FAILED',
  'SKILL_DOWNLOAD_TLS_FAILED',
  'SKILL_DOWNLOAD_RATE_LIMITED',
  'SKILL_DOWNLOAD_SERVER_UNAVAILABLE',
])

/** 只提供显式恢复入口；新下载仍经原内核用例，旧失败、来源版本和安装同意均不改写。 */
export const SkillImportRecovery = ({
  item,
  actions,
  openImport,
}: {
  item: SkillImport
  actions: WorkspaceActions
  openImport: (id: string) => void
}) => {
  const { t } = useI18n()
  const { created, retry } = useSkillImportRecovery(item, actions)
  if (item.state !== 'failed' || item.package || !downloadFailures.has(item.failureCode ?? ''))
    return null
  return (
    <div className="skill-import-recovery">
      <p className="field-note">
        {t('创建新下载记录并保留本次失败；下载后仍需核对内容与许可证。')}
      </p>
      {created ? (
        <>
          <p role="status">{t('新下载记录已创建，本次失败保持原状。')}</p>
          <button
            disabled={!actions.state?.skillImports.some((record) => record.id === created)}
            onClick={() => openImport(created)}
          >
            {t('查看新下载记录')}
          </button>
        </>
      ) : (
        <button disabled={actions.busy} onClick={() => void retry()}>
          {t('按此来源版本重新下载')}
        </button>
      )}
    </div>
  )
}

const useSkillImportRecovery = (item: SkillImport, actions: WorkspaceActions) => {
  const submitting = useRef(false)
  const acknowledged = useRef('')
  const [created, setCreated] = useState('')
  const retry = async () => {
    if (submitting.current || acknowledged.current || actions.busy) return
    submitting.current = true
    try {
      // 使用失败记录的不可变来源快照；不能静默换为同名来源的最新版本。
      const result = await actions.execute({
        type: 'skill.import',
        sourceId: item.source.id,
        sourceVersion: item.source.version,
        directory: item.directory,
        licensePath: item.licensePath,
      })
      if (result) {
        // 回执已完成但React尚未重绘时也不能重复创建。
        acknowledged.current = result.id
        setCreated(result.id)
      }
    } finally {
      submitting.current = false
    }
  }
  return { created, retry }
}
