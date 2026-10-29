import { useState } from 'react'
import type { SkillSource } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { latestVersions } from './object-versions'
import { skillSourceLabel } from './skill-source-label'

export const SkillSources = ({
  sources,
  actions,
  imported,
}: {
  sources: SkillSource[]
  actions: WorkspaceActions
  imported: (id: string) => void
}) => {
  const { t } = useI18n()
  // 打开/明确选择时固定编辑基准；轮询到新版本不能卸载正在填写的表单。
  const [source, setSource] = useState<SkillSource>()
  return (
    <section className="setup-section" aria-labelledby="skill-sources">
      <h2 id="skill-sources">{t('技能源')}</h2>
      <p>{t('当前支持公共 GitHub 仓库的固定提交。修改来源会追加新版本，不自动升级角色。')}</p>
      <label>
        {t('编辑来源')}
        <select
          value={source?.id ?? ''}
          onChange={(event) =>
            setSource(latestVersions(sources).find((item) => item.id === event.target.value))
          }
        >
          <option value="">{t('新增来源')}</option>
          {latestVersions(sources).map((item) => (
            <option key={item.id} value={item.id}>
              {skillSourceLabel(item, latestVersions(sources))} · v{item.version}
            </option>
          ))}
        </select>
      </label>
      {source && (
        <button
          type="button"
          onClick={() => setSource(latestVersions(sources).find((item) => item.id === source.id))}
        >
          {t('读取当前来源版本')}
        </button>
      )}
      <SourceForm
        key={`${source?.id ?? ''}:${source?.version ?? 0}`}
        source={source}
        actions={actions}
      />
      <SkillImportForm sources={sources} actions={actions} imported={imported} />
    </section>
  )
}

const SourceForm = ({
  source,
  actions,
}: {
  source: SkillSource | undefined
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const element = event.currentTarget
        const form = new FormData(element)
        void actions
          .execute({
            type: 'skill.source.save',
            ...(source ? { id: source.id } : {}),
            expectedVersion: source?.version ?? 0,
            name: formText(form, 'name'),
            repository: formText(form, 'repository'),
            commit: formText(form, 'commit'),
          })
          .then((result) => {
            if (result && !source) element.reset()
          })
      }}
    >
      <TextField name="name" label={t('来源名称')} value={source?.name ?? ''} />
      <TextField
        name="repository"
        label={t('公共仓库地址')}
        value={source?.repository ?? ''}
        placeholder="https://github.com/owner/repository"
      />
      <TextField name="commit" label={t('固定提交（40位 SHA）')} value={source?.commit ?? ''} />
      <button disabled={actions.busy}>{source ? t('保存来源新版本') : t('添加来源')}</button>
    </form>
  )
}

const SkillImportForm = ({
  sources,
  actions,
  imported,
}: {
  sources: SkillSource[]
  actions: WorkspaceActions
  imported: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <form
      className="skill-import-form"
      onSubmit={(event) => submitImport(event, actions, imported)}
    >
      <h3>{t('预览技能版本')}</h3>
      <label>
        {t('来源版本')}
        <select name="source" defaultValue="" required>
          <option value="" disabled>
            {t('选择固定来源版本')}
          </option>
          {sources.map((source) => (
            <option key={`${source.id}@${source.version}`} value={`${source.id}@${source.version}`}>
              {skillSourceLabel(source, sources)} · v{source.version} · {source.commit.slice(0, 10)}
            </option>
          ))}
        </select>
      </label>
      <TextField
        name="directory"
        label={t('技能目录（仓库内）')}
        value=""
        placeholder="skills/example-skill"
      />
      <TextField
        name="licensePath"
        label={t('许可证文件（仓库内）')}
        value=""
        placeholder="LICENSE"
      />
      <p className="field-note">
        {t('下载只产生预览，不运行安装脚本、不自动安装依赖，也不扩大角色权限。')}
      </p>
      <button className="primary" disabled={actions.busy || !sources.length}>
        {t('下载并校验预览')}
      </button>
    </form>
  )
}

const submitImport = (
  event: React.FormEvent<HTMLFormElement>,
  actions: WorkspaceActions,
  imported: (id: string) => void,
): void => {
  event.preventDefault()
  const element = event.currentTarget
  const form = new FormData(element)
  const [sourceId, version] = formText(form, 'source').split('@')
  void actions
    .execute({
      type: 'skill.import',
      sourceId: sourceId!,
      sourceVersion: Number(version),
      directory: formText(form, 'directory'),
      licensePath: formText(form, 'licensePath'),
    })
    .then((result) => {
      if (result && element.isConnected) imported(result.id)
    })
}
