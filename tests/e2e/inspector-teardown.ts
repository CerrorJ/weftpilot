import type { ElectronApplication } from 'playwright'

/** 应用已走到will-quit后才释放测试调试连接；不停止任务、不直接退出应用。 */
export const releaseInspectorOnQuit = async (application: ElectronApplication): Promise<void> => {
  await application.evaluate(({ app }) => {
    app.once('will-quit', () => {
      console.error(
        'WEFTPILOT_E2E_LIFECYCLE ' +
          JSON.stringify({ event: 'inspector-detach', pid: process.pid }),
      )
      process.getBuiltinModule('node:inspector').close()
    })
  })
}
