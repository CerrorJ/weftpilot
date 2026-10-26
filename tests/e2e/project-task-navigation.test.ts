import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, createTask, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test(
  '项目任务入口按UUID筛选同名项目：空列表、重置旧筛选、详情入口与全局导航不串项目',
  { timeout: 60000 },
  async () => {
    const first = await createFixture()
    const second = await createFixture()
    const application = await launch(first.data)
    try {
      const page = await configure(application, first.repository, { projectName: '同名项目' })
      const projectA = (await snapshot(page)).projects[0]!
      const openProject = async (id: string) => {
        await navigate(page, '项目管理')
        await page.locator(`[data-project-id="${id}"] .project-card-main`).click()
      }
      const filter = page.getByRole('combobox', { name: '筛选项目', exact: true })
      const rows = page.locator('.task-table tbody tr')
      await openProject(projectA.id)
      await page.getByRole('button', { name: '在任务管理中查看', exact: true }).click()
      assert.equal(await filter.inputValue(), projectA.id)
      assert.equal(await rows.count(), 0)
      await createTask(page, '不执行CLI，仅验证项目入口。', '仅项目甲任务')
      const taskA = (await snapshot(page)).tasks[0]!
      await navigate(page, '项目管理')
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, second.repository)
      await page.getByRole('button', { name: '新建项目', exact: true }).click()
      const createProject = page.getByRole('dialog', { name: '新建项目', exact: true })
      await createProject.getByLabel('项目名称', { exact: true }).fill('同名项目')
      await createProject.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await createProject.waitFor({ state: 'detached' })
      const projectB = (await snapshot(page)).projects.find((item) => item.id !== projectA.id)!
      assert.ok(projectB)
      await page.evaluate(
        async ({ projectId, roleId }) =>
          window.weftpilot!.workflow.createTask({
            key: crypto.randomUUID(),
            input: {
              projectId,
              roleId,
              title: '仅项目乙任务',
              goal: '实际命名IPC创建，未启动CLI。',
              acceptanceCriteria: '只在项目乙筛选中显示。',
            },
          }),
        { projectId: projectB.id, roleId: taskA.roleId! },
      )
      await openProject(projectB.id)
      // 外部命名IPC不会替本窗口刷新React状态，先等待真实订阅/轮询投影到达。
      await page.locator('.task-title').filter({ hasText: '仅项目乙任务' }).waitFor()
      await page.getByRole('button', { name: '在任务管理中查看', exact: true }).click()
      assert.equal(await filter.inputValue(), projectB.id)
      assert.equal(await rows.count(), 1)
      assert.match(await rows.innerText(), /仅项目乙任务/)
      assert.equal(await page.locator('.task-drawer').count(), 0)
      await page.getByRole('searchbox', { name: '搜索任务', exact: true }).fill('无匹配')
      await page.getByRole('button', { name: '执行中', exact: true }).click()
      await navigate(page, '任务管理')
      assert.equal(await filter.inputValue(), '')
      assert.equal(
        await page.getByRole('searchbox', { name: '搜索任务', exact: true }).inputValue(),
        '',
      )
      assert.equal(
        await page
          .getByRole('button', { name: '全部任务', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
      assert.equal(await rows.count(), 2)
      await page.getByRole('searchbox', { name: '搜索任务', exact: true }).fill('无匹配')
      await page.getByRole('button', { name: '执行中', exact: true }).click()
      await openProject(projectA.id)
      await page.getByRole('button', { name: '在任务管理中查看', exact: true }).click()
      assert.equal(await filter.inputValue(), projectA.id)
      assert.equal(
        await page.getByRole('searchbox', { name: '搜索任务', exact: true }).inputValue(),
        '',
      )
      assert.equal(
        await page
          .getByRole('button', { name: '全部任务', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
      assert.equal(await rows.count(), 1)
      assert.match(await rows.innerText(), /仅项目甲任务/)
      await page.locator('.task-title').filter({ hasText: '仅项目甲任务' }).click()
      await page.getByRole('heading', { name: '仅项目甲任务', exact: true }).waitFor()
      await navigate(page, '任务管理')
      assert.equal(await filter.inputValue(), '')
      assert.equal(await page.locator('.task-drawer').count(), 0)
      assert.equal(await rows.count(), 2)
      await navigate(page, '工作台')
      await navigate(page, '任务管理')
      assert.equal(await filter.inputValue(), '')
      assert.equal(await rows.count(), 2)
      await openProject(projectB.id)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.getByText('工作区干净', { exact: true }).waitFor()
      await page
        .getByRole('button', { name: '在任务管理中查看', exact: true })
        .scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/project-task-entry-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await page.getByRole('button', { name: 'View in tasks', exact: true }).waitFor()
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
      await page
        .getByRole('button', { name: 'View in tasks', exact: true })
        .scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/project-task-entry-en-dark-narrow.png' })
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.locator('.task-title').filter({ hasText: '仅项目乙任务' }).click()
      await page.getByRole('heading', { name: '仅项目乙任务', exact: true }).waitFor()
      assert.equal(
        await page.getByRole('combobox', { name: 'Filter by project', exact: true }).inputValue(),
        '',
      )
      assert.equal(await rows.count(), 2)
      const state = await snapshot(page)
      assert.equal(state.tasks.length, 2)
      assert.equal(state.runs.length, 0)
      assert.deepEqual(
        state.tasks.find((item) => item.id === taskA.id),
        taskA,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await first.cleanup()
      await second.cleanup()
    }
  },
)
