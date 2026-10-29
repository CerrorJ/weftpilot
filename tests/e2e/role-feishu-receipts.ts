import type { ElectronApplication } from 'playwright'

type Handler = (event: unknown, input: unknown) => Promise<unknown>
type Gate = { hit: boolean; release: () => void; original: Handler }

/** 真实宿主及内核先提交，测试仅扣住一次回执，不替换业务结果。 */
export const holdRoleReceipt = (application: ElectronApplication, roleId: string) =>
  application.evaluate(({ ipcMain }, id) => {
    const state = globalThis as typeof globalThis & { __roleFeishuGate?: Gate }
    const channel = 'workflow:saveRole'
    const handlers = (ipcMain as unknown as { _invokeHandlers: Map<string, Handler> })
      ._invokeHandlers
    const original = handlers.get(channel)
    if (!original) throw new Error('ROLE_HANDLER_REQUIRED')
    let release!: () => void
    const waiting = new Promise<void>((resolve) => {
      release = resolve
    })
    const gate = { hit: false, release, original }
    state.__roleFeishuGate = gate
    ipcMain.removeHandler(channel)
    ipcMain.handle(channel, async (event, input: unknown) => {
      const result = await original(event, input)
      if ((input as { input: { id?: string } }).input.id === id && !gate.hit) {
        gate.hit = true
        await waiting
      }
      return result
    })
  }, roleId)

export const releaseRoleReceipt = (application: ElectronApplication) =>
  application.evaluate(({ ipcMain }) => {
    const state = globalThis as typeof globalThis & { __roleFeishuGate?: Gate }
    if (!state.__roleFeishuGate) return
    state.__roleFeishuGate.release()
    ipcMain.removeHandler('workflow:saveRole')
    ipcMain.handle('workflow:saveRole', state.__roleFeishuGate.original)
    delete state.__roleFeishuGate
  })

export const waitRoleReceipt = async (application: ElectronApplication) => {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const hit = await application.evaluate(
      () => (globalThis as typeof globalThis & { __roleFeishuGate?: Gate }).__roleFeishuGate?.hit,
    )
    if (hit) return
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error('ROLE_RECEIPT_TIMEOUT')
}
