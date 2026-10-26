import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test(
  '需求转任务：固定确切项目与来源版本、预填及失败保留，后台新版本不改绑',
  { timeout: 60000 },
  async () => {
    const first = await createFixture()
    const second = await createFixture()
    const application = await launch(first.data)
    try {
      const page = await configure(application, first.repository)
      const projectA = (await snapshot(page)).projects[0]!
      await navigate(page, '项目管理')
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, second.repository)
      await page.getByRole('button', { name: '新建项目', exact: true }).click()
      const newProject = page.getByRole('dialog', { name: '新建项目', exact: true })
      await newProject.getByLabel('项目名称', { exact: true }).fill('需求目标项目乙')
      await newProject.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await newProject.waitFor({ state: 'detached' })
      const projectB = (await snapshot(page)).projects.find((item) => item.id !== projectA.id)!
      await page.evaluate(
        async ({ a, b }) => {
          for (const projectId of [a, b])
            await window.weftpilot!.workflow.saveRequirement({
              key: crypto.randomUUID(),
              input: {
                expectedVersion: 0,
                projectId,
                title: '同名需求',
                body: projectId === b ? '乙第一版目标' : '甲的目标',
                acceptanceCriteria: projectId === b ? '乙第一版验收' : '甲的验收',
              },
            })
        },
        { a: projectA.id, b: projectB.id },
      )
      const initial = await snapshot(page)
      const source = initial.requirements.find((item) => item.projectId === projectB.id)!
      await navigate(page, '需求管理')
      const row = page.locator(`[data-requirement-id="${source.id}"] .requirement-row`)
      await row.click()
      const detail = page.getByRole('dialog', { name: '需求详情', exact: true })
      await detail.getByRole('button', { name: '创建关联任务', exact: true }).click()
      const taskForm = page.getByRole('dialog', { name: '创建任务', exact: true })
      const project = taskForm.getByRole('combobox', { name: '所属项目', exact: true })
      assert.equal(await project.isDisabled(), true)
      assert.equal(await project.inputValue(), projectB.id)
      assert.equal(await project.getByRole('option').count(), 1)
      assert.equal(
        await taskForm.getByLabel('任务名称', { exact: true }).inputValue(),
        source.title,
      )
      assert.equal(await taskForm.getByLabel('任务目标', { exact: true }).inputValue(), source.body)
      assert.equal(
        await taskForm.getByLabel('验收条件', { exact: true }).inputValue(),
        source.acceptanceCriteria,
      )
      await taskForm.getByLabel('任务目标', { exact: true }).fill('用户调整的任务目标')
      await page.evaluate(
        async (base) =>
          window.weftpilot!.workflow.saveRequirement({
            key: crypto.randomUUID(),
            input: {
              id: base.id,
              expectedVersion: 1,
              projectId: base.projectId,
              title: '乙第二版需求',
              body: '乙第二版目标',
              acceptanceCriteria: '乙第二版验收',
            },
          }),
        source,
      )
      await detail.locator('.requirement-row-top .badge').filter({ hasText: 'v2' }).waitFor()
      await taskForm.getByText('固定需求版本：同名需求 · v1', { exact: true }).waitFor()
      assert.equal(
        await taskForm.getByLabel('任务目标', { exact: true }).inputValue(),
        '用户调整的任务目标',
      )
      assert.equal(
        await taskForm.getByLabel('验收条件', { exact: true }).inputValue(),
        source.acceptanceCriteria,
      )
      await taskForm.getByLabel('任务名称', { exact: true }).fill('   ')
      await taskForm.getByRole('button', { name: '创建待执行任务', exact: true }).click()
      await taskForm.getByRole('alert').waitFor()
      assert.equal((await snapshot(page)).tasks.length, 0)
      assert.equal(
        await taskForm.getByLabel('任务目标', { exact: true }).inputValue(),
        '用户调整的任务目标',
      )
      await taskForm.getByLabel('任务名称', { exact: true }).fill('固定乙需求第一版的任务')
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/requirement-task-create-zh-light.png' })
      await taskForm.getByRole('button', { name: '创建待执行任务', exact: true }).click()
      await page.getByRole('heading', { name: '固定乙需求第一版的任务', exact: true }).waitFor()
      assert.equal(await detail.count(), 0)
      assert.equal(await taskForm.count(), 0)
      const after = await snapshot(page)
      assert.equal(after.tasks.length, 1)
      assert.equal(after.tasks[0]?.projectId, projectB.id)
      assert.deepEqual(after.tasks[0]?.requirementRef, { id: source.id, version: 1 })
      assert.equal(after.tasks[0]?.goal, '用户调整的任务目标')
      assert.equal(after.tasks[0]?.acceptanceCriteria, source.acceptanceCriteria)
      assert.equal(after.runs.length, 0)
      assert.deepEqual(
        after.requirements.find((item) => item.id === source.id && item.version === 1),
        source,
      )
      await navigate(page, '需求管理')
      await row.click()
      await detail.getByRole('button', { name: '关闭', exact: true }).click()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await row.click()
      const englishDetail = page.getByRole('dialog', { name: 'Requirement details', exact: true })
      const create = englishDetail.getByRole('button', { name: 'Create linked task', exact: true })
      await create.focus()
      await page.keyboard.press('Enter')
      const englishTask = page.getByRole('dialog', { name: 'Create task', exact: true })
      await englishTask
        .getByText('Pinned requirement version: 乙第二版需求 · v2', { exact: true })
        .waitFor()
      assert.equal(
        await englishTask.getByLabel('Goal', { exact: true }).inputValue(),
        '乙第二版目标',
      )
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/requirement-task-create-en-dark-700.png' })
      await page.keyboard.press('Escape')
      await englishTask.waitFor({ state: 'detached' })
      assert.equal(await englishDetail.isVisible(), true)
      assert.equal(await create.evaluate((element) => document.activeElement === element), true)
      assert.deepEqual(await snapshot(page), after)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await first.cleanup()
      await second.cleanup()
    }
  },
)
