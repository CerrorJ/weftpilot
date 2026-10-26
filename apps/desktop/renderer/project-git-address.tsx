import type { Project } from '@weftpilot/agent-team-kernel/protocol'
import {
  isCopyableGitAddress,
  type ProjectGitCopyInput,
} from '../../../packages/kernel-client/project-clipboard'
import { useI18n } from './preferences'
import { useProjectGitCopy } from './use-project-git-copy'

export const ProjectGitAddress = ({ project, gitUrl }: { project: Project; gitUrl: string }) => {
  const { t } = useI18n()
  return (
    <>
      <dt>{t('Git 地址')}</dt>
      <dd className="code project-git-address">
        <span>
          {gitUrl === '[invalid remote URL]'
            ? t('Git 地址不可用')
            : gitUrl || t('本地仓库（未配置 origin）')}
        </span>
        {isCopyableGitAddress(gitUrl) && (
          <CopyGitAddress
            key={`${project.id}:${project.version}:${gitUrl}`}
            input={{ projectId: project.id, projectVersion: project.version, gitUrl }}
          />
        )}
      </dd>
    </>
  )
}

const CopyGitAddress = ({ input }: { input: ProjectGitCopyInput }) => {
  const { t } = useI18n()
  const { state, copy } = useProjectGitCopy(input)
  return (
    <span className="project-copy-control">
      <button
        className="project-copy-button"
        aria-label={t('复制 Git 地址')}
        title={t('复制 Git 地址')}
        aria-busy={state === 'copying'}
        disabled={state === 'copying'}
        onClick={() => void copy()}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M6 13H4V4h9v2 M7 7h10v10H7Z"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {state === 'copying' && <span role="status">{t('正在复制…')}</span>}
      {state === 'copied' && <span role="status">{t('Git 地址已复制')}</span>}
      {state === 'stale' && <span role="alert">{t('Git 地址已变化，请重新检查仓库。')}</span>}
      {state === 'failed' && <span role="alert">{t('未能确认复制，请重试或手动复制地址。')}</span>}
    </span>
  )
}
