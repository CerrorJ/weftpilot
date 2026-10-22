import type { BusinessCommand } from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'
type SkillCommand = Extract<
  BusinessCommand,
  { type: 'skill.source.save' | 'skill.import' | 'skill.activate' | 'skill.uninstall' }
>

export const isSkillCommand = (command: BusinessCommand): command is SkillCommand =>
  command.type.startsWith('skill.')

export const sendSkillCommand = (command: SkillCommand, key: string): Promise<unknown> => {
  const api = workflow()
  switch (command.type) {
    case 'skill.source.save':
      return api.saveSkillSource({ key, input: command })
    case 'skill.import':
      return api.importSkill({ key, input: command })
    case 'skill.activate':
      return api.activateSkill({ key, input: command })
    case 'skill.uninstall':
      return api.uninstallSkill({ key, input: command })
  }
}
