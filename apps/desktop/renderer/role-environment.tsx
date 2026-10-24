import { useState } from 'react'
import { diagnosticPreviewSchema } from '../../../packages/kernel-client/diagnostics-contract'
import { useI18n } from './preferences'

export const RoleEnvironment = () => {
  const { t } = useI18n()
  const [tools, setTools] = useState<{ id: string; found: boolean }[]>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const check = async () => {
    setBusy(true)
    setError('')
    try {
      const result = diagnosticPreviewSchema.parse(await window.weftpilot!.diagnostics())
      setTools(result.environment.tools)
    } catch {
      setError('DIAGNOSTIC_UNAVAILABLE')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="role-environment">
      <h4>{t('执行环境检查')}</h4>
      <button type="button" disabled={busy} onClick={() => void check()}>
        {t('检查工具入口')}
      </button>
      {tools && (
        <ul>
          {tools.map((tool) => (
            <li key={tool.id}>
              {tool.id} · {t(tool.found ? '程序可定位' : '未找到受支持入口')}
            </li>
          ))}
        </ul>
      )}
      <p>
        {t(
          'CLI版本、账号认证与模型调用尚未验证；最后一步通过真实试运行核对，不将找到程序显示为已登录。',
        )}
      </p>
      {error && <p role="alert">{t(error)}</p>}
    </section>
  )
}
