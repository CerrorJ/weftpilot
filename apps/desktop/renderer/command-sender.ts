import type { BusinessCommand } from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'
import { isSkillCommand, sendSkillCommand } from './skill-command-sender'

type ConfigurationOrDecisionCommand = Extract<
  BusinessCommand,
  {
    type:
      | 'role.save'
      | 'role.copy'
      | 'model.save'
      | 'requirement.save'
      | 'team.save'
      | 'project.create'
      | 'project.configure'
      | 'human.resolve'
      | 'feishu.save'
      | 'skill.source.save'
      | 'skill.import'
      | 'skill.activate'
      | 'skill.uninstall'
  }
>
export const sendCommand = (command: BusinessCommand, key: string): Promise<unknown> => {
  if (isSkillCommand(command)) return sendSkillCommand(command, key)
  if (isProductConfiguration(command)) return sendProductConfiguration(command, key)
  const api = workflow()
  switch (command.type) {
    case 'role.save':
      return api.saveRole({ key, input: command })
    case 'role.copy':
      return api.copyRole({ key, input: command })
    case 'human.resolve':
      return api.resolveHuman({ key, input: command })
    case 'feishu.save':
      return api.saveFeishu({ key, input: command })
    default:
      return sendExecution(command, key)
  }
}

type ProductConfiguration = Extract<
  BusinessCommand,
  { type: 'model.save' | 'requirement.save' | 'team.save' | 'project.create' | 'project.configure' }
>

const isProductConfiguration = (command: BusinessCommand): command is ProductConfiguration =>
  ['model.save', 'requirement.save', 'team.save', 'project.create', 'project.configure'].includes(
    command.type,
  )

const sendProductConfiguration = (command: ProductConfiguration, key: string): Promise<unknown> => {
  const api = workflow()
  switch (command.type) {
    case 'model.save':
      return api.saveModel({ key, input: command })
    case 'requirement.save':
      return api.saveRequirement({ key, input: command })
    case 'team.save':
      return api.saveTeam({ key, input: command })
    case 'project.configure':
      return api.configureProject({ key, input: command })
    case 'project.create':
      throw new Error('项目目录须从系统对话框选择')
  }
}

const sendExecution = (
  command: Exclude<BusinessCommand, ConfigurationOrDecisionCommand>,
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
