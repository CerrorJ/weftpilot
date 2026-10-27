import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test(
  '需求优先级/阶段：旧值不补造、严格拒绝、版本冲突保留、清除及重启；不改变执行/审批',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const initial = await snapshot(page)
      const projectId = initial.projects[0]!.id
      await page.evaluate(
        async (id) =>
          window.weftpilot!.workflow.saveRequirement({
            key: crypto.randomUUID(),
            input: {
              expectedVersion: 0,
              projectId: id,
              title: '旧版需求',
              body: '不能补写历史属性',
              acceptanceCriteria: '保留原文和引用',
            },
          }),
        projectId,
      )
      const original = (await snapshot(page)).requirements[0]!
      await page.evaluate(
        async ({ projectId, roleId, requirementId }) =>
          window.weftpilot!.workflow.createTask({
            key: crypto.randomUUID(),
            input: {
              projectId,
              roleId,
              requirementRef: { id: requirementId, version: 1 },
              title: '固定旧需求的任务',
              goal: '保持待执行',
              acceptanceCriteria: '不改状态',
            },
          }),
        { projectId, roleId: initial.roles[0]!.id, requirementId: original.id },
      )
      await navigate(page, '需求管理')
      const row = page.locator(`[data-requirement-id="${original.id}"] .requirement-row`)
      await row.getByText('阶段未设置', { exact: true }).waitFor()
      await row.click()
      const detail = page.getByRole('dialog', { name: '需求详情', exact: true })
      const metadata = detail.locator('.requirement-detail > .requirement-metadata')
      await metadata.getByText('阶段未设置', { exact: true }).waitFor()
      await detail.getByRole('button', { name: '编辑需求', exact: true }).click()
      const editor = page.getByRole('dialog', { name: '编辑需求', exact: true })
      const priority = editor.getByLabel('需求优先级', { exact: true })
      const stage = editor.getByLabel('需求阶段', { exact: true })
      assert.equal(await priority.inputValue(), '')
      assert.equal(await stage.inputValue(), '')
      await priority.evaluate((element) => {
        const select = element as HTMLSelectElement
        select.add(new Option('非法值', 'urgent'))
        select.value = 'urgent'
      })
      await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
      await editor.getByRole('alert').filter({ hasText: 'INPUT_INVALID' }).waitFor()
      assert.equal((await snapshot(page)).requirements.length, 1)
      assert.equal(await priority.inputValue(), 'urgent')
      await priority.selectOption('high')
      await stage.selectOption('plan_confirmed')
      await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
      await editor.waitFor({ state: 'detached' })
      await metadata.getByText('方案已确认', { exact: true }).waitFor()
      const version2 = (await snapshot(page)).requirements.find(
        (item) => item.id === original.id && item.version === 2,
      )!
      assert.equal(version2.priority, 'high')
      assert.equal(version2.stage, 'plan_confirmed')
      await detail.getByRole('button', { name: '编辑需求', exact: true }).click()
      for (const invalid of [
        { label: '需求优先级', value: '   ' },
        { label: '需求优先级', value: ' high ' },
        { label: '需求阶段', value: '   ' },
        { label: '需求阶段', value: ' implementing ' },
      ]) {
        const beforeInvalid = await snapshot(page)
        const select = editor.getByLabel(invalid.label, { exact: true })
        await select.evaluate((element, value) => {
          const target = element as HTMLSelectElement
          target.add(new Option('非法空白值', value))
          target.value = value
        }, invalid.value)
        await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
        await editor.getByRole('alert').filter({ hasText: 'INPUT_INVALID' }).waitFor()
        assert.equal(await select.inputValue(), invalid.value)
        assert.deepEqual(await snapshot(page), beforeInvalid)
        await page.keyboard.press('Escape')
        await editor.waitFor({ state: 'detached' })
        await detail.getByRole('button', { name: '编辑需求', exact: true }).click()
        assert.equal(await priority.inputValue(), 'high')
        assert.equal(await stage.inputValue(), 'plan_confirmed')
      }
      await priority.selectOption('medium')
      await stage.selectOption('implementing')
      await page.evaluate(
        async (base) =>
          window.weftpilot!.workflow.saveRequirement({
            key: crypto.randomUUID(),
            input: {
              id: base.id,
              expectedVersion: 2,
              projectId: base.projectId,
              title: base.title,
              body: base.body,
              acceptanceCriteria: base.acceptanceCriteria,
              priority: 'low',
              stage: 'awaiting_confirmation',
            },
          }),
        version2,
      )
      await detail.locator('.requirement-row-top .badge').filter({ hasText: 'v3' }).waitFor()
      assert.equal(await priority.inputValue(), 'medium')
      assert.equal(await stage.inputValue(), 'implementing')
      await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
      await editor.getByRole('alert').filter({ hasText: '数据已变化' }).waitFor()
      assert.equal((await snapshot(page)).requirements.length, 3)
      assert.equal(await stage.inputValue(), 'implementing')
      await page.keyboard.press('Escape')
      await editor.waitFor({ state: 'detached' })
      await detail.getByRole('button', { name: '编辑需求', exact: true }).click()
      assert.equal(await priority.inputValue(), 'low')
      assert.equal(await stage.inputValue(), 'awaiting_confirmation')
      await priority.selectOption('')
      await stage.selectOption('')
      await editor.getByRole('button', { name: '保存新版本', exact: true }).click()
      await editor.waitFor({ state: 'detached' })
      await metadata.getByText('阶段未设置', { exact: true }).waitFor()
      await detail.locator('summary').filter({ hasText: '需求历史' }).click()
      const history = detail.locator('.requirement-history')
      await history.filter({ hasText: 'v2' }).getByText('方案已确认', { exact: true }).waitFor()
      await history.filter({ hasText: 'v1' }).getByText('阶段未设置', { exact: true }).waitFor()
      await detail.getByRole('button', { name: '关闭', exact: true }).click()
      await page.getByRole('button', { name: '新建需求', exact: true }).click()
      const creation = page.getByRole('dialog', { name: '新建需求', exact: true })
      assert.equal(await creation.getByLabel('需求优先级', { exact: true }).inputValue(), 'medium')
      assert.equal(
        await creation.getByLabel('需求阶段', { exact: true }).inputValue(),
        'needs_clarification',
      )
      await creation.getByLabel('需求标题', { exact: true }).fill('所有者记录的阶段')
      await creation.getByLabel('需求内容', { exact: true }).fill('阶段不等于执行证明')
      await creation.getByLabel('需求验收条件', { exact: true }).fill('人工检查')
      await creation.getByLabel('需求阶段', { exact: true }).selectOption('implementing')
      await creation.getByRole('button', { name: '创建需求', exact: true }).click()
      await creation.waitFor({ state: 'detached' })
      await metadata.getByText('实现中', { exact: true }).waitFor()
      await detail.getByRole('button', { name: '关闭', exact: true }).click()
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/requirement-metadata-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await row.click()
      const englishDetail = page.getByRole('dialog', { name: 'Requirement details', exact: true })
      await englishDetail.getByRole('button', { name: 'Edit requirement', exact: true }).click()
      const englishEditor = page.getByRole('dialog', { name: 'Edit requirement', exact: true })
      assert.equal(
        await englishEditor.getByLabel('Requirement priority', { exact: true }).inputValue(),
        '',
      )
      assert.equal(
        await englishEditor.getByLabel('Requirement stage', { exact: true }).inputValue(),
        '',
      )
      await englishEditor
        .getByText(
          'You record this stage. Task execution, plan approval and delivery acceptance remain separate.',
          { exact: true },
        )
        .waitFor()
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/requirement-metadata-en-dark-700.png' })
      await page.keyboard.press('Escape')
      await englishEditor.waitFor({ state: 'detached' })
      assert.equal(await englishDetail.isVisible(), true)
      const beforeRestart = await snapshot(page)
      assert.deepEqual(
        beforeRestart.requirements.find((item) => item.id === original.id && item.version === 1),
        original,
      )
      assert.equal(Object.hasOwn(original, 'priority'), false)
      assert.equal(
        beforeRestart.requirements.find((item) => item.id === original.id && item.version === 4)
          ?.stage,
        null,
      )
      assert.deepEqual(beforeRestart.tasks[0]?.requirementRef, { id: original.id, version: 1 })
      assert.equal(beforeRestart.tasks[0]?.status, 'ready')
      assert.equal(beforeRestart.runs.length, 0)
      assert.equal(beforeRestart.humanRequests.length, 0)
      await quit(application)
      application = await launch(fixture.data)
      const reopened = await application.firstWindow()
      await reopened.getByRole('button', { name: 'Requirements', exact: true }).waitFor()
      const restored = await snapshot(reopened)
      assert.deepEqual(restored.requirements, beforeRestart.requirements)
      assert.deepEqual(restored.tasks, beforeRestart.tasks)
      assert.equal(restored.runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
