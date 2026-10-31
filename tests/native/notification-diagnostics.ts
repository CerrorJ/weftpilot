import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline'
import type { ElectronApplication } from 'playwright'

/** 只识别固定Electron42通知诊断行；不保存原错误、UUID、正文或本机路径。 */
export const parseNotificationDiagnostic = (line: string) => {
  if (line.length > 4096) return
  const authorization = line.match(/Notification authorization granted: ([01])$/)
  if (authorization) return { event: 'authorization', granted: authorization[1] === '1' }
  const error = line.match(
    /Error (requesting notification authorization:|scheduling notification \([a-f0-9-]+\)) (.{1,2048})$/i,
  )
  if (error)
    return {
      event: error[1]!.startsWith('requesting') ? 'authorization_error' : 'schedule_error',
      reason: errorReason(error[2]!),
      fingerprint: createHash('sha256').update(error[2]!).digest('hex'),
    }
  const lifecycle = line.match(/Notification (created|scheduled) \([a-f0-9-]+\)$/i)
  if (lifecycle) return { event: lifecycle[1]!.toLowerCase() }
}

const errorReason = (message: string) => {
  if (/notifications are not allowed/i.test(message)) return 'not_allowed'
  if (/not authorized|denied|permission/i.test(message)) return 'permission'
  if (/not found|does not exist|bundle|application|unrecognized/i.test(message)) return 'identity'
  if (/connection|communication|service/i.test(message)) return 'service'
  return 'unknown'
}

/** 仅自有空fixture探针启用；主进程与OS API保持原样，最多记录20个有限事件。 */
export const observeNotificationDiagnostics = (application: ElectronApplication) => {
  if (process.env.WEFTPILOT_NOTIFICATION_DIAGNOSTICS !== '1') return
  const stderr = application.process().stderr
  if (!stderr) throw new Error('NATIVE_DIAGNOSTIC_STDERR_UNAVAILABLE')
  const observations: object[] = []
  const start = performance.now()
  const lines = createInterface({ input: stderr })
  lines.on('line', (line) => {
    if (observations.length >= 20) return
    const event = parseNotificationDiagnostic(line)
    if (event) observations.push({ atMs: Math.floor(performance.now() - start), ...event })
  })
  return {
    snapshot: () => ({ scope: 'post-launch-stderr', observations: [...observations] }),
    close: () => lines.close(),
  }
}
