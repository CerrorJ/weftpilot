import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, createTask, quit } from './workflow-helpers'
import { navigate, openSettingsPage } from './navigation-helpers'
import { openRoleEditor, saveRoleEditor } from './role-helpers'

test(
  '真实模型设置拒绝可见：输入校验、接口密钥绑定与中英错误；不调用提供方',
  { timeout: 45000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await openSettingsPage(page, 'models')
      await page.getByRole('textbox', { name: '配置名称', exact: true }).fill('   ')
      await page.getByRole('button', { name: '创建模型配置', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'INPUT_INVALID' }).waitFor()
      assert.equal((await snapshot(page)).models.length, 0)
      await page.getByRole('textbox', { name: '配置名称', exact: true }).fill('合成接口绑定')
      await page.getByRole('combobox', { name: '认证方式', exact: true }).selectOption('custom')
      await page
        .getByRole('textbox', { name: '接口地址', exact: true })
        .fill('http://127.0.0.1:9/v1')
      await page.getByLabel('API 密钥', { exact: true }).fill('synthetic-ui-binding-key')
      await page
        .getByRole('textbox', { name: '模型标识（可选）', exact: true })
        .fill('synthetic-model')
      await page.getByRole('button', { name: '创建模型配置', exact: true }).click()
      await page
        .getByRole('option', { name: '合成接口绑定 · v1', exact: true })
        .waitFor({ state: 'attached' })
      const original = (await snapshot(page)).models[0]!
      await page
        .getByRole('combobox', { name: '编辑模型配置', exact: true })
        .selectOption(original.id)
      await page
        .getByRole('textbox', { name: '接口地址', exact: true })
        .fill('http://127.0.0.1:10/v1')
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      const alert = page.getByRole('alert').filter({ hasText: 'MODEL_CREDENTIAL_REQUIRED' })
      await alert.waitFor()
      assert.equal(
        await alert.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return (
            document.activeElement === element && bounds.top >= 0 && bounds.bottom <= innerHeight
          )
        }),
        true,
      )
      assert.equal(
        await page.getByRole('textbox', { name: '接口地址', exact: true }).inputValue(),
        'http://127.0.0.1:10/v1',
      )
      assert.deepEqual((await snapshot(page)).models, [original])
      await page.locator('.topbar .appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      assert.doesNotMatch(await alert.innerText(), /Error invoking|workflow:|too_small/)
      assert.match(await alert.innerText(), /secure credentials/i)
      assert.equal((await snapshot(page)).runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test('真实待执行任务负责人读取最新角色名称，旧版本配置保持原值', { timeout: 45000 }, async () => {
  const fixture = await createFixture()
  const application = await launch(fixture.data)
  try {
    const page = await configure(application, fixture.repository)
    await createTask(page, '只保存任务，不调用CLI。', '负责人版本验证')
    await page.getByRole('button', { name: '关闭详情', exact: true }).click()
    const state = await snapshot(page)
    const original = state.roles[0]!
    const row = page.locator('.task-table tbody tr').filter({ hasText: '负责人版本验证' })
    assert.equal(await row.locator('td').last().innerText(), original.name)
    await navigate(page, '角色管理')
    await openRoleEditor(page, original.id)
    await page.getByRole('textbox', { name: '角色名称', exact: true }).fill('新名称开发者')
    await saveRoleEditor(page)
    await page
      .getByRole('option', { name: '新名称开发者 · v2', exact: true })
      .waitFor({ state: 'attached' })
    await navigate(page, '任务管理')
    await row.locator('td').last().getByText('新名称开发者', { exact: true }).waitFor()
    const after = await snapshot(page)
    assert.deepEqual(
      after.roles.find((role) => role.id === original.id && role.version === 1),
      original,
    )
    assert.equal(after.tasks[0]!.roleId, original.id)
    assert.equal(after.runs.length, 0)
    await quit(application)
  } finally {
    await application.close().catch(() => undefined)
    await fixture.cleanup()
  }
})
