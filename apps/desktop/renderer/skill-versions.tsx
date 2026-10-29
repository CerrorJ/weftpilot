import type { SkillImport, SkillPackage } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'

const states: Record<SkillImport['state'], string> = {
  queued: '等待下载',
  fetching: '正在下载并校验',
  preview_ready: '待确认安装',
  activating: '正在安装并核对',
  installed: '已安装',
  failed: '导入失败',
}

export const SkillImports = ({
  imports,
  skills,
  actions,
}: {
  imports: SkillImport[]
  skills: SkillPackage[]
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <section className="setup-section" aria-labelledby="skill-imports">
      <h2 id="skill-imports">{t('预览与安装记录')}</h2>
      {!imports.length && <p>{t('添加来源后，下载技能目录以查看完整说明与许可证。')}</p>}
      {[...imports].reverse().map((item) => (
        <SkillImportRecord key={item.id} item={item} skills={skills} actions={actions} />
      ))}
    </section>
  )
}

export const SkillPreview = ({
  skill,
  previous,
}: {
  skill: SkillPackage
  previous: SkillPackage | undefined
}) => {
  const { t } = useI18n()
  const changes = skillChanges(previous, skill)
  return (
    <div className="skill-preview">
      <p>{skill.description}</p>
      <details open>
        <summary>{t('完整技能说明')}</summary>
        <pre>{skill.instructions}</pre>
      </details>
      <details>
        <summary>{t('许可证原文')}</summary>
        <p>
          <code>{skill.licensePath}</code>
        </p>
        <pre>{skill.licenseText}</pre>
      </details>
      <SkillFileList skill={skill} />
      {previous && (
        <details open>
          <summary>{t('与此前安装版本的文件变化')}</summary>
          {!changes.length ? (
            <p>{t('文件内容一致；来源版本信息仍单独保留。')}</p>
          ) : (
            <ul>
              {changes.map((path) => (
                <li key={path}>
                  <code>{path}</code>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  )
}

const skillChanges = (previous: SkillPackage | undefined, current: SkillPackage): string[] => {
  if (!previous) return []
  const before = new Map(previous.files.map((file) => [file.path, file.sha256]))
  const after = new Map(current.files.map((file) => [file.path, file.sha256]))
  return [...new Set([...before.keys(), ...after.keys()])].filter(
    (path) => before.get(path) !== after.get(path),
  )
}

export const SkillAvailability = ({
  skill,
  actions,
}: {
  skill: SkillPackage
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <section className="skill-record" data-skill-id={skill.id}>
      <h2>{t(skill.available ? '可用于新执行' : '已卸载，历史保留')}</h2>
      <p>{t('升级需导入新提交，再保存角色新版本并试运行。卸载保留历史 Run 的固定内容。')}</p>
      <p>
        SHA-256 <code>{skill.digest}</code>
      </p>
      {skill.available && (
        <button
          disabled={actions.busy}
          onClick={() =>
            void actions.execute({
              type: 'skill.uninstall',
              id: skill.id,
              expectedVersion: skill.version,
            })
          }
        >
          {t('卸载此版本')}
        </button>
      )}
    </section>
  )
}

const SkillImportRecord = ({
  item,
  skills,
  actions,
}: {
  item: SkillImport
  skills: SkillPackage[]
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <article className="skill-record" key={item.id} data-import-id={item.id}>
      <div className="skill-record-heading">
        <h3>{item.package?.name ?? item.directory}</h3>
        <span role="status">{t(states[item.state])}</span>
      </div>
      <p>
        {item.source.name} · v{item.source.version}
      </p>
      <code>{item.source.commit}</code>
      {item.failureCode && <p className="error">{t(item.failureCode)}</p>}
      {item.package && (
        <SkillPreview
          skill={item.package}
          previous={skills.find((skill) => skill.id === item.comparisonPackageId)}
        />
      )}
      <SkillInstallApproval item={item} actions={actions} />
    </article>
  )
}

const SkillInstallApproval = ({
  item,
  actions,
}: {
  item: SkillImport
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    item.state === 'preview_ready' &&
    item.package && (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void actions.execute({
            type: 'skill.activate',
            id: item.id,
            expectedVersion: item.version,
            digest: item.package!.digest,
          })
        }}
      >
        <label className="skill-consent">
          <input type="checkbox" required />
          {t('我已核对技能内容、来源和许可证，确认安装此版本。')}
        </label>
        <button className="primary" disabled={actions.busy}>
          {t('确认安装此版本')}
        </button>
      </form>
    )
  )
}

const SkillFileList = ({ skill }: { skill: SkillPackage }) => {
  const { t } = useI18n()
  return (
    <details>
      <summary>{t('文件清单与摘要')}</summary>
      <ul>
        {skill.files.map((file) => (
          <li key={file.path}>
            <code>{file.path}</code> · {file.size} B <code>{file.sha256}</code>
          </li>
        ))}
      </ul>
      <p>
        SHA-256 <code>{skill.digest}</code>
      </p>
    </details>
  )
}
