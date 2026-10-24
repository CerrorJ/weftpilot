import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { openRoleEditor, goRoleStep, roleDialog } from './role-helpers'

test(
  '六步真实配置：技能市场往返保留、下一步不提交、确切保存后待试运行、返回修改新增版本',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await openRoleEditor(page)
      await page.getByLabel('角色名称', { exact: true }).fill('六步配置角色')
      await page.getByLabel('角色标识', { exact: true }).fill('wizard-test-role')
      await page.getByLabel('职责', { exact: true }).fill('完成已确认的需求。')
      await page.getByLabel('输入要求', { exact: true }).fill('明确输入')
      await page.getByLabel('交付要求', { exact: true }).fill('可追踪交付')
      await goRoleStep(page, 1)
      await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption('claude')
      const environment = roleDialog(page).getByRole('region', { name: 'CLI分项检查', exact: true })
      await environment.getByRole('button', { name: '读取版本', exact: true }).click()
      // CI可没有CLI：检查结果有时间即可，不能将“不可用”冒充成功，也不能以版本读取启用角色。
      await environment.locator('time').waitFor()
      await environment.getByText('尚未验证；保存后在最后一步真实试运行', { exact: true }).waitFor()
      await goRoleStep(page, 2)
      await page.getByRole('button', { name: '去技能市场', exact: true }).click()
      await page.getByRole('heading', { name: '技能中心', exact: true }).waitFor()
      assert.equal((await snapshot(page)).roles.length, 1)
      await page.getByRole('button', { name: '返回角色配置', exact: true }).click()
      await roleDialog(page).locator('[data-role-step="2"]').waitFor({ state: 'visible' })
      await goRoleStep(page, 0)
      assert.equal(await page.getByLabel('角色名称', { exact: true }).inputValue(), '六步配置角色')
      assert.equal(await page.getByLabel('输入要求', { exact: true }).inputValue(), '明确输入')
      await goRoleStep(page, 1)
      assert.equal(
        await page.getByRole('combobox', { name: 'CLI', exact: true }).inputValue(),
        'claude',
      )
      await goRoleStep(page, 3)
      await page.getByRole('combobox', { name: '最大并发任务数', exact: true }).selectOption('2')
      await goRoleStep(page, 5)
      // 进入最后一步仍不能产生任何角色版本或Run，必须再显式点击保存。
      assert.equal((await snapshot(page)).roles.length, 1)
      assert.equal((await snapshot(page)).runs.length, 0)
      await page.getByRole('button', { name: '保存角色配置', exact: true }).click()
      const dialog = roleDialog(page)
      await dialog.locator('.role-health').waitFor()
      assert.equal(
        await dialog.getByRole('button', { name: '启用角色', exact: true }).isDisabled(),
        true,
      )
      const original = (await snapshot(page)).roles.find(
        (role) => role.slug === 'wizard-test-role',
      )!
      assert.equal(original.maxConcurrency, 2)
      assert.equal(original.inputRequirements, '明确输入')
      await goRoleStep(page, 0)
      await page.getByLabel('输入要求', { exact: true }).fill('新的明确输入')
      await goRoleStep(page, 5)
      assert.equal((await snapshot(page)).roles.length, 2)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await dialog.locator('.role-health').getByText(/v2/).waitFor()
      const state = await snapshot(page)
      assert.deepEqual(
        state.roles.find((role) => role.id === original.id && role.version === 1),
        original,
      )
      assert.equal(
        state.roles.find((role) => role.id === original.id && role.version === 2)
          ?.inputRequirements,
        '新的明确输入',
      )
      assert.equal(state.runs.length, 0)
      await page.getByRole('button', { name: '关闭配置', exact: true }).click()
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '旧角色表单冲突后保留，关闭重开仍绑定旧版本，不静默覆盖其他渠道的新配置',
  { timeout: 45000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const original = (await snapshot(page)).roles[0]!
      await openRoleEditor(page, original.id)
      await page.getByLabel('角色名称', { exact: true }).fill('保留的旧版本草稿')
      await page.evaluate(
        async (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: 1,
              name: '另一个渠道的新名称',
              responsibility: role.responsibility,
              cli: role.cli,
              model: role.model,
              permission: role.permission,
            },
          }),
        original,
      )
      await goRoleStep(page, 5)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await roleDialog(page).getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      await page.getByRole('button', { name: '保存表单草稿', exact: true }).click()
      await openRoleEditor(page, original.id)
      await goRoleStep(page, 0)
      assert.equal(
        await page.getByLabel('角色名称', { exact: true }).inputValue(),
        '保留的旧版本草稿',
      )
      await goRoleStep(page, 5)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await roleDialog(page).getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      const state = await snapshot(page)
      assert.equal(state.roles.length, 2)
      assert.equal(state.roles.find((role) => role.version === 2)?.name, '另一个渠道的新名称')
      assert.equal(state.runs.length, 0)
      await page.getByRole('button', { name: '放弃表单草稿并读取当前版本', exact: true }).click()
      await roleDialog(page).locator('[data-role-step="0"]').waitFor({ state: 'visible' })
      assert.equal(
        await page.getByLabel('角色名称', { exact: true }).inputValue(),
        '另一个渠道的新名称',
      )
      await page.getByLabel('角色名称', { exact: true }).fill('重新确认后的配置')
      await goRoleStep(page, 5)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await roleDialog(page).locator('.role-health').getByText(/v3/).waitFor()
      const recovered = await snapshot(page)
      assert.equal(recovered.roles.length, 3)
      assert.deepEqual(
        recovered.roles.find((role) => role.version === 2),
        state.roles.find((role) => role.version === 2),
      )
      await page.getByRole('button', { name: '关闭配置', exact: true }).click()
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
