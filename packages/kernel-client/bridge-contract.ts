import type { BusinessCommand } from '@weftpilot/agent-team-kernel/protocol'

type Input<T extends BusinessCommand['type']> = Omit<Extract<BusinessCommand, { type: T }>, 'type'>
export interface Submission<T> {
  key: string
  input: T
}

/** 页面只接触命名业务操作；项目目录来自系统对话框，不接受任意文件路径。 */
export interface WorkflowBridge {
  snapshot(): Promise<unknown>
  createProject(
    input: Submission<Omit<Input<'project.create'>, 'repositoryPath'>>,
  ): Promise<unknown>
  saveRole(input: Submission<Input<'role.save'>>): Promise<unknown>
  saveModel(input: Submission<Input<'model.save'>>): Promise<unknown>
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
  delivery(id: string): Promise<unknown>
  run(id: string): Promise<unknown>
  activity(id: string): Promise<unknown>
}
