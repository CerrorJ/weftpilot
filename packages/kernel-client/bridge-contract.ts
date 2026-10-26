import type {
  BusinessCommand,
  PreflightInput,
  CliCheckInput,
} from '@weftpilot/agent-team-kernel/protocol'
import type { ProjectGitCopyInput } from './project-clipboard'

type Input<T extends BusinessCommand['type']> = Omit<Extract<BusinessCommand, { type: T }>, 'type'>
export type ModelSubmission = Input<'model.save'> & { secret?: string }
export type FeishuSubmission = Input<'feishu.save'> & { secret?: string }
export interface Submission<T> {
  key: string
  input: T
}

/** 页面只接触命名业务操作；项目目录来自系统对话框，不接受任意文件路径。 */
export interface WorkflowBridge {
  createBackup(input: { key: string; language: 'zh-CN' | 'en' }): Promise<unknown>
  selectBackup(language: 'zh-CN' | 'en'): Promise<unknown>
  restoreBackup(ticket: string): Promise<unknown>
  maintenanceStatus(): Promise<unknown>
  snapshot(): Promise<unknown>
  inspectProject(input: { projectId: string }): Promise<unknown>
  copyProjectGitAddress(input: ProjectGitCopyInput): Promise<unknown>
  preflight(input: PreflightInput): Promise<unknown>
  checkCli(input: CliCheckInput): Promise<unknown>
  createProject(
    input: Submission<Omit<Input<'project.create'>, 'repositoryPath'>>,
  ): Promise<unknown>
  saveRole(input: Submission<Input<'role.save'>>): Promise<unknown>
  copyRole(input: Submission<Input<'role.copy'>>): Promise<unknown>
  saveSkillSource(input: Submission<Input<'skill.source.save'>>): Promise<unknown>
  importSkill(input: Submission<Input<'skill.import'>>): Promise<unknown>
  activateSkill(input: Submission<Input<'skill.activate'>>): Promise<unknown>
  uninstallSkill(input: Submission<Input<'skill.uninstall'>>): Promise<unknown>
  saveModel(input: Submission<ModelSubmission>): Promise<unknown>
  saveRequirement(input: Submission<Input<'requirement.save'>>): Promise<unknown>
  saveTeam(input: Submission<Input<'team.save'>>): Promise<unknown>
  trialRole(input: Submission<Input<'role.trial'>>): Promise<unknown>
  setRoleEnabled(input: Submission<Input<'role.setEnabled'>>): Promise<unknown>
  createTeamTask(input: Submission<Input<'team.createTask'>>): Promise<unknown>
  startTeam(input: Submission<Input<'team.start'>>): Promise<unknown>
  createTask(input: Submission<Input<'task.create'>>): Promise<unknown>
  startRun(input: Submission<Input<'run.start'>>): Promise<unknown>
  stopRun(input: Submission<Input<'run.stop'>>): Promise<unknown>
  retryRun(input: Submission<Input<'run.retry'>>): Promise<unknown>
  acceptDelivery(input: Submission<Input<'delivery.accept'>>): Promise<unknown>
  resolveHuman(input: Submission<Input<'human.resolve'>>): Promise<unknown>
  saveFeishu(input: Submission<FeishuSubmission>): Promise<unknown>
  connectFeishu(): Promise<unknown>
  disconnectFeishu(): Promise<unknown>
  feishuStatus(): Promise<unknown>
  openFeishuConsole(): Promise<void>
  delivery(id: string): Promise<unknown>
  run(id: string): Promise<unknown>
  activity(id: string): Promise<unknown>
}
