import { useRef } from 'react'
import type { BusinessCommand, TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { formText } from './form-fields'

export interface SavedTeam {
  id: string
  version: number
}

export const useTeamSubmission = (input: {
  actions: WorkspaceActions
  team: TeamVersion | undefined
  saved: (team: SavedTeam) => void
  reportError: (error: string) => void
}) => {
  const pending = useRef(false)
  return async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current) return
    const element = event.currentTarget
    pending.current = true
    input.reportError('')
    try {
      const command = teamCommand(new FormData(element), input.team)
      const result = await input.actions.execute(command)
      if (!result || !element.isConnected) return
      if (input.team && result.id !== input.team.id)
        return input.reportError('COMMAND_RESULT_UNCERTAIN')
      input.saved({ id: result.id, version: command.expectedVersion + 1 })
    } finally {
      pending.current = false
    }
  }
}

const teamCommand = (
  form: FormData,
  team?: TeamVersion,
): Extract<BusinessCommand, { type: 'team.save' }> => {
  const leader = String(form.get('coordinator') ?? '')
  return {
    type: 'team.save',
    ...(team ? { id: team.id } : {}),
    expectedVersion: team?.version ?? 0,
    name: formText(form, 'name'),
    description: formText(form, 'description'),
    coordinatorRoleId: leader,
    // 负责人已锁定为成员；其余输入交给内核校验，不 trim 或去重非法 UUID。
    roleIds: [
      leader,
      ...form
        .getAll('roles')
        .map(String)
        .filter((id) => id !== leader),
    ],
  }
}
