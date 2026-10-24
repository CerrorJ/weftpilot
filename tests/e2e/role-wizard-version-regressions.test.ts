import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { openRoleEditor, goRoleStep, roleDialog, saveRoleEditor } from './role-helpers'

const saveModelVersion = (page: Page, version: number, id?: string) =>
  page.evaluate(
    async ({ version, id }) =>
      window.weftpilot!.workflow.saveModel({
        key: crypto.randomUUID(),
        input: {
          ...(id ? { id } : {}),
          expectedVersion: version - 1,
          name: '固定历史模型',
          cli: 'codex',
          provider: 'cli-managed',
          model: `test-model-v${version}`,
          baseUrl: '',
          credentialRef: null,
          reasoningEffort: '',
        },
      }),
    { version, id },
  )

test(
  '草稿固定模型v2：外部新增v3、实时重绘及市场返回均不回退CLI账户，保存仍固定v2',
  { timeout: 45000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const original = (await snapshot(page)).roles[0]!
      await saveModelVersion(page, 1)
      const model = (await snapshot(page)).models[0]!
      await saveModelVersion(page, 2, model.id)
      await openRoleEditor(page, original.id)
      await goRoleStep(page, 1)
      const selector = roleDialog(page).getByRole('combobox', { name: '模型配置', exact: true })
      await selector.selectOption(`${model.id}@2`)
      await saveModelVersion(page, 3, model.id)
      await selector
        .getByRole('option', { name: '固定历史模型 · v3', exact: true })
        .waitFor({ state: 'attached' })
      assert.equal(await selector.inputValue(), `${model.id}@2`)
      await goRoleStep(page, 2)
      await page.getByRole('button', { name: '去技能市场', exact: true }).click()
      await page.getByRole('button', { name: '返回角色配置', exact: true }).click()
      await goRoleStep(page, 1)
      assert.equal(await selector.inputValue(), `${model.id}@2`)
      await saveRoleEditor(page)
      const state = await snapshot(page)
      assert.equal(
        state.roles.find((role) => role.id === original.id && role.version === 2)
          ?.modelProfileSnapshot?.version,
        2,
      )
      assert.deepEqual(
        state.roles.find((role) => role.id === original.id && role.version === 1),
        original,
      )
      assert.equal(state.runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '缺失固定模型保持原引用并真实拒绝，不静默退回空配置；用户另选后才可保存',
  { timeout: 45000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const original = (await snapshot(page)).roles[0]!
      await saveModelVersion(page, 1)
      const model = (await snapshot(page)).models[0]!
      // 仅设置本轮拥有的未提交表单草稿，不伪造权威角色、Run或执行结果。
      await page.evaluate(
        ({ role, model }) =>
          sessionStorage.setItem(
            `weftpilot.role-draft.${role.id}`,
            JSON.stringify({
              name: role.name,
              responsibility: role.responsibility,
              cli: role.cli,
              model: '',
              profile: `${model.id}@99`,
              permission: role.permission,
              skills: [],
              slug: role.slug,
              inputRequirements: '',
              deliveryRequirements: '',
              maxConcurrency: 1,
              step: 1,
              baseVersion: role.version,
            }),
          ),
        { role: original, model },
      )
      await openRoleEditor(page, original.id)
      const selector = roleDialog(page).getByRole('combobox', { name: '模型配置', exact: true })
      assert.equal(await selector.inputValue(), `${model.id}@99`)
      await selector
        .getByRole('option', { name: '固定模型版本不可用，请重新选择', exact: true })
        .waitFor({ state: 'attached' })
      await goRoleStep(page, 5)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await roleDialog(page).getByRole('alert').filter({ hasText: 'NOT_FOUND' }).waitFor()
      assert.deepEqual((await snapshot(page)).roles, [original])
      await goRoleStep(page, 1)
      await selector.selectOption('')
      await saveRoleEditor(page)
      assert.equal((await snapshot(page)).roles.length, 2)
      assert.equal((await snapshot(page)).runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '新建保存后身份统一：返回修改、外部更新冲突、显式重载和市场返回始终是同一角色',
  { timeout: 45000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await openRoleEditor(page)
      await page.getByLabel('角色名称', { exact: true }).fill('新建身份验证')
      await page.getByLabel('角色标识', { exact: true }).fill('new-identity-role')
      await page.getByLabel('职责', { exact: true }).fill('保留同一逻辑角色。')
      await goRoleStep(page, 5)
      await page.getByRole('button', { name: '保存角色配置', exact: true }).click()
      await roleDialog(page).locator('.role-health').waitFor()
      const original = (await snapshot(page)).roles.find(
        (role) => role.slug === 'new-identity-role',
      )!
      await goRoleStep(page, 0)
      await page.getByLabel('角色名称', { exact: true }).fill('保存后旧草稿')
      await page.evaluate(
        async (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: 1,
              name: '外部新建角色v2',
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
      const before = await snapshot(page)
      await page.getByRole('button', { name: '放弃表单草稿并读取当前版本', exact: true }).click()
      await roleDialog(page).locator('[data-role-step="0"]').waitFor({ state: 'visible' })
      assert.equal(
        await page.getByLabel('角色名称', { exact: true }).inputValue(),
        '外部新建角色v2',
      )
      assert.deepEqual((await snapshot(page)).roles, before.roles)
      await page.getByLabel('角色名称', { exact: true }).fill('市场返回保留名称')
      await goRoleStep(page, 2)
      await page.getByRole('button', { name: '去技能市场', exact: true }).click()
      await page.getByRole('button', { name: '返回角色配置', exact: true }).click()
      await roleDialog(page).locator('[data-role-step="2"]').waitFor({ state: 'visible' })
      await goRoleStep(page, 0)
      assert.equal(
        await page.getByLabel('角色名称', { exact: true }).inputValue(),
        '市场返回保留名称',
      )
      await saveRoleEditor(page)
      const state = await snapshot(page)
      assert.equal(new Set(state.roles.map((role) => role.id)).size, 2)
      assert.equal(state.roles.filter((role) => role.id === original.id).length, 3)
      assert.deepEqual(
        state.roles.find((role) => role.id === original.id && role.version === 1),
        original,
      )
      assert.deepEqual(
        state.roles.find((role) => role.id === original.id && role.version === 2),
        before.roles.find((role) => role.id === original.id && role.version === 2),
      )
      assert.equal(state.runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test('明确切换CLI后关闭重开，草稿不带回旧引擎的模型引用', { timeout: 45000 }, async () => {
  const fixture = await createFixture()
  const application = await launch(fixture.data)
  try {
    const page = await configure(application, fixture.repository)
    const original = (await snapshot(page)).roles[0]!
    await saveModelVersion(page, 1)
    const model = (await snapshot(page)).models[0]!
    await openRoleEditor(page, original.id)
    await goRoleStep(page, 1)
    await page
      .getByRole('combobox', { name: '模型配置', exact: true })
      .selectOption(`${model.id}@1`)
    await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption('claude')
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await openRoleEditor(page, original.id)
    assert.equal(
      await page.getByRole('combobox', { name: 'CLI', exact: true }).inputValue(),
      'claude',
    )
    assert.equal(
      await page.getByRole('combobox', { name: '模型配置', exact: true }).inputValue(),
      '',
    )
    assert.deepEqual((await snapshot(page)).roles, [original])
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await quit(application)
  } finally {
    await application.close().catch(() => undefined)
    await fixture.cleanup()
  }
})
