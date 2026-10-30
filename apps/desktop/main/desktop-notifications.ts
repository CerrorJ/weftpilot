import { ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import type { KernelClient } from '../../../packages/kernel-client/client'
import {
  notificationStatusSchema,
  notificationUpdateSchema,
  type NotificationStatus,
} from '../../../packages/system-bridge/notification-contract'
import { parseInput } from './input-validation'
import { NotificationStore } from './notification-store'
import { NotificationWatch } from './notification-watch'
import { NativeNotifications } from './native-notifications'

interface NotificationContext {
  userData: string
  rendererUrl: string
  window: () => BrowserWindow | undefined
  client: () => KernelClient
}

/** 命名系统桥接：页面只能改偏好或发送固定测试文案，不能提交任意通知/业务快照。 */
export class DesktopNotifications {
  private readonly store: NotificationStore
  private readonly native: NativeNotifications
  private readonly watch: NotificationWatch
  private lastTestAt = 0

  constructor(private readonly context: NotificationContext) {
    this.store = new NotificationStore(context.userData)
    this.native = new NativeNotifications((taskId) => this.open(taskId))
    this.watch = new NotificationWatch({
      client: context.client,
      preferences: () => this.store.read(),
      deliver: (candidate) => this.native.deliver(candidate),
    })
  }

  register(): void {
    ipcMain.handle('weftpilot:notifications:status', (event, raw: unknown) => {
      this.assertSender(event)
      parseInput(z.undefined(), raw)
      return this.status()
    })
    ipcMain.handle('weftpilot:notifications:save', (event, raw: unknown) => {
      this.assertSender(event)
      this.store.save(parseInput(notificationUpdateSchema, raw))
      return this.status()
    })
    ipcMain.handle('weftpilot:notifications:test', (event, raw: unknown) => {
      this.assertSender(event)
      parseInput(z.undefined(), raw)
      if (Date.now() - this.lastTestAt < 3000) throw new Error('NOTIFICATION_TEST_RATE_LIMITED')
      // 系统通知不能随之后的文件读取失败回滚；先核对偏好，再用此快照返回投递回执。
      const status = this.status()
      this.lastTestAt = Date.now()
      this.native.show('test')
      return { ...status, ...(this.native.last ? { last: this.native.last } : {}) }
    })
  }

  status(): NotificationStatus {
    return notificationStatusSchema.parse({
      preferences: this.store.read(),
      supported: this.native.supported(),
      observation: this.watch.observation,
      ...(this.native.last ? { last: this.native.last } : {}),
    })
  }

  language(language: 'zh-CN' | 'en'): void {
    this.native.language = language
  }
  start(): void {
    this.watch.start()
  }
  stop(): void {
    this.watch.stop()
    this.native.close()
  }

  private assertSender(event: IpcMainInvokeEvent): void {
    const window = this.context.window()
    if (
      !window ||
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== this.context.rendererUrl
    )
      throw new Error('不允许的 IPC 来源')
  }

  private open(taskId?: string): void {
    const window = this.context.window()
    if (!window || window.isDestroyed()) return
    window.show()
    if (taskId) window.webContents.send('weftpilot:openTask', taskId)
  }
}
