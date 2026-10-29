import { Fragment, type ReactNode } from 'react'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { RoleDraft } from './role-draft'
import { useI18n } from './preferences'

export const RoleConfigurationReview = ({
  draft,
  state,
}: {
  draft: RoleDraft
  state: WorkspaceSnapshot | undefined
}) => {
  const { t } = useI18n()
  const model = state?.models.find((item) => `${item.id}@${item.version}` === draft.profile)
  const skills = draft.skills.map(
    (ref) =>
      state?.skills.find((item) => item.id === ref.id && item.digest === ref.digest)?.name ??
      t('固定技能版本不可用'),
  )
  const fields: [string, ReactNode][] = [
    [
      '角色',
      <>
        {draft.name} <code>{draft.slug}</code>
      </>,
    ],
    [
      '执行配置',
      `${draft.cli} · ${model ? `${model.name} · v${model.version}` : draft.model || t('使用 CLI 账户与手动模型')}`,
    ],
    ['Skills', skills.join('、') || t('未绑定')],
    [
      '权限范围',
      `${t(draft.permission === 'read-only' ? '只读建议' : '隔离工作目录内写入')} · ${t('最大并发任务数')} ${draft.maxConcurrency}`,
    ],
    ['飞书连接', channelReview(draft, t)],
  ]
  return (
    <dl className="role-review">
      {fields.map(([label, value]) => (
        <Fragment key={label}>
          <dt>{t(label)}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

const channelReview = (draft: RoleDraft, t: (value: string) => string): string => {
  if (draft.feishuMode === 'new' || draft.feishuMode === 'existing')
    return `${draft.feishuAppId} · ${t('待连接与核验')}`
  return t(draft.feishuMode === 'inherit' ? '保留旧工作空间渠道' : '暂不接入飞书')
}
