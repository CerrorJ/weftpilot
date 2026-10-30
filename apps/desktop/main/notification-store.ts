import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  defaultNotificationPreferences,
  notificationPreferencesSchema,
  type NotificationPreferences,
  type NotificationUpdate,
} from '../../../packages/system-bridge/notification-contract'

/** 仅保存本机界面偏好。单实例主进程同步CAS/同目录替换，不含业务对象、路径或凭据。 */
export class NotificationStore {
  private readonly path: string

  constructor(userData: string) {
    this.path = join(userData, 'notification-preferences.json')
  }

  read(): NotificationPreferences {
    try {
      const file = lstatSync(this.path)
      if (!file.isFile() || file.isSymbolicLink() || file.size > 4096) throw new Error('invalid')
      return notificationPreferencesSchema.parse(JSON.parse(readFileSync(this.path, 'utf8')))
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return { ...defaultNotificationPreferences }
      throw new Error('NOTIFICATION_PREFERENCES_UNAVAILABLE')
    }
  }

  save(input: NotificationUpdate): NotificationPreferences {
    const current = this.read()
    if (input.expectedVersion !== current.version)
      throw new Error('NOTIFICATION_PREFERENCES_CONFLICT')
    const { expectedVersion, ...options } = input
    const next = notificationPreferencesSchema.parse({ ...options, version: expectedVersion + 1 })
    this.replace(next)
    return next
  }

  private replace(value: NotificationPreferences): void {
    const temporary = `${this.path}.${randomUUID()}.tmp`
    let created = false
    try {
      mkdirSync(dirname(this.path), { recursive: true })
      const descriptor = openSync(temporary, 'wx', 0o600)
      created = true
      try {
        writeFileSync(descriptor, JSON.stringify(value), 'utf8')
        fsyncSync(descriptor)
      } finally {
        closeSync(descriptor)
      }
      renameSync(temporary, this.path)
    } catch {
      throw new Error('NOTIFICATION_PREFERENCES_UNAVAILABLE')
    } finally {
      // 清理仅限本次确实创建的临时文件；失败不碰上一个有效配置。
      if (created) {
        try {
          rmSync(temporary, { force: true })
        } catch {
          /* 下次人工诊断可见，不能掩盖主写入结果。 */
        }
      }
    }
  }
}
