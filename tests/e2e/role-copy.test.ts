import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prepareDeliveryFixture } from './delivery-fixture'
import { launch, snapshot, quit, createFixture, configure } from './workflow-helpers'
import {
  waitRoleCard,
  openRoleManagement,
  closeRoleManagement,
  activateSavedRole,
} from './role-helpers'
test(
  '真实Codex：已启用来源的副本必须完成自己的试运行，不继承来源证明',
  { timeout: 300000, skip: process.env.WEFTPILOT_REAL_ROLE_COPY !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      const before = await snapshot(page)
      const source = before.roles[0]!
      const sourceReadiness = before.roleReadiness.find((role) => role.roleId === source.id)!
      assert.equal(sourceReadiness.enabled, true)
      assert.equal(before.runs.length, 1)
      await page
        .locator(`[data-role-id="${source.id}"]`)
        .getByRole('button', { name: '复制配置', exact: true })
        .click()
      const dialog = page.getByRole('dialog', { name: '复制角色配置', exact: true })
      await dialog.getByRole('textbox', { name: '副本名称', exact: true }).fill('真实复制执行验证')
      await dialog.getByRole('textbox', { name: '副本标识', exact: true }).fill('real-copy-trial')
      await dialog.getByRole('button', { name: '复制为未启用角色', exact: true }).click()
      await dialog.waitFor({ state: 'hidden' })
      await waitRoleCard(page, '真实复制执行验证', 1)
      const copiedState = await snapshot(page)
      const copied = copiedState.roles.find((role) => role.slug === 'real-copy-trial')!
      const copiedReadiness = copiedState.roleReadiness.find((role) => role.roleId === copied.id)!
      assert.equal(copiedReadiness.enabled, false)
      assert.equal(copiedReadiness.latestTrialRunId, null)
      assert.deepEqual(copiedState.runs, before.runs)
      await activateSavedRole(page, copied.id)
      const after = await snapshot(page)
      const ready = after.roleReadiness.find((role) => role.roleId === copied.id)!
      assert.equal(ready.enabled, true)
      assert.equal(after.roles.length, 2)
      assert.equal(after.runs.length, 2)
      const ownTrial = after.runs.find((run) => run.id === ready.latestTrialRunId)!
      assert.equal(ownTrial.roleSnapshot.id, copied.id)
      assert.equal(ownTrial.roleSnapshot.version, 1)
      assert.notEqual(ownTrial.id, sourceReadiness.latestTrialRunId)
      assert.notEqual(ownTrial.workDirectory, before.runs[0]!.workDirectory)
      for (const run of after.runs) {
        assert.equal(run.purpose, 'role_trial')
        assert.equal(run.status, 'succeeded')
        assert.equal(run.processState, 'confirmed_ended')
      }
      assert.deepEqual(
        after.runs.find((run) => run.id === before.runs[0]!.id),
        before.runs[0],
      )
      assert.deepEqual(
        after.roles.find((role) => role.id === source.id),
        source,
      )
      assert.deepEqual(
        after.roleReadiness.find((role) => role.roleId === source.id),
        sourceReadiness,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
test(
  '受控历史夹具+真实复制：唯一标识拒绝保留，双提交仅一个未启用副本，原Run不变并重启保留',
  { timeout: 90000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      const before = await snapshot(page)
      const source = before.roles.find((role) => role.id === fixture.roleId)!
      await page
        .locator(`[data-role-id="${source.id}"]`)
        .getByRole('button', { name: '复制配置', exact: true })
        .click()
      const dialog = page.getByRole('dialog', { name: '复制角色配置', exact: true })
      await dialog.getByRole('textbox', { name: '副本名称', exact: true }).fill('独立配置副本')
      await dialog.getByRole('textbox', { name: '副本标识', exact: true }).fill(source.slug!)
      await dialog.getByRole('button', { name: '复制为未启用角色', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: 'ROLE_IDENTIFIER_TAKEN' }).waitFor()
      assert.equal(
        await dialog.getByRole('textbox', { name: '副本名称', exact: true }).inputValue(),
        '独立配置副本',
      )
      assert.deepEqual(await snapshot(page), before)
      await dialog
        .getByRole('textbox', { name: '副本标识', exact: true })
        .fill('independent-ui-copy')
      // 两次原生表单提交走真实事件及IPC；pending守卫不能只依赖下一次React重绘。
      await dialog.locator('form').evaluate((element) => {
        const form = element as HTMLFormElement
        form.requestSubmit()
        form.requestSubmit()
      })
      await dialog.waitFor({ state: 'hidden' })
      await waitRoleCard(page, '独立配置副本', 1)
      const after = await snapshot(page)
      const copied = after.roles.find((role) => role.name === '独立配置副本')!
      assert.equal(after.roles.length, before.roles.length + 1)
      assert.notEqual(copied.id, source.id)
      assert.equal(copied.feishuBinding, null)
      assert.deepEqual(
        {
          ...copied,
          id: source.id,
          name: source.name,
          slug: source.slug,
          createdAt: source.createdAt,
        },
        { ...source, feishuBinding: null },
      )
      assert.deepEqual(after.runs, before.runs)
      assert.deepEqual(after.tasks, before.tasks)
      assert.deepEqual(after.deliveries, before.deliveries)
      assert.deepEqual(
        after.roles.find((role) => role.id === source.id),
        source,
      )
      const readiness = after.roleReadiness.find((role) => role.roleId === copied.id)!
      assert.equal(readiness.enabled, false)
      assert.equal(readiness.state, 'draft')
      assert.equal(readiness.latestTrialRunId, null)
      await page.waitForFunction(
        (id) => document.activeElement?.closest('.role-card')?.getAttribute('data-role-id') === id,
        copied.id,
      )
      const management = await openRoleManagement(page, copied.id)
      assert.equal(
        await management.getByRole('button', { name: '启用角色', exact: true }).isDisabled(),
        true,
      )
      await closeRoleManagement(page)
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      await waitRoleCard(page, '独立配置副本', 1)
      const restored = await snapshot(page)
      assert.deepEqual(restored.roles, after.roles)
      assert.deepEqual(restored.runs, before.runs)
      assert.equal(restored.roleReadiness.find((role) => role.roleId === copied.id)?.enabled, false)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '英文复制冻结源版本：外部改版明确拒绝、输入保留、取消回源，额外启用字段被命名IPC拒绝',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const source = (await snapshot(page)).roles[0]!
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      const card = page.locator(`[data-role-id="${source.id}"]`)
      await card.getByRole('button', { name: 'Copy configuration', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Copy role configuration', exact: true })
      await dialog.getByRole('textbox', { name: 'Copy name', exact: true }).fill('保留的副本输入')
      await dialog
        .getByRole('textbox', { name: 'Copy identifier', exact: true })
        .fill('stale-source-copy')
      await page.evaluate(
        (id) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id,
              expectedVersion: 1,
              name: '外部新版来源',
              responsibility: '保持新版',
              cli: 'codex',
              model: '',
              permission: 'read-only',
            },
          }),
        source.id,
      )
      const before = await snapshot(page)
      await dialog.getByRole('button', { name: 'Create disabled copy', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      assert.equal(
        await dialog.getByRole('textbox', { name: 'Copy name', exact: true }).inputValue(),
        '保留的副本输入',
      )
      assert.equal(
        await dialog.getByRole('textbox', { name: 'Copy identifier', exact: true }).inputValue(),
        'stale-source-copy',
      )
      assert.deepEqual(await snapshot(page), before)
      await page.keyboard.press('Escape')
      assert.equal(
        await card
          .getByRole('button', { name: 'Copy configuration', exact: true })
          .evaluate((element) => element === document.activeElement),
        true,
      )
      const rejected = await page.evaluate(async (id) => {
        try {
          await Reflect.apply(window.weftpilot!.workflow.copyRole, null, [
            {
              key: crypto.randomUUID(),
              input: {
                sourceRoleId: id,
                expectedSourceVersion: 2,
                name: 'invalid',
                slug: 'injected-copy',
                enabled: true,
              },
            },
          ])
          return 'UNEXPECTED_SUCCESS'
        } catch (error) {
          return String(error)
        }
      }, source.id)
      assert.match(rejected, /INPUT_INVALID/)
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
