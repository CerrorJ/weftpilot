import { contextBridge, ipcRenderer } from 'electron'

// 只暴露命名查询，不向页面透传 ipcRenderer、通道名称或文件/命令参数。
contextBridge.exposeInMainWorld(
  'weftpilot',
  Object.freeze({
    diagnostics: (): Promise<unknown> => ipcRenderer.invoke('weftpilot:diagnostics'),
  }),
)
