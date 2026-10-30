import { Notification } from 'electron'
import type {
  NotificationKind,
  NotificationStatus,
} from '../../../packages/system-bridge/notification-contract'
import type { NotificationCandidate } from './notification-projection'

const messages: Record<NotificationKind, [string, string]> = {
  human: [
    '有新的澄清或审批请求。打开纬舟查看。',
    'A clarification or approval needs you. Open WeftPilot to review it.',
  ],
  review: [
    '有新的交付等待验收。打开纬舟查看。',
    'A new delivery is awaiting review. Open WeftPilot to inspect it.',
  ],
  failure: ['有执行失败。打开纬舟查看原因。', 'An execution failed. Open WeftPilot to inspect it.'],
  test: ['这是一条纬舟本机测试通知。', 'This is a WeftPilot local test notification.'],
}

/** 通知只携带固定文案，不把任务正文、凭据或路径暴露到系统锁屏。 */
export class NativeNotifications {
  last: NotificationStatus['last']
  language: 'zh-CN' | 'en' = 'zh-CN'
  private readonly active = new Map<NotificationKind, Notification>()

  constructor(private readonly open: (taskId?: string) => void) {}

  supported(): boolean {
    return Notification.isSupported()
  }

  deliver(candidate: NotificationCandidate): void {
    this.show(candidate.kind, candidate.taskId)
  }

  show(kind: NotificationKind, taskId?: string): void {
    if (!this.supported()) throw new Error('NOTIFICATION_UNSUPPORTED')
    try {
      this.active.get(kind)?.close()
      this.last = { kind, state: 'requested', at: new Date().toISOString() }
      const notification = new Notification({
        title: this.language === 'en' ? 'WeftPilot' : '纬舟 WeftPilot',
        body: messages[kind][this.language === 'en' ? 1 : 0],
      })
      this.active.set(kind, notification)
      notification.once('show', () => this.record(notification, kind, 'shown'))
      notification.once('failed', () => this.record(notification, kind, 'failed'))
      notification.on('click', () => this.open(taskId))
      // Windows超时后仍可能留在通知中心；每类保留一个对象，防止点击处理被GC丢弃。
      notification.show()
    } catch {
      this.last = { kind, state: 'failed', at: new Date().toISOString() }
    }
  }

  close(): void {
    for (const notification of this.active.values()) {
      try {
        notification.close()
      } catch {
        /* 系统通知清理不能阻塞已确认停止后的应用退出。 */
      }
    }
    this.active.clear()
  }

  private record(
    notification: Notification,
    kind: NotificationKind,
    state: 'shown' | 'failed',
  ): void {
    if (this.active.get(kind) === notification)
      this.last = { kind, state, at: new Date().toISOString() }
  }
}
