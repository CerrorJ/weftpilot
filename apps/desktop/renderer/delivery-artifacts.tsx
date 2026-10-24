import type { Delivery, Run } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { RunActivity } from './run-activity'

/** 原文和差异仅作为文本预览，不执行交付HTML、脚本或任意本机文件。 */
export const DeliveryArtifacts = ({
  delivery,
  run,
  cursor,
}: {
  delivery: Delivery
  run: Run
  cursor: number
}) => {
  const { t } = useI18n()
  return (
    <section className="delivery-artifacts" aria-label={t('交付资料')}>
      <details open>
        <summary>
          {t('交付说明')}
          <span>{t('执行原文')}</span>
        </summary>
        <pre>{delivery.answer || t('本次执行没有文本结果。')}</pre>
      </details>
      <details>
        <summary>
          {t('代码变更摘要')}
          <span>{delivery.diff ? t('实际差异') : t('无差异')}</span>
        </summary>
        <pre className="code">{delivery.diff || t('没有代码差异。')}</pre>
      </details>
      <details>
        <summary>
          {t('验证与执行事件')}
          <span>{t('按证据核验')}</span>
        </summary>
        <p>
          {t(
            '以下是本次执行记录的工具和事件类型，不等于测试已通过。请结合交付原文、差异及验收标准核验。',
          )}
        </p>
        <RunActivity runId={run.id} cursor={cursor} />
      </details>
      <p className="muted code">
        {t('交付提交：')}
        {delivery.headCommit || t('未记录')}
      </p>
    </section>
  )
}
