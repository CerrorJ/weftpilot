import { workspaceSnapshotSchema } from '@weftpilot/agent-team-kernel/protocol'
import type { KernelClient } from '../../../packages/kernel-client/client'
import type {
  NotificationPreferences,
  NotificationStatus,
} from '../../../packages/system-bridge/notification-contract'
import { notificationCandidates, type NotificationCandidate } from './notification-projection'

interface WatchOptions {
  client: () => Pick<KernelClient, 'request'>
  preferences: () => NotificationPreferences
  deliver: (candidate: NotificationCandidate) => void
}

/** 主进程独立观察，窗口隐藏/渲染计时器节流不影响提醒。只存内存去重，不写业务库。 */
export class NotificationWatch {
  observation: NotificationStatus['observation'] = 'starting'
  private previousClient: ReturnType<WatchOptions['client']> | undefined
  private observed: Set<string> | undefined
  private timer: ReturnType<typeof setTimeout> | undefined
  private stopped = false
  private busy = false
  private running = false

  constructor(private readonly options: WatchOptions) {}

  start(): void {
    if (this.running || this.stopped) return
    this.running = true
    this.stopped = false
    void this.tick()
  }

  stop(): void {
    this.running = false
    this.stopped = true
    clearTimeout(this.timer)
  }

  async poll(): Promise<void> {
    if (this.busy || this.stopped) return
    this.busy = true
    try {
      const client = this.options.client()
      const state = workspaceSnapshotSchema.parse(await client.request('workspace.snapshot'))
      if (this.stopped || this.options.client() !== client) return
      this.observe(client, notificationCandidates(state))
      this.observation = 'watching'
    } catch {
      // 断线/恢复切换/偏好不可读均停提醒，重连先建基线，不重放旧待办或原始异常。
      this.observed = undefined
      this.observation = 'unavailable'
    } finally {
      this.busy = false
    }
  }

  private observe(
    client: ReturnType<WatchOptions['client']>,
    candidates: NotificationCandidate[],
  ): void {
    const preferences = this.options.preferences()
    const previous = this.previousClient === client ? this.observed : undefined
    this.previousClient = client
    this.observed = new Set(candidates.map((candidate) => candidate.key))
    if (!previous || !preferences.enabled) return
    const notified = new Set<NotificationCandidate['kind']>()
    for (const candidate of candidates) {
      if (
        previous.has(candidate.key) ||
        !preferences[candidate.kind] ||
        notified.has(candidate.kind)
      )
        continue
      notified.add(candidate.kind)
      this.options.deliver(candidate)
    }
  }

  private async tick(): Promise<void> {
    await this.poll()
    if (!this.stopped) this.timer = setTimeout(() => void this.tick(), 2000)
  }
}
