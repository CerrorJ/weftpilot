import { contextBridge, ipcRenderer } from 'electron'
import type { WorkflowBridge } from '../../../packages/kernel-client/bridge-contract'

const workflow: WorkflowBridge = {
  createBackup: (input) => ipcRenderer.invoke('workflow:createBackup', input),
  selectBackup: (language) => ipcRenderer.invoke('workflow:selectBackup', language),
  restoreBackup: (ticket) => ipcRenderer.invoke('workflow:restoreBackup', ticket),
  maintenanceStatus: () => ipcRenderer.invoke('workflow:maintenanceStatus'),
  snapshot: () => ipcRenderer.invoke('workflow:snapshot'),
  createProject: (input) => ipcRenderer.invoke('workflow:createProject', input),
  saveRole: (input) => ipcRenderer.invoke('workflow:saveRole', input),
  saveSkillSource: (input) => ipcRenderer.invoke('workflow:saveSkillSource', input),
  importSkill: (input) => ipcRenderer.invoke('workflow:importSkill', input),
  activateSkill: (input) => ipcRenderer.invoke('workflow:activateSkill', input),
  uninstallSkill: (input) => ipcRenderer.invoke('workflow:uninstallSkill', input),
  saveModel: (input) => ipcRenderer.invoke('workflow:saveModel', input),
  saveRequirement: (input) => ipcRenderer.invoke('workflow:saveRequirement', input),
  saveTeam: (input) => ipcRenderer.invoke('workflow:saveTeam', input),
  trialRole: (input) => ipcRenderer.invoke('workflow:trialRole', input),
  setRoleEnabled: (input) => ipcRenderer.invoke('workflow:setRoleEnabled', input),
  createTeamTask: (input) => ipcRenderer.invoke('workflow:createTeamTask', input),
  startTeam: (input) => ipcRenderer.invoke('workflow:startTeam', input),
  createTask: (input) => ipcRenderer.invoke('workflow:createTask', input),
  startRun: (input) => ipcRenderer.invoke('workflow:startRun', input),
  stopRun: (input) => ipcRenderer.invoke('workflow:stopRun', input),
  retryRun: (input) => ipcRenderer.invoke('workflow:retryRun', input),
  acceptDelivery: (input) => ipcRenderer.invoke('workflow:acceptDelivery', input),
  resolveHuman: (input) => ipcRenderer.invoke('workflow:resolveHuman', input),
  saveFeishu: (input) => ipcRenderer.invoke('workflow:saveFeishu', input),
  connectFeishu: () => ipcRenderer.invoke('workflow:connectFeishu'),
  disconnectFeishu: () => ipcRenderer.invoke('workflow:disconnectFeishu'),
  feishuStatus: () => ipcRenderer.invoke('workflow:feishuStatus'),
  openFeishuConsole: () => ipcRenderer.invoke('workflow:openFeishuConsole'),
  delivery: (id) => ipcRenderer.invoke('workflow:delivery', id),
  run: (id) => ipcRenderer.invoke('workflow:run', id),
  activity: (id) => ipcRenderer.invoke('workflow:activity', id),
}

// 只暴露命名查询，不向页面透传 ipcRenderer、通道名称或文件/命令参数。
contextBridge.exposeInMainWorld(
  'weftpilot',
  Object.freeze({
    diagnostics: (): Promise<unknown> => ipcRenderer.invoke('weftpilot:diagnostics'),
    exportDiagnostics: (input: unknown): Promise<unknown> =>
      ipcRenderer.invoke('weftpilot:exportDiagnostics', input),
    appearance: (input: unknown): Promise<void> =>
      ipcRenderer.invoke('weftpilot:appearance', input),
    workflow: Object.freeze(workflow),
  }),
)
