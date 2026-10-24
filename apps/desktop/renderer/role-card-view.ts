import type {
  RoleVersion,
  RoleReadiness,
  Run,
  WorkspaceSnapshot,
} from '@weftpilot/agent-team-kernel/protocol'
import { latestVersions } from './object-versions'

/** 只投影版本匹配的证明；可见按钮不是授权，实际启用仍由内核CAS与试运行校验决定。 */
export const roleTrialPassed = (role: RoleVersion, run: Run | undefined): boolean =>
  run?.purpose === 'role_trial' &&
  run.roleSnapshot.id === role.id &&
  run.roleSnapshot.version === role.version &&
  run.status === 'succeeded' &&
  run.processState === 'confirmed_ended'

export const roleTrials = (state: Pick<WorkspaceSnapshot, 'runs'>, roleId: string): Run[] =>
  state.runs.filter((run) => run.purpose === 'role_trial' && run.roleSnapshot.id === roleId)

export const roleHasActiveTrial = (
  state: Pick<WorkspaceSnapshot, 'runs'>,
  roleId: string,
): boolean => roleTrials(state, roleId).some((run) => run.processState !== 'confirmed_ended')

export const roleReadiness = (state: Pick<WorkspaceSnapshot, 'roleReadiness'>, role: RoleVersion) =>
  state.roleReadiness.find((item) => item.roleId === role.id && item.roleVersion === role.version)

const stateLabels: Record<RoleReadiness['state'], string> = {
  draft: '待试运行',
  trial_running: '试运行中',
  ready: '待启用',
  disabled: '已停用',
}

export const roleCardStatus = (
  state: Pick<WorkspaceSnapshot, 'roleReadiness'>,
  role: RoleVersion,
): string => {
  const readiness = roleReadiness(state, role)
  if (!readiness) return '待试运行'
  if (readiness.state === 'draft' && readiness.failureCode) return '试运行未通过'
  return readiness.enabled ? '已启用' : stateLabels[readiness.state]
}

export const roleCardSkills = (
  state: {
    skills: Pick<
      WorkspaceSnapshot['skills'][number],
      'id' | 'version' | 'digest' | 'name' | 'available'
    >[]
  },
  role: RoleVersion,
) => {
  const skills = latestVersions(state.skills)
  return role.skills.map((ref) => {
    const skill = skills.find((item) => item.id === ref.id && item.digest === ref.digest)
    return {
      id: ref.id,
      name: skill?.name ?? ref.id.slice(0, 8),
      available: skill?.available ?? false,
    }
  })
}
