import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { navigate } from './navigation-helpers'
import { configure, createFixture, createTask, launch, quit, snapshot } from './workflow-helpers'

test(
  '真实窗口：外观弹层在外部导航/焦点移出/Escape收起，不能遮挡任务关闭且不造Run',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await createTask(page, '只验证弹层与任务入口，不执行CLI。', '外观弹层回归')
      const task = (await snapshot(page)).tasks.find((item) => item.title === '外观弹层回归')!
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/appearance-drawer-zh-light.png' })
      await page.getByRole('button', { name: '关闭详情', exact: true }).click()
      const before = await snapshot(page)
      const appearance = page.locator('.topbar .appearance-settings')
      const summary = appearance.locator('summary')
      await summary.click()
      await appearance.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await appearance
        .getByRole('combobox', { name: 'Appearance', exact: true })
        .selectOption('dark')
      assert.equal(
        await appearance.evaluate((element) => (element as HTMLDetailsElement).open),
        true,
      )
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setContentSize(700, 820)))
      await navigate(page, 'Overview')
      await page.locator(`[data-home-task-id="${task.id}"] button`).click()
      const drawer = page.getByRole('complementary', { name: 'Task details', exact: true })
      await drawer.getByRole('heading', { name: task.title, exact: true }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/appearance-drawer-en-dark-700.png' })
      assert.equal(
        await appearance.evaluate((element) => (element as HTMLDetailsElement).open),
        false,
      )
      await drawer.getByRole('button', { name: 'Close details', exact: true }).click()
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      await summary.click()
      await page.keyboard.press('Escape')
      assert.equal(
        await appearance.evaluate((element) => (element as HTMLDetailsElement).open),
        false,
      )
      assert.equal(await summary.evaluate((element) => element === document.activeElement), true)
      await summary.click()
      await appearance.getByRole('combobox', { name: 'Appearance', exact: true }).focus()
      await page.keyboard.press('Tab')
      assert.equal(
        await appearance.evaluate((element) => (element as HTMLDetailsElement).open),
        false,
      )
      await navigate(page, 'Settings')
      const expanded = page.locator('.settings-content .appearance-settings')
      await expanded
        .getByRole('combobox', { name: 'Appearance', exact: true })
        .selectOption('light')
      await page.getByRole('heading', { name: 'Settings', exact: true }).click()
      assert.equal(await expanded.evaluate((element) => (element as HTMLDetailsElement).open), true)
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
