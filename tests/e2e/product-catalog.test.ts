import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, quit, configure, snapshot } from './workflow-helpers'

test(
  '真实窗口：模型快照、需求版本、团队 DAG 与未就绪守卫，中英文新界面',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await page.getByRole('button', { name: '模型、需求与团队', exact: true }).click()
      await page.getByRole('textbox', { name: '配置名称', exact: true }).fill('版本模型')
      await page.getByRole('button', { name: '创建模型配置', exact: true }).click()
      await page
        .getByRole('option', { name: '版本模型 · v1', exact: true })
        .waitFor({ state: 'attached' })
      await page.getByRole('button', { name: '项目与角色', exact: true }).click()
      await page
        .getByRole('combobox', { name: '编辑角色', exact: true })
        .selectOption({ label: '测试开发者 · v1' })
      const modelId = (await snapshot(page)).models[0]!.id
      await page
        .getByRole('combobox', { name: '模型配置', exact: true })
        .selectOption(`${modelId}@1`)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await page
        .getByRole('option', { name: '测试开发者 · v2', exact: true })
        .waitFor({ state: 'attached' })
      await page.getByRole('button', { name: '模型、需求与团队', exact: true }).click()
      await page.getByRole('combobox', { name: '编辑模型配置', exact: true }).selectOption(modelId)
      await page
        .getByRole('textbox', { name: '模型标识（可选）', exact: true })
        .fill('synthetic-model-v2')
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await page
        .getByRole('option', { name: '版本模型 · v2', exact: true })
        .waitFor({ state: 'attached' })
      let state = await snapshot(page)
      assert.equal(state.roles.at(-1)?.modelProfileSnapshot?.version, 1)
      assert.equal(state.roles.at(-1)?.model, '')
      assert.equal(state.models.at(-1)?.model, 'synthetic-model-v2')

      await page.getByRole('textbox', { name: '需求标题', exact: true }).fill('产品需求')
      await page.getByRole('textbox', { name: '需求内容', exact: true }).fill('原始需求内容')
      await page.getByRole('textbox', { name: '需求验收条件', exact: true }).fill('原始需求条件')
      await page.getByRole('button', { name: '创建需求', exact: true }).click()
      await page
        .getByRole('option', { name: '产品需求 · v1', exact: true })
        .waitFor({ state: 'attached' })
      const requirementId = (await snapshot(page)).requirements[0]!.id
      await page
        .getByRole('combobox', { name: '编辑需求', exact: true })
        .selectOption(requirementId)
      await page.getByRole('textbox', { name: '需求内容', exact: true }).fill('第二版需求内容')
      // 当前同时有模型和需求两个保存按钮，按所属 section 选择。
      await page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '需求版本', exact: true }) })
        .getByRole('button', { name: '保存新版本', exact: true })
        .click()
      await page
        .getByRole('option', { name: '产品需求 · v2', exact: true })
        .waitFor({ state: 'attached' })
      await page.getByRole('textbox', { name: '团队名称', exact: true }).fill('产品团队')
      await page.getByRole('checkbox', { name: '测试开发者 · codex', exact: true }).check()
      await page.getByRole('button', { name: '创建团队', exact: true }).click()
      await page
        .getByRole('option', { name: '产品团队 · v1', exact: true })
        .waitFor({ state: 'attached' })

      await page.getByRole('button', { name: '任务与交付', exact: true }).click()
      await page
        .locator('.task-create')
        .filter({ has: page.locator('summary').filter({ hasText: /^创建任务$/ }) })
        .locator('summary')
        .click()
      await page.getByRole('textbox', { name: '任务名称', exact: true }).fill('固定旧需求')
      await page.getByRole('textbox', { name: '任务目标', exact: true }).fill('实现需求')
      await page.getByRole('textbox', { name: '验收条件', exact: true }).fill('人工检查')
      await page
        .getByRole('combobox', { name: '绑定需求版本（可选）', exact: true })
        .selectOption(`${requirementId}@1`)
      await page.getByRole('button', { name: '创建待执行任务', exact: true }).click()
      await page.getByRole('heading', { name: '固定旧需求', exact: true }).waitFor()
      state = await snapshot(page)
      assert.equal(state.tasks.at(-1)?.requirementRef?.version, 1)

      await page
        .locator('summary')
        .filter({ hasText: /^创建团队任务$/ })
        .click()
      await page.getByRole('textbox', { name: '团队任务名称', exact: true }).fill('依赖计划')
      await page.getByRole('textbox', { name: '团队目标', exact: true }).fill('两个角色步骤')
      await page.getByRole('textbox', { name: '团队验收条件', exact: true }).fill('全部子任务验收')
      await page.getByRole('button', { name: '添加子任务', exact: true }).click()
      for (let index = 0; index < 2; index++) {
        const step = page.locator('.plan-step').nth(index)
        await step
          .getByRole('textbox', { name: '子任务名称', exact: true })
          .fill(`步骤 ${index + 1}`)
        await step.getByRole('textbox', { name: '子任务目标', exact: true }).fill('产生实际交付')
        await step
          .getByRole('textbox', { name: '子任务验收条件', exact: true })
          .fill('人工检查文件')
        await step.getByRole('checkbox').check()
      }
      await page.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'TEAM_DEPENDENCY_CYCLE' }).waitFor()
      assert.equal(
        (await snapshot(page)).tasks.filter((task) => task.purpose === 'team_parent').length,
        0,
      )
      await page.locator('.plan-step').nth(0).getByRole('checkbox').uncheck()
      await page.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await page.getByRole('heading', { name: '依赖计划', exact: true }).waitFor()
      await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'ROLE_NOT_READY' }).waitFor()
      assert.equal((await snapshot(page)).runs.length, 0)
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('button', { name: 'Models, requirements & teams', exact: true }).click()
      await page
        .getByRole('heading', { name: 'Models, requirements & teams', exact: true })
        .waitFor()
      await page.getByRole('combobox', { name: 'Edit requirement', exact: true }).waitFor()
      assert.deepEqual(pageErrors, [])
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
