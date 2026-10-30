import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'
import { prepareDeliveryFixture } from './delivery-fixture'

test(
  '真实工作台：同名项目按UUID进详情、返回归焦/全局重置、发起任务确切回执且0Run',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const second = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, {
        projectName: '工作台同名项目',
      })
      if (process.platform !== 'darwin') {
        const window = await application.browserWindow(page)
        assert.equal(await window.evaluate((native) => native.isMenuBarVisible()), false)
        await page.keyboard.press('Alt')
        assert.equal(await window.evaluate((native) => native.isMenuBarVisible()), false)
      }
      await navigate(page, '项目管理')
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, second.repository)
      await page.getByRole('button', { name: '新建项目', exact: true }).click()
      const create = page.getByRole('dialog', { name: '新建项目', exact: true })
      await create.getByLabel('项目名称', { exact: true }).fill('工作台同名项目')
      await create.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await create.waitFor({ state: 'detached' })
      const before = await snapshot(page)
      const project = before.projects.find((item) => item.repositoryPath === second.repository)!
      assert.ok(project)
      await navigate(page, '工作台')
      const projects = page.getByRole('region', { name: '我的项目', exact: true })
      assert.equal(await projects.locator('[data-project-id]').count(), 2)
      await projects.locator(`[data-project-id="${project.id}"] button`).click()
      await page.getByText(second.repository, { exact: true }).waitFor()
      assert.equal(await page.locator('.project-detail').count(), 1)
      await page.getByRole('button', { name: '返回项目列表', exact: true }).click()
      assert.equal(
        await page
          .locator(`[data-project-id="${project.id}"] button`)
          .evaluate((element) => element === document.activeElement),
        true,
      )
      await navigate(page, '工作台')
      await page.getByRole('button', { name: '全部项目', exact: true }).click()
      assert.equal(await page.locator('.project-detail').count(), 0)
      await navigate(page, '工作台')
      await page.getByRole('button', { name: '发起任务', exact: true }).click()
      const form = page.getByRole('dialog', { name: '创建任务', exact: true })
      await form.getByLabel('所属项目', { exact: true }).selectOption(project.id)
      await form.getByLabel('任务名称', { exact: true }).fill('工作台原文 Task')
      // 菜单栏隐藏后仍需保留真实键盘编辑，不以程序填值代替剪贴板快捷键。
      await form.getByLabel('任务名称', { exact: true }).focus()
      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.press('ControlOrMeta+c')
      await form.getByLabel('任务目标', { exact: true }).focus()
      await page.keyboard.press('ControlOrMeta+v')
      assert.equal(
        await form.getByLabel('任务目标', { exact: true }).inputValue(),
        '工作台原文 Task',
      )
      await form.getByLabel('任务目标', { exact: true }).fill('真实UI创建，不执行CLI。')
      await form.getByLabel('验收条件', { exact: true }).fill('绑定第二项目，不自动运行。')
      await form.getByRole('button', { name: '创建待执行任务', exact: true }).click()
      await page
        .locator('.task-drawer')
        .getByRole('heading', { name: '工作台原文 Task', exact: true })
        .waitFor()
      const after = await snapshot(page)
      assert.equal(after.tasks.length, 1)
      assert.equal(after.tasks[0]!.projectId, project.id)
      assert.equal(after.runs.length, 0)
      assert.deepEqual(after.projects, before.projects)
      await navigate(page, '工作台')
      const recent = page.getByRole('region', { name: '近期工作', exact: true })
      assert.equal(await recent.locator('[data-home-task-id]').count(), 1)
      assert.equal(
        await page
          .getByRole('region', { name: '待我处理', exact: true })
          .locator('[data-home-task-id]')
          .count(),
        0,
      )
      await recent.getByRole('button', { name: /工作台原文 Task/ }).click()
      await page
        .locator('.task-drawer')
        .getByRole('heading', { name: '工作台原文 Task', exact: true })
        .waitFor()
      assert.deepEqual((await snapshot(page)).tasks, after.tasks)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
      await second.cleanup()
    }
  },
)

test(
  '受控交付历史+真实工作台：待验收独立入口、不显示试运行、只读及重启，中英明暗700',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      const before = await snapshot(page)
      const pending = page.getByRole('region', { name: '待我处理', exact: true })
      await pending.locator(`[data-home-task-id="${fixture.taskId}"]`).waitFor()
      assert.equal(await pending.locator('[data-home-task-id]').count(), 1)
      assert.equal(await page.locator('.sidebar-bottom .runtime-note strong').innerText(), '1')
      await pending.getByText('待验收', { exact: true }).waitFor()
      assert.equal(
        await page
          .getByRole('region', { name: '近期工作', exact: true })
          .locator('[data-home-task-id]')
          .count(),
        1,
      )
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '外观', exact: true }).selectOption('light')
      await page.locator('.appearance-settings summary').click()
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/workbench-zh-light.png', fullPage: true })
      await pending.getByRole('button', { name: /受控历史任务/ }).click()
      await page
        .locator('.task-drawer')
        .getByRole('heading', { name: '受控历史任务', exact: true })
        .waitFor()
      await navigate(page, '工作台')
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      if (process.platform !== 'darwin') {
        const window = await application.browserWindow(page)
        assert.equal(await window.evaluate((native) => native.isMenuBarVisible()), false)
      }
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setContentSize(700, 820)))
      await page.getByRole('region', { name: 'My projects', exact: true }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/workbench-en-dark-700.png', fullPage: true })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      assert.deepEqual((await snapshot(page)).runs, before.runs)
      assert.deepEqual((await snapshot(page)).tasks, before.tasks)
      assert.deepEqual((await snapshot(page)).deliveries, before.deliveries)
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.getByRole('heading', { name: 'Put your team in motion.', exact: true }).waitFor()
      const after = await snapshot(page)
      assert.deepEqual(after.tasks, before.tasks)
      assert.deepEqual(after.runs, before.runs)
      assert.deepEqual(after.deliveries, before.deliveries)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
