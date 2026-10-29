import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir } from 'node:fs/promises'
import {
  createFixture,
  launch,
  configure,
  createTask,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'

test(
  '真实任务看板：同一任务/筛选/创建回执、列表切换与键盘归焦，中英文深色700px不造Run',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await createTask(page, '只验证看板，不运行CLI。', '原文 Task Alpha')
      let state = await snapshot(page)
      const first = state.tasks.find((value) => value.title === '原文 Task Alpha')!
      await page.getByRole('button', { name: '关闭详情', exact: true }).click()
      await page.getByRole('button', { name: '看板视图', exact: true }).click()
      const card = page.locator(`.task-board [data-task-id="${first.id}"]`)
      await card.waitFor()
      assert.equal(
        await page
          .getByRole('region', { name: '未开始', exact: true })
          .locator('[data-task-id]')
          .count(),
        1,
      )
      assert.equal(await card.getByRole('progressbar').count(), 0)
      await card.click()
      const drawer = page.getByRole('complementary', { name: '任务详情', exact: true })
      await drawer.getByRole('button', { name: '关闭详情', exact: true }).waitFor()
      await drawer.getByRole('button', { name: '关闭详情', exact: true }).focus()
      await page.keyboard.press('Escape')
      await drawer.waitFor({ state: 'detached' })
      assert.equal(await card.evaluate((element) => element === document.activeElement), true)
      await card.click()
      await drawer.getByRole('button', { name: '关闭详情', exact: true }).focus()
      // 实际键盘回工具栏切换，详情身份保持；关闭时按确切ID寻找新列表按钮。
      for (let step = 0; step < 10; step++) {
        await page.keyboard.press('Shift+Tab')
        if (
          await page
            .getByRole('button', { name: '列表视图', exact: true })
            .evaluate((element) => element === document.activeElement)
        )
          break
      }
      assert.equal(
        await page
          .getByRole('button', { name: '列表视图', exact: true })
          .evaluate((element) => element === document.activeElement),
        true,
      )
      await page.keyboard.press('Space')
      await page.locator(`.task-table [data-task-id="${first.id}"]`).waitFor()
      assert.equal(await drawer.isVisible(), true)
      await drawer.getByRole('button', { name: '关闭详情', exact: true }).click()
      assert.equal(
        await page
          .locator(`.task-table [data-task-id="${first.id}"]`)
          .evaluate((element) => element === document.activeElement),
        true,
      )
      await page.getByRole('button', { name: '看板视图', exact: true }).click()
      await page.getByRole('button', { name: '创建任务', exact: true }).click()
      await page.getByLabel('任务名称', { exact: true }).fill('原文 Task Beta')
      await page.getByLabel('任务目标', { exact: true }).fill('只创建，不执行。')
      await page.getByLabel('验收条件', { exact: true }).fill('状态和历史不因视图变化。')
      await page.getByRole('button', { name: '创建待执行任务', exact: true }).click()
      await drawer.getByRole('button', { name: '开始真实执行', exact: true }).waitFor()
      assert.equal(
        await page
          .getByRole('button', { name: '看板视图', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
      await drawer.getByRole('button', { name: '关闭详情', exact: true }).click()
      state = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (value) => value.tasks.length === 2,
      })
      assert.deepEqual(
        state.tasks.find((value) => value.id === first.id),
        first,
      )
      const project = state.projects[0]!
      await page.getByRole('combobox', { name: '筛选项目', exact: true }).selectOption(project.id)
      await page.getByRole('searchbox', { name: '搜索任务', exact: true }).fill('Task Alpha')
      await card.waitFor()
      assert.equal(await page.locator('.task-board [data-task-id]').count(), 1)
      await page.getByRole('button', { name: '列表视图', exact: true }).click()
      assert.equal(
        await page.getByRole('searchbox', { name: '搜索任务', exact: true }).inputValue(),
        'Task Alpha',
      )
      assert.equal(
        await page.getByRole('combobox', { name: '筛选项目', exact: true }).inputValue(),
        project.id,
      )
      await page.getByRole('searchbox', { name: '搜索任务', exact: true }).fill('NO_MATCH')
      await page.getByRole('button', { name: '看板视图', exact: true }).click()
      await page.getByRole('status').filter({ hasText: '没有符合条件的任务' }).waitFor()
      await page.getByRole('searchbox', { name: '搜索任务', exact: true }).fill('')
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setContentSize(1124, 820)))
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/task-board-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setContentSize(700, 820)))
      await page.getByRole('region', { name: 'Task board', exact: true }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/task-board-en-dark-700.png' })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      state = await snapshot(page)
      assert.equal(state.runs.length, 0)
      assert.equal(state.deliveries.length, 0)
      assert.equal(state.tasks.length, 2)
      assert.deepEqual(
        state.tasks.find((value) => value.id === first.id),
        first,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
