import { createInterface } from 'node:readline'
import type { ElectronApplication } from 'playwright'

const marker = 'WEFTPILOT_E2E_LIFECYCLE '

/** 仅测试控制侧启用：输出固定生命周期字段，不转储业务、凭据、路径或进程内存。 */
export const observeLifecycle = async (application: ElectronApplication): Promise<void> => {
  const child = application.process()
  if (!child.stderr) throw new Error('E2E_LIFECYCLE_STDERR_UNAVAILABLE')
  const lines = createInterface({ input: child.stderr })
  lines.on('line', (line) => {
    if (line.startsWith(marker)) console.log(line)
  })
  child.once('exit', (exitCode, signal) => {
    console.log(
      marker + JSON.stringify({ event: 'launcher-exit', pid: child.pid, exitCode, signal }),
    )
  })
  await application.firstWindow()
  await application.evaluate(({ app, BrowserWindow }) => {
    // bind无需tsx的闭包命名helper，序列化到主进程后仍可独立执行。
    const emit = console.error.bind(console, 'WEFTPILOT_E2E_LIFECYCLE')
    app.on('before-quit', () => emit(JSON.stringify({ event: 'before-quit', pid: process.pid })))
    app.on('will-quit', () => emit(JSON.stringify({ event: 'will-quit', pid: process.pid })))
    app.on('quit', () => emit(JSON.stringify({ event: 'quit', pid: process.pid })))
    app.on('child-process-gone', (_event, details) =>
      emit(
        JSON.stringify({
          event: 'child-process-gone',
          pid: process.pid,
          type: details.type,
          reason: details.reason,
          exitCode: details.exitCode,
        }),
      ),
    )
    for (const window of BrowserWindow.getAllWindows()) {
      const windowId = window.id
      window.on('closed', () =>
        emit(JSON.stringify({ event: 'window-closed', pid: process.pid, windowId })),
      )
      window.webContents.on('render-process-gone', (_event, details) =>
        emit(
          JSON.stringify({
            event: 'render-process-gone',
            pid: process.pid,
            reason: details.reason,
            exitCode: details.exitCode,
          }),
        ),
      )
    }
    emit(JSON.stringify({ event: 'observing', pid: process.pid }))
  })
}
