import type { CliCheckInput, CliCheckResult } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { useCliCheck } from './use-cli-check'
import './cli-checks.css'

export const RoleEnvironment = ({ cli }: { cli: CliCheckInput['cli'] }) => {
  const { t } = useI18n()
  const { results, busy, error, check } = useCliCheck(cli)
  const uncertain = Object.values(results).some((result) => result?.processState === 'uncertain')
  return (
    <section className="role-environment" aria-label={t('CLI分项检查')}>
      <h4>
        {cli} · {t('CLI分项检查')}
      </h4>
      {busy && <p role="status">{t('检查中，正在等待CLI返回。')}</p>}
      <div className="cli-check-list">
        {(['version', 'sign-in'] as const).map((kind) => (
          <CliCheckRow
            key={kind}
            kind={kind}
            result={results[kind]}
            busy={busy || uncertain}
            check={() => void check(kind)}
          />
        ))}
        <div className="cli-check-row">
          <strong>{t('模型连接')}</strong>
          <span>{t('尚未验证；保存后在最后一步真实试运行')}</span>
        </div>
      </div>
      <p>{t('登录状态仅针对CLI默认环境，不证明凭据仍有效，也不代表当前模型配置已连通。')}</p>
      <p className="field-note">
        {t('检查不会保存角色或创建Run；关闭表单不等于停止检查，完全退出由内核确认进程结束。')}
      </p>
      {error && <p role="alert">{t(error)}</p>}
    </section>
  )
}

const CliCheckRow = ({
  kind,
  result,
  busy,
  check,
}: {
  kind: CliCheckInput['check']
  result: CliCheckResult | undefined
  busy: boolean
  check: () => void
}) => {
  const { t } = useI18n()
  return (
    <div className="cli-check-row">
      <strong>{t(kind === 'version' ? 'CLI版本' : 'CLI登录状态')}</strong>
      <span role="status">
        {result ? t(cliCheckLabels[result.code]) : t('尚未检查')}
        {result?.version && ` · ${result.version}`}
      </span>
      {result && (
        <time dateTime={result.checkedAt}>{new Date(result.checkedAt).toLocaleTimeString()}</time>
      )}
      <button type="button" onClick={check} disabled={busy}>
        {t(kind === 'version' ? '读取版本' : '检查登录状态')}
      </button>
    </div>
  )
}

const cliCheckLabels: Record<CliCheckResult['code'], string> = {
  CLI_VERSION_READ: '已读取版本（未确认功能兼容性）',
  CLI_SIGNED_IN: 'CLI报告已登录（未验证服务调用）',
  CLI_SIGNED_OUT: 'CLI报告未登录',
  CLI_UNAVAILABLE: '未找到受支持入口',
  CLI_CHECK_FAILED: '检查失败',
  CLI_CHECK_OUTPUT_INVALID: 'CLI输出无法识别，请核对版本',
  CLI_CHECK_OUTPUT_LIMIT: '输出超限，检查进程已结束',
  CLI_CHECK_TIMEOUT: '检查超时，进程已结束',
  CLI_CHECK_STOP_UNCERTAIN: '状态待确认，禁止重复检查',
}
