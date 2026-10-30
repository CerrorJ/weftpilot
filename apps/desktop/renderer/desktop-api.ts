import type { WorkflowBridge } from '../../../packages/kernel-client/bridge-contract'

declare global {
  interface Window {
    weftpilot?: {
      diagnostics(): Promise<unknown>
      exportDiagnostics(input: { ticket: string; language: 'zh-CN' | 'en' }): Promise<unknown>
      appearance(input: {
        language: 'zh-CN' | 'en'
        theme: 'system' | 'light' | 'dark'
      }): Promise<void>
      workflow: WorkflowBridge
      notifications: {
        status(): Promise<unknown>
        save(input: unknown): Promise<unknown>
        test(): Promise<unknown>
      }
      onOpenTask(listener: (id: string) => void): () => void
    }
  }
}

export const workflow = (): WorkflowBridge => {
  if (!window.weftpilot) throw new Error('桌面桥接不可用，请从纬舟应用打开')
  return window.weftpilot.workflow
}
