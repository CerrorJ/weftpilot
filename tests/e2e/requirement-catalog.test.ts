import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test(
  '需求目录真实闭环：新增/历史、旧版任务、编辑冲突保留输入及中英文深色',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await navigate(page, '需求管理')
      await page.getByRole('heading', { name: '还没有需求', exact: true }).waitFor()
      assert.equal(await page.getByRole('textbox', { name: '需求标题', exact: true }).count(), 0)
      const create = page.getByRole('button', { name: '新建需求', exact: true })
      await create.focus()
      await page.keyboard.press('Enter')
      const creation = page.getByRole('dialog', { name: '新建需求', exact: true })
      await creation.getByLabel('需求标题', { exact: true }).fill('   ')
      await creation.getByLabel('需求内容', { exact: true }).fill('第一版目标与范围')
      await creation.getByLabel('需求验收条件', { exact: true }).fill('检查甲\n检查乙')
      await creation.getByRole('button', { name: '创建需求', exact: true }).click()
      await creation.getByRole('alert').waitFor()
      assert.equal((await snapshot(page)).requirements.length, 0)
      assert.equal(
        await creation.getByLabel('需求内容', { exact: true }).inputValue(),
        '第一版目标与范围',
      )
      await creation.getByLabel('需求标题', { exact: true }).fill('原型需求 <原文>')
      await creation.getByRole('button', { name: '创建需求', exact: true }).click()
      await creation.waitFor({ state: 'detached' })
      const detail = page.getByRole('dialog', { name: '需求详情', exact: true })
      await detail.getByRole('heading', { name: '原型需求 <原文>', exact: true }).waitFor()
      const initial = await snapshot(page)
      const first = initial.requirements[0]!
      await page.evaluate(
        async ({ projectId, roleId, id }) =>
          window.weftpilot!.workflow.createTask({
            key: crypto.randomUUID(),
            input: {
              projectId,
              roleId,
              requirementRef: { id, version: 1 },
              title: '固定需求旧版本',
              goal: '保留原文',
              acceptanceCriteria: '人工检查',
            },
          }),
        { projectId: first.projectId, roleId: initial.roles[0]!.id, id: first.id },
      )
      await detail.getByText('固定需求旧版本', { exact: true }).waitFor()
      await detail.getByRole('button', { name: '编辑需求', exact: true }).click()
      const editor = page.getByRole('dialog', { name: '编辑需求', exact: true })
      await editor.getByLabel('需求内容', { exact: true }).fill('未提交的本机草稿')
      await page.evaluate(
        async (requirement) =>
          window.weftpilot!.workflow.saveRequirement({
            key: crypto.randomUUID(),
            input: {
              id: requirement.id,
              projectId: requirement.projectId,
              expectedVersion: 1,
              title: requirement.title,
              body: '另一窗口提交的第二版',
              acceptanceCriteria: requirement.acceptanceCriteria,
            },
          }),
        first,
      )
      await detail.locator('.requirement-row-top .badge').filter({ hasText: 'v2' }).waitFor()
      assert.equal(
        await editor.getByLabel('需求内容', { exact: true }).inputValue(),
        '未提交的本机草稿',
      )
      await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
      await editor.getByRole('alert').waitFor()
      assert.equal(
        await editor.getByLabel('需求内容', { exact: true }).inputValue(),
        '未提交的本机草稿',
      )
      const conflicted = await snapshot(page)
      assert.equal(conflicted.requirements.length, 2)
      assert.deepEqual(conflicted.requirements[0], first)
      assert.equal(conflicted.tasks[0]?.requirementRef?.version, 1)
      assert.equal(conflicted.runs.length, 0)
      await page.keyboard.press('Escape')
      await editor.waitFor({ state: 'detached' })
      assert.equal(await detail.isVisible(), true)
      await detail.getByRole('button', { name: '编辑需求', exact: true }).click()
      await editor.getByText('编辑基准版本 · v2', { exact: true }).waitFor()
      await editor.getByLabel('需求内容', { exact: true }).fill('第三版目标与范围')
      await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
      await editor.waitFor({ state: 'detached' })
      await detail
        .locator('.requirement-detail > p')
        .filter({ hasText: '第三版目标与范围' })
        .waitFor()
      await detail.locator('summary').filter({ hasText: '需求历史' }).click()
      await detail.locator('.requirement-history').filter({ hasText: '第一版目标与范围' }).waitFor()
      assert.equal(await detail.locator('.requirement-history').count(), 3)
      await detail.getByRole('button', { name: '关闭', exact: true }).click()
      await detail.waitFor({ state: 'detached' })
      assert.equal(await page.locator('.requirement-row').count(), 1)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/requirement-catalog-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      const row = page.getByRole('button', {
        name: 'View requirement · 原型需求 <原文>',
        exact: true,
      })
      await row.focus()
      await page.keyboard.press('Enter')
      const englishDetail = page.getByRole('dialog', { name: 'Requirement details', exact: true })
      await englishDetail.getByRole('button', { name: 'Edit requirement', exact: true }).waitFor()
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/requirement-catalog-en-dark-700.png' })
      await englishDetail.getByText('固定需求旧版本', { exact: true }).click()
      await page.getByRole('heading', { name: '固定需求旧版本', exact: true }).waitFor()
      assert.equal(
        await page.getByRole('dialog', { name: 'Requirement details', exact: true }).count(),
        0,
      )
      const final = await snapshot(page)
      assert.equal(final.requirements.length, 3)
      assert.deepEqual(final.requirements[0], first)
      assert.equal(final.tasks[0]?.requirementRef?.version, 1)
      assert.equal(final.runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
