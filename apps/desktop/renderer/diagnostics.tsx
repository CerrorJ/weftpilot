import { useI18n } from './preferences'
import { useEffect, useState } from 'react'
import { handshakeSchema, type KernelHandshake } from '@weftpilot/agent-team-kernel/protocol'
interface Diagnostics {
  handshake: KernelHandshake
  artifactSha256: string
  credentialsAvailable: boolean
}
const parseDiagnostics = (input: unknown): Diagnostics => {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('handshake' in input) ||
    !('artifactSha256' in input) ||
    typeof input.artifactSha256 !== 'string' ||
    !('credentialsAvailable' in input) ||
    typeof input.credentialsAvailable !== 'boolean'
  ) {
    throw new Error('收到的诊断信息无效，请重新连接')
  }
  return {
    handshake: handshakeSchema.parse(input.handshake),
    artifactSha256: input.artifactSha256,
    credentialsAvailable: input.credentialsAvailable,
  }
}
const useDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<Diagnostics>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      if (!window.weftpilot) throw new Error('桌面桥接不可用，请从纬舟应用打开')
      setDiagnostics(parseDiagnostics(await window.weftpilot.diagnostics()))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '连接失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])
  return { diagnostics, error, loading, refresh }
}
export const DiagnosticsPanel = () => {
  const { t } = useI18n()
  const { diagnostics, error, loading, refresh } = useDiagnostics()
  return (
    <>
      <header>
        <div>
          <h1>{t('本机工作台')}</h1>
          <p>{t('查看执行内核的连接与运行环境。')}</p>
        </div>
        <button
          disabled={loading}
          onClick={() => {
            void refresh()
          }}
        >
          {loading ? t('正在连接…') : t('重新检测')}
        </button>
      </header>
      <div role="status" className={`connection ${error ? 'error' : ''}`}>
        <span className="status-dot" />
        {error
          ? t('连接中断 · 状态待确认')
          : diagnostics
            ? t('Agent-Team 内核已连接')
            : t('正在连接内核…')}
      </div>
      {error && <p role="alert">{t(error)}</p>}
      {diagnostics && !error && <KernelDetails diagnostics={diagnostics} />}
      <section className="next-step">
        <h2>{t('开始前')}</h2>
        <p>{t('项目、角色和任务由同一内核管理。这里展示实际运行的版本及产物摘要。')}</p>
        <p>{t('关闭窗口后，纬舟保留在系统托盘。使用菜单中的“完全退出”结束内核。')}</p>
      </section>
    </>
  )
}
const KernelDetails = ({ diagnostics }: { diagnostics: Diagnostics }) => {
  const { t } = useI18n()
  const { handshake, artifactSha256, credentialsAvailable } = diagnostics
  return (
    <section aria-labelledby="kernel-heading" className="details">
      <h2 id="kernel-heading">{t('内核运行信息')}</h2>
      <dl>
        <div>
          <dt>{t('内核版本')}</dt>
          <dd>{handshake.kernelVersion}</dd>
        </div>
        <div>
          <dt>{t('协议 / 数据版本')}</dt>
          <dd>
            {handshake.protocolVersion} / {handshake.dataSchemaVersion}
          </dd>
        </div>
        <div>
          <dt>{t('源提交')}</dt>
          <dd className="code" data-testid="source-commit">
            {handshake.sourceCommit}
          </dd>
        </div>
        <div>
          <dt>{t('产物摘要')}</dt>
          <dd className="code">{artifactSha256}</dd>
        </div>
        <div>
          <dt>{t('运行环境')}</dt>
          <dd>
            Node {handshake.runtime.node} · {handshake.runtime.platform} / {handshake.runtime.arch}
          </dd>
        </div>
        <div>
          <dt>{t('系统凭据存储')}</dt>
          <dd>{credentialsAvailable ? t('可用') : t('不可用 · 凭据写入已阻止')}</dd>
        </div>
      </dl>
    </section>
  )
}
