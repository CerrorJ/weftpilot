import { useState } from 'react'
import {
  diagnosticExportResultSchema,
  diagnosticReportSchema,
  type diagnosticPreviewSchema,
} from '../../../packages/kernel-client/diagnostics-contract'
import { useI18n } from './preferences'
import { diagnosticLabels, diagnosticStates } from './english-diagnostics'
import './environment.css'

type Preview = ReturnType<typeof diagnosticPreviewSchema.parse>

export const EnvironmentPanel = ({ diagnostics }: { diagnostics: Preview }) => {
  const { t } = useI18n()
  const { environment } = diagnostics
  return (
    <section className="setup-section environment-panel" aria-labelledby="environment-heading">
      <h2 id="environment-heading">{t('环境检查')}</h2>
      <p>
        {t('桌面版本')} {diagnostics.desktop.version} · Electron {diagnostics.desktop.electron} ·
        Chromium {diagnostics.desktop.chromium}
      </p>
      <p>{t('只读检查，不启动任务、不读取登录文件，也不会自动修复数据。')}</p>
      <p className="field-note">
        {t('检查时间')} · {environment.checkedAt}
      </p>
      <ul className="environment-checks">
        {environment.checks.map((check) => (
          <li key={check.id} data-check={check.id}>
            <span>
              {t(diagnosticLabels[check.code] ?? check.code)}
              {check.objectId && <code> · {check.objectId.slice(0, 8)}</code>}
            </span>
            <strong className={`check-${check.state}`}>
              {t(diagnosticStates[check.state] ?? check.state)}
              {check.count !== undefined && ` · ${check.count}`}
            </strong>
          </li>
        ))}
        {environment.tools.map((tool) => (
          <li key={tool.id} data-tool={tool.id}>
            <span>
              {tool.id === 'git' ? 'Git' : tool.id === 'codex' ? 'Codex CLI' : 'Claude Code'}
            </span>
            <strong className={tool.found ? 'check-passed' : 'check-attention'}>
              {tool.found ? t('程序可定位') : t('未找到受支持入口')}
            </strong>
          </li>
        ))}
      </ul>
      <p>
        {t('CLI 版本与认证未检测；请在角色页面进行真实试运行。历史就绪数量不代表当前认证有效。')}
      </p>
      <DiagnosticExport key={diagnostics.ticket} diagnostics={diagnostics} />
    </section>
  )
}

const DiagnosticExport = ({ diagnostics }: { diagnostics: Preview }) => {
  const { t, language } = useI18n()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const exportReport = async () => {
    setBusy(true)
    setResult('')
    setError('')
    try {
      const exported = diagnosticExportResultSchema.parse(
        await window.weftpilot!.exportDiagnostics({ ticket: diagnostics.ticket, language }),
      )
      if (!exported.canceled) setResult(exported.fileName)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'DIAGNOSTIC_EXPORT_FAILED')
    } finally {
      setBusy(false)
    }
  }
  const report = diagnosticReportSchema.strip().parse(diagnostics)
  return (
    <div className="diagnostic-export">
      <details>
        <summary>{t('诊断报告预览')}</summary>
        <pre>{JSON.stringify(report, null, 2)}</pre>
      </details>
      <p className="field-note">
        {t('仅导出以上版本、检查码、状态、数量和对象编号，不含本机路径、业务正文或凭据。')}
      </p>
      <button disabled={busy} onClick={() => void exportReport()}>
        {busy ? t('正在导出…') : t('导出已预览报告')}
      </button>
      {result && (
        <p role="status">
          {t('已导出')} · {result}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {t(error)}
        </p>
      )}
    </div>
  )
}
