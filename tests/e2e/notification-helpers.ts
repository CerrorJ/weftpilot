import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import type { ElectronApplication, Page } from 'playwright'
import { notificationStatusSchema } from '../../packages/system-bridge/notification-contract'

export const notificationStatus = async (page: Page) =>
  notificationStatusSchema.parse(
    await page.evaluate(() => window.weftpilot?.notifications.status()),
  )

/** 另一真实渲染进程即使加载同一文件URL/预载，也不获得主窗口的系统桥接权限。 */
export const assertForeignNotificationSenderRejected = async (
  application: ElectronApplication,
  page: Page,
) => {
  const preload = fileURLToPath(new URL('../preload.cjs', page.url()))
  const result = await application.evaluate(
    async ({ BrowserWindow }, input) => {
      const foreign = new BrowserWindow({
        show: false,
        webPreferences: {
          preload: input.preload,
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
        },
      })
      try {
        await foreign.loadURL(input.url)
        return (await foreign.webContents.executeJavaScript(
          "window.weftpilot.notifications.status().then(() => 'unexpected-allowed', e => String(e.message))",
        )) as string
      } finally {
        foreign.close()
      }
    },
    { preload, url: page.url() },
  )
  assert.match(result, /不允许的 IPC 来源/)
}

export const configureEnglishDark = async (page: Page) => {
  await page.locator('.topbar .appearance-settings summary').click()
  await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
  await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
  await page.locator('.topbar .appearance-settings summary').click()
}
