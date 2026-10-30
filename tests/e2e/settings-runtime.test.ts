import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { createFixture, launch, configure, createTask, snapshot, quit } from './workflow-helpers'
import { goRoleStep } from './role-helpers'
import { navigate } from './navigation-helpers'
import {
  notificationStatus,
  assertForeignNotificationSenderRejected,
  configureEnglishDark,
} from './notification-helpers'

test(
  '真实设置角色连接总览：精确角色配置入口/只读状态/旧渠道兼容，中英深色700不改角色版本',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await createTask(page, '只测试通知导航，不执行CLI。', '通知导航任务')
      const before = await snapshot(page)
      const role = before.roles[0]!
      await navigate(page, '设置')
      await page
        .getByRole('navigation', { name: '设置分类', exact: true })
        .getByRole('button', { name: '飞书连接', exact: true })
        .click()
      const row = page.locator(`[data-settings-role-id="${role.id}"]`)
      await row.getByRole('heading', { name: new RegExp(role.name) }).waitFor()
      await row.getByRole('button', { name: '查看连接状态', exact: true }).click()
      await row.getByText('未连接', { exact: true }).waitFor()
      assert.equal(await row.getByRole('button', { name: '连接角色渠道', exact: true }).count(), 0)
      const restoreSession = await page.evaluateHandle(() => {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
        if (!descriptor) throw new Error('TEST_SESSION_DESCRIPTOR_UNAVAILABLE')
        Object.defineProperty(window, 'sessionStorage', {
          configurable: true,
          get() {
            throw new DOMException('CONTROLLED_SESSION_DENIED', 'SecurityError')
          },
        })
        return () => Object.defineProperty(window, 'sessionStorage', descriptor)
      })
      await row.getByRole('button', { name: '配置角色', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '编辑角色配置', exact: true })
      await dialog.waitFor()
      await dialog
        .getByText('本窗口草稿暂存于内存，重载或退出后无法恢复。', { exact: true })
        .waitFor()
      assert.equal(await dialog.getByLabel('角色名称', { exact: true }).inputValue(), role.name)
      await dialog.getByLabel('角色名称', { exact: true }).fill('配置草稿仍保留')
      await goRoleStep(page, 2)
      await dialog.getByRole('button', { name: '去技能市场', exact: true }).click()
      await page.getByRole('button', { name: '返回角色配置', exact: true }).click()
      await dialog.waitFor()
      await goRoleStep(page, 0)
      assert.equal(
        await dialog.getByLabel('角色名称', { exact: true }).inputValue(),
        '配置草稿仍保留',
      )
      assert.deepEqual((await snapshot(page)).roles, before.roles)
      await restoreSession.evaluate((restore) => restore())
      await restoreSession.dispose()
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      await navigate(page, '设置')
      await page
        .getByRole('navigation', { name: '设置分类', exact: true })
        .getByRole('button', { name: '飞书连接', exact: true })
        .click()
      await page.locator('.legacy-feishu summary').click()
      await page.getByRole('textbox', { name: 'App ID', exact: true }).waitFor()
      await page.locator('.legacy-feishu summary').click()
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({
        path: '.tmp/evidence/settings-connections-zh-light.png',
        fullPage: true,
      })
      await configureEnglishDark(page)
      await application
        .browserWindow(page)
        .then((native) => native.evaluate((window) => window.setContentSize(700, 820)))
      await page.getByRole('region', { name: 'Role Feishu connections', exact: true }).waitFor()
      await page.screenshot({
        path: '.tmp/evidence/settings-connections-en-dark-700.png',
        fullPage: true,
      })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      const after = await snapshot(page)
      assert.deepEqual(after.roles, before.roles)
      assert.equal(after.runs.length, 0)
      assert.deepEqual(after.tasks, before.tasks)
      // 真实主进程消息测试私有导航链路；不是用户实际点击了系统通知横幅。
      await application.browserWindow(page).then((native) =>
        native.evaluate((window, id) => {
          window.webContents.send('weftpilot:openTask', id)
        }, before.tasks[0]!.id),
      )
      await page
        .locator('.task-drawer')
        .getByRole('heading', { name: '通知导航任务', exact: true })
        .waitFor()
      assert.deepEqual((await snapshot(page)).tasks, before.tasks)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实本机通知设置：原子偏好/CAS保稿/重启/坏配置保留/严格跨进程来源，真实系统调用不冒称显示成功',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      await navigate(page, '设置')
      await page.getByRole('button', { name: '通知与后台', exact: true }).click()
      const section = page.getByRole('region', { name: '通知与后台', exact: true })
      const enabled = section.getByRole('checkbox', { name: '启用本机系统通知', exact: true })
      await enabled.waitFor()
      assert.equal((await notificationStatus(page)).preferences.enabled, false)
      assert.equal(await enabled.isChecked(), false)
      await enabled.check()
      await section
        .getByRole('checkbox', { name: '任务需要澄清或审批时通知', exact: true })
        .uncheck()
      await section.getByRole('button', { name: '保存通知偏好', exact: true }).click()
      await section
        .getByRole('button', { name: '保存通知偏好', exact: true })
        .waitFor({ state: 'visible' })
      let status = await notificationStatus(page)
      assert.equal(status.preferences.version, 1)
      assert.equal(status.preferences.human, false)
      await page.evaluate(() =>
        window.weftpilot!.notifications.save({
          expectedVersion: 1,
          enabled: true,
          human: true,
          review: false,
          failure: false,
        }),
      )
      await section
        .getByText('通知偏好已在其他操作中更新，当前输入保留；重新载入会替换当前输入。', {
          exact: true,
        })
        .waitFor()
      assert.equal(
        await section
          .getByRole('checkbox', { name: '任务需要澄清或审批时通知', exact: true })
          .isChecked(),
        false,
      )
      await section.getByRole('button', { name: '保存通知偏好', exact: true }).click()
      await section
        .getByRole('alert')
        .filter({ hasText: 'NOTIFICATION_PREFERENCES_CONFLICT' })
        .waitFor()
      assert.equal((await notificationStatus(page)).preferences.version, 2)
      await section.getByRole('button', { name: '重新载入偏好', exact: true }).click()
      await section
        .locator('label')
        .filter({ hasText: '任务需要澄清或审批时通知' })
        .locator('input:checked')
        .waitFor()
      await section
        .getByRole('button', { name: '保存通知偏好', exact: true })
        .waitFor({ state: 'visible' })
      assert.equal(
        await section
          .getByRole('checkbox', { name: '任务需要澄清或审批时通知', exact: true })
          .isChecked(),
        true,
      )
      await enabled.uncheck()
      await section.getByRole('button', { name: '保存通知偏好', exact: true }).click()
      await section.getByRole('button', { name: '发送测试通知', exact: true }).click()
      status = await notificationStatus(page)
      assert.equal(status.last?.kind, 'test')
      assert.ok(['requested', 'shown', 'failed'].includes(status.last.state))
      await assertForeignNotificationSenderRejected(application, page)
      await page.evaluate(() => window.scrollTo(0, 0))
      const invalid = await page.evaluate(async () => {
        try {
          await window.weftpilot!.notifications.save({
            expectedVersion: 3,
            enabled: true,
            human: true,
            review: true,
            failure: true,
            extra: 'blocked',
          })
          return 'allowed'
        } catch (error) {
          return String(error)
        }
      })
      assert.match(invalid, /INPUT_INVALID/)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({
        path: '.tmp/evidence/settings-notifications-zh-light.png',
        fullPage: true,
      })
      await configureEnglishDark(page)
      await application
        .browserWindow(page)
        .then((native) => native.evaluate((window) => window.setContentSize(700, 820)))
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({
        path: '.tmp/evidence/settings-notifications-en-dark-700.png',
        fullPage: true,
      })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      status = await notificationStatus(page)
      await writeFile(
        `.tmp/evidence/notification-native-${process.platform}.json`,
        JSON.stringify(
          {
            platform: process.platform,
            packaged: await application.evaluate(({ app }) => app.isPackaged),
            status,
          },
          null,
          2,
        ),
      )
      const before = await snapshot(page)
      assert.equal(before.runs.length, 0)
      assert.equal(before.tasks.length, 0)
      await quit(application)
      const path = join(fixture.data, 'notification-preferences.json')
      const persisted = await readFile(path, 'utf8')
      application = await launch(fixture.data)
      page = await application.firstWindow()
      assert.deepEqual((await notificationStatus(page)).preferences, status.preferences)
      assert.deepEqual((await snapshot(page)).tasks, before.tasks)
      await quit(application)
      await writeFile(path, '{CONTROLLED_INVALID_PREFERENCES')
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await navigate(page, 'Settings')
      await page.getByRole('button', { name: 'Notifications & background', exact: true }).click()
      await page
        .getByRole('alert')
        .filter({ hasText: 'NOTIFICATION_PREFERENCES_UNAVAILABLE' })
        .waitFor()
      const nativeProbe = await application.evaluateHandle(({ Notification }) => {
        const original = Notification.prototype.show
        let calls = 0
        const replacement = {
          show() {
            calls++
            original.call(this)
          },
        }
        Notification.prototype.show = replacement.show
        return {
          calls() {
            return calls
          },
          restore() {
            Notification.prototype.show = original
          },
        }
      })
      try {
        const rejected = await page.evaluate(async () => {
          try {
            await window.weftpilot!.notifications.test()
            return 'unexpected-allowed'
          } catch (error) {
            return String(error)
          }
        })
        assert.match(rejected, /NOTIFICATION_PREFERENCES_UNAVAILABLE/)
        assert.equal(await nativeProbe.evaluate((probe) => probe.calls()), 0)
      } finally {
        await nativeProbe.evaluate((probe) => probe.restore())
        await nativeProbe.dispose()
      }
      assert.equal(
        await page
          .getByRole('checkbox', { name: 'Enable local system notifications', exact: true })
          .count(),
        0,
      )
      assert.equal(await readFile(path, 'utf8'), '{CONTROLLED_INVALID_PREFERENCES')
      await quit(application)
      await writeFile(path, persisted)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
