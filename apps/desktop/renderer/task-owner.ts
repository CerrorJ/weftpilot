import type { Task, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { latestVersions } from './object-versions'

/** 已有Run显示其固定快照；尚未执行时显示实际将被内核选用的最新角色。 */
export const taskOwnerName = (input: {
  run: { roleSnapshot: { name: string } } | undefined
  task: Pick<Task, 'roleId' | 'teamSnapshot'>
  roles: Pick<RoleVersion, 'id' | 'version' | 'name'>[]
}): string | undefined =>
  input.run?.roleSnapshot.name ??
  input.task.teamSnapshot?.name ??
  latestVersions(input.roles).find((item) => item.id === input.task.roleId)?.name
