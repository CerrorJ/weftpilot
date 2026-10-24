import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, createTask, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test('原型八页真实入口：筛选、键盘抽屉、工作台跳转与设置双语明暗', { timeout: 60000 }, async () => {
  const fixture = await createFixture()
  const application = await launch(fixture.data)
  try {
    const page = await configure(application, fixture.repository)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const name of [
      '工作台',
      '项目管理',
      '任务管理',
      '需求管理',
      '角色管理',
      '团队管理',
      '技能中心',
      '设置',
    ]) {
      await navigate(page, name)
      await page.getByRole('heading', { name, exact: true }).waitFor()
    }
    await createTask(page, '此任务不启动 CLI，仅检查真实任务导航。', '对齐原型的第一项任务')
    await page.getByRole('button', { name: '关闭详情', exact: true }).click()
    await createTask(page, '保留另一条真实记录用于筛选。', '另一项任务')
    await page.getByRole('button', { name: '关闭详情', exact: true }).click()
    const state = await snapshot(page)
    assert.equal(state.tasks.length, 2)
    assert.equal(state.runs.length, 0)
    const search = page.getByRole('searchbox', { name: '搜索任务', exact: true })
    await search.fill('不存在的任务')
    await page.getByText('没有符合条件的任务', { exact: true }).waitFor()
    await search.fill(state.tasks[0]!.id.slice(0, 8))
    assert.equal(await page.locator('.task-table tbody tr').count(), 1)
    await page
      .getByRole('combobox', { name: '筛选项目', exact: true })
      .selectOption(state.projects[0]!.id)
    const row = page.locator('.task-table .task-title')
    await row.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: '对齐原型的第一项任务', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await page.locator('.task-drawer').waitFor({ state: 'detached' })
    assert.equal(await row.evaluate((element) => element === document.activeElement), true)
    await navigate(page, '工作台')
    await page.getByRole('button', { name: /另一项任务/ }).click()
    await page.getByRole('heading', { name: '另一项任务', exact: true }).waitFor()
    await page.getByRole('button', { name: '关闭详情', exact: true }).click()
    await mkdir('.tmp/evidence', { recursive: true })
    await page.screenshot({ path: '.tmp/evidence/prototype-tasks-zh-light.png' })
    await navigate(page, '设置')
    const preferences = page.locator('.settings-content .appearance-settings')
    await preferences.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
    await preferences
      .getByRole('combobox', { name: 'Appearance', exact: true })
      .selectOption('dark')
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
    assert.equal(await page.locator('html').getAttribute('lang'), 'en')
    await navigate(page, 'Tasks')
    await page.getByRole('heading', { name: 'Tasks', exact: true }).waitFor()
    await page.setViewportSize({ width: 700, height: 860 })
    await page.screenshot({ path: '.tmp/evidence/prototype-tasks-en-dark-700.png' })
    assert.equal(
      await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
      true,
    )
    assert.deepEqual(errors, [])
    await quit(application)
  } finally {
    await application.close().catch(() => undefined)
    await fixture.cleanup()
  }
})
