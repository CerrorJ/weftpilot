import type { BusinessCommand } from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'

type CatalogCommand = Extract<
  BusinessCommand,
  { type: 'role.save' | 'model.save' | 'requirement.save' | 'team.save' | 'project.create' }
>
export const sendCommand = (command: BusinessCommand, key: string): Promise<unknown> => {
  const api = workflow()
  switch (command.type) {
    case 'role.save':
      return api.saveRole({ key, input: command })
    case 'model.save':
      return api.saveModel({ key, input: command })
    case 'requirement.save':
      return api.saveRequirement({ key, input: command })
    case 'team.save':
      return api.saveTeam({ key, input: command })
    case 'project.create':
      throw new Error('项目目录须从系统对话框选择')
    default:
      return sendExecution(command, key)
  }
}

const sendExecution = (
  command: Exclude<BusinessCommand, CatalogCommand>,
  key: string,
): Promise<unknown> => {
  const api = workflow()
  switch (command.type) {
    case 'task.create':
      return api.createTask({ key, input: command })
    case 'run.start':
      return api.startRun({ key, input: command })
    case 'run.stop':
      return api.stopRun({ key, input: command })
    case 'run.retry':
      return api.retryRun({ key, input: command })
    case 'delivery.accept':
      return api.acceptDelivery({ key, input: command })
    case 'role.trial':
      return api.trialRole({ key, input: command })
    case 'role.setEnabled':
      return api.setRoleEnabled({ key, input: command })
    case 'team.createTask':
      return api.createTeamTask({ key, input: command })
    case 'team.start':
      return api.startTeam({ key, input: command })
  }
}
