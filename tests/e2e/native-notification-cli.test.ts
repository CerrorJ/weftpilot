import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  businessSnapshot,
  configure,
  createFixture,
  createTask,
  launch,
  quit,
  waitForSnapshot,
} from './workflow-helpers'
import { confirmPreflight } from './preflight-helpers'
import { notificationStatus } from './notification-helpers'

test(
  '真实Codex与隐藏窗口：内核交付经JSON IPC触发原生提醒，未自动验收',
  { timeout: 300000, skip: process.env.WEFTPILOT_REAL_NOTIFICATIONS !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      await createTask(
        page,
        'In this isolated repository create hello.txt containing exactly WEFTPILOT_M1_OK followed by a newline. Do not use network, install anything, touch other directories, commit or push. Reply briefly.',
      )
      const initial = await notificationStatus(page)
      assert.equal(initial.supported, true, '真实系统必须提供通知API；不使用替身成功')
      await page.evaluate((expectedVersion) => {
        return window.weftpilot?.notifications.save({
          expectedVersion,
          enabled: true,
          human: false,
          review: true,
          failure: false,
        })
      }, initial.preferences.version)
      await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
      await confirmPreflight(page)
      const nativeWindow = await application.browserWindow(page)
      await nativeWindow.evaluate((window) => window.hide())
      assert.equal(await nativeWindow.evaluate((window) => window.isVisible()), false)
      await waitForSnapshot({
        page,
        timeout: 180000,
        predicate: (state) =>
          state.tasks.some((task) => task.purpose !== 'role_trial' && task.status === 'in_review'),
      })
      // 不调用测试通知、不替换worker/系统API；主进程自行从真实快照发现交付。
      const deadline = Date.now() + 15000
      let status = await notificationStatus(page)
      while (status.last?.kind !== 'review' || status.last.state === 'requested') {
        assert.ok(Date.now() < deadline, '真实交付后的原生通知回执超时')
        await new Promise((resolve) => setTimeout(resolve, 150))
        status = await notificationStatus(page)
      }
      assert.equal(status.last.state, 'shown', 'API失败不当作系统已接收')
      assert.equal(await nativeWindow.evaluate((window) => window.isVisible()), false)
      const state = await businessSnapshot(page)
      assert.equal(state.runs.length, 1)
      assert.equal(state.runs[0]?.status, 'succeeded')
      assert.equal(state.runs[0]?.processState, 'confirmed_ended')
      assert.equal(state.tasks[0]?.status, 'in_review')
      assert.equal(state.acceptances.length, 0)
      const directory = state.runs[0]?.workDirectory
      assert.ok(directory)
      assert.equal(await readFile(join(directory, 'hello.txt'), 'utf8'), 'WEFTPILOT_M1_OK\n')
      assert.equal(state.deliveries.length, 1)
      await mkdir('.tmp/evidence', { recursive: true })
      await writeFile(
        `.tmp/evidence/notification-native-real-cli-${process.platform}.json`,
        JSON.stringify({
          platform: process.platform,
          hidden: true,
          status,
          runs: 1,
          acceptances: 0,
        }),
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
