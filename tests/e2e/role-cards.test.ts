import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createFixture,
  launch,
  quit,
  configure,
  snapshot,
  waitForSnapshot,
} from './workflow-helpers'
import { openRoleManagement, closeRoleManagement, roleDialog } from './role-helpers'
import { prepareDeliveryFixture } from './delivery-fixture'

test(
  '受控角色夹具+真实卡片：编辑不写版本，停用后凭本版本证明重新启用，旧管理面板不采用新配置',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    const application = await launch(fixture.data)
    try {
      const page = await application.firstWindow()
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      const card = page.locator(`[data-role-id="${fixture.roleId}"]`)
      await card.getByRole('button', { name: '编辑角色配置 · 固定历史角色', exact: true }).click()
      await roleDialog(page).getByRole('textbox', { name: '角色名称', exact: true }).waitFor()
      await roleDialog(page).getByRole('button', { name: '取消', exact: true }).last().click()
      const before = await snapshot(page)
      const management = await openRoleManagement(page, fixture.roleId)
      await management.getByRole('button', { name: '停用角色', exact: true }).click()
      await management
        .getByRole('button', { name: '启用角色', exact: true })
        .and(page.locator(':enabled'))
        .click()
      await management.getByRole('button', { name: '停用角色', exact: true }).waitFor()
      let state = await snapshot(page)
      assert.deepEqual(state.runs, before.runs)
      assert.deepEqual(state.roles, before.roles)
      assert.equal(
        state.roleReadiness.find((item) => item.roleId === fixture.roleId)?.enabled,
        true,
      )
      await management
        .locator('.role-trial-history')
        .getByRole('button', { name: /执行成功/ })
        .click()
      const trial = page.getByRole('dialog', { name: '执行记录快照', exact: true })
      assert.equal(
        await trial.getByRole('button', { name: '检查交付与验收', exact: true }).count(),
        0,
      )
      assert.equal(
        await trial.getByRole('button', { name: '查看交付与验收', exact: true }).count(),
        0,
      )
      await page.keyboard.press('Escape')
      await trial.waitFor({ state: 'hidden' })
      assert.equal(await management.isVisible(), true)
      await page.evaluate(
        (id) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id,
              expectedVersion: 1,
              name: '卡片新版本',
              responsibility: '新职责',
              cli: 'codex',
              model: '',
              permission: 'read-only',
            },
          }),
        fixture.roleId,
      )
      await management.getByRole('status').filter({ hasText: '此配置已有新版本' }).waitFor()
      assert.equal(
        await management.getByRole('button', { name: '启用角色', exact: true }).count(),
        0,
      )
      await closeRoleManagement(page)
      const current = await openRoleManagement(page, fixture.roleId)
      assert.equal(
        await current.getByRole('button', { name: '启用角色', exact: true }).isDisabled(),
        true,
      )
      await closeRoleManagement(page)
      state = await snapshot(page)
      assert.deepEqual(state.runs, before.runs)
      assert.equal(state.roles.filter((role) => role.id === fixture.roleId).length, 2)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实Codex角色卡片：旧版本在途试运行可查，新版本需另试运行，停用再启用不新增Run或配置',
  { timeout: 240000, skip: process.env.WEFTPILOT_REAL_ROLE_CARDS !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const role = (await snapshot(page)).roles[0]!
      let management = await openRoleManagement(page, role.id)
      await management.getByRole('button', { name: '真实试运行', exact: true }).click()
      const started = await waitForSnapshot({
        page,
        timeout: 15000,
        predicate: (state) =>
          state.runs.some(
            (run) => run.purpose === 'role_trial' && run.processState !== 'confirmed_ended',
          ),
      })
      const first = started.runs.find((run) => run.purpose === 'role_trial')!
      await page.evaluate(
        (id) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id,
              expectedVersion: 1,
              name: '真实卡片v2',
              responsibility: '仅限当前隔离目录，完成随机挑战后结束。',
              cli: 'codex',
              model: '',
              permission: 'workspace-write',
            },
          }),
        role.id,
      )
      await closeRoleManagement(page)
      await page
        .locator(`[data-role-id="${role.id}"]`)
        .getByRole('button', { name: '编辑角色配置 · 真实卡片v2', exact: true })
        .waitFor()
      management = await openRoleManagement(page, role.id)
      assert.equal(
        await management.getByRole('button', { name: '真实试运行', exact: true }).isDisabled(),
        true,
      )
      await management
        .locator('.role-trial-history')
        .getByRole('button', { name: /停止此试运行/ })
        .waitFor()
      let state = await waitForSnapshot({
        page,
        timeout: 90000,
        predicate: (state) =>
          state.runs.find((run) => run.id === first.id)?.processState === 'confirmed_ended',
      })
      assert.equal(state.roleReadiness.find((item) => item.roleId === role.id)?.enabled, false)
      assert.equal(state.roleReadiness.find((item) => item.roleId === role.id)?.roleVersion, 2)
      assert.equal(state.roleReadiness.find((item) => item.roleId === role.id)?.state, 'draft')
      await management
        .getByRole('button', { name: '真实试运行', exact: true })
        .and(page.locator(':enabled'))
        .click()
      await management
        .getByRole('button', { name: '启用角色', exact: true })
        .and(page.locator(':enabled'))
        .click({ timeout: 120000 })
      await management.getByRole('button', { name: '停用角色', exact: true }).click()
      await management
        .getByRole('button', { name: '启用角色', exact: true })
        .and(page.locator(':enabled'))
        .click()
      await management.getByRole('button', { name: '停用角色', exact: true }).waitFor()
      state = await snapshot(page)
      assert.equal(state.runs.length, 2)
      assert.ok(
        state.runs.every(
          (run) => run.processState === 'confirmed_ended' && run.status === 'succeeded',
        ),
      )
      assert.equal(state.runs.find((run) => run.id === first.id)?.roleSnapshot.version, 1)
      assert.equal(state.roles.length, 2)
      assert.equal(state.roleReadiness.find((item) => item.roleId === role.id)?.enabled, true)
      await closeRoleManagement(page)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
