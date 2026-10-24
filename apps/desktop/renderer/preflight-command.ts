import type { BusinessCommand, PreflightInput } from '@weftpilot/agent-team-kernel/protocol'

/** 页面只携带内核预检的原始意图与指纹；不根据最新快照静默替换确认版本。 */
export const confirmedPreflightCommand = (
  intent: PreflightInput,
  configurationFingerprint: string,
): BusinessCommand => {
  const shared = {
    expectedVersion: intent.expectedVersion,
    expectedConfigurationFingerprint: configurationFingerprint,
  }
  if (intent.operation === 'retry') return { type: 'run.retry', runId: intent.id, ...shared }
  return {
    type: intent.operation === 'team' ? 'team.start' : 'run.start',
    taskId: intent.id,
    ...shared,
  }
}
