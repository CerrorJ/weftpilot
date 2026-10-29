import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'
import { openRoleEditor, goRoleStep, roleDialog, waitRoleCard } from './role-helpers'

const saveVersion = async (page: Page, version: number) => {
  await goRoleStep(page, 5)
  const dialog = roleDialog(page)
  await dialog.getByRole('button', { name: '保存新版本', exact: true }).click()
  await dialog
    .locator('.role-health')
    .getByText(new RegExp(` · v${version} · `))
    .waitFor()
}

test(
  '未启用渠道普通编辑不放行，旧草稿按固定版本补缺省，连接许可须显式切换',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const original = (await snapshot(page)).roles[0]!
      await page.evaluate(
        async (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: role.version,
              name: role.name,
              responsibility: role.responsibility,
              cli: role.cli,
              model: role.model,
              permission: role.permission,
              feishuSecret: `synthetic-disabled-${crypto.randomUUID()}`,
              feishu: {
                appId: 'cli_0123456789abcdef',
                tenantKey: 'synthetic',
                ownerOpenId: 'ou_owner',
                chatId: 'oc_test',
                credentialRef: '',
                enabled: false,
              },
            },
          }),
        original,
      )
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.roles.some((role) => role.id === original.id && role.version === 2),
      })
      await waitRoleCard(page, original.name, 2)
      await openRoleEditor(page, original.id)
      await roleDialog(page).getByLabel('职责', { exact: true }).fill('只改职责，保留渠道许可')
      await saveVersion(page, 3)
      let state = await snapshot(page)
      const disabled = state.roles.find((role) => role.id === original.id && role.version === 3)!
      assert.equal(disabled.feishuBinding?.enabled, false)
      assert.deepEqual(
        disabled.feishuBinding,
        state.roles.find((role) => role.id === original.id && role.version === 2)?.feishuBinding,
      )
      await roleDialog(page).getByRole('button', { name: '关闭配置', exact: true }).click()
      await openRoleEditor(page, original.id)
      await roleDialog(page).getByLabel('角色名称', { exact: true }).fill('旧版本未启用草稿')
      await roleDialog(page).getByRole('button', { name: '保存表单草稿', exact: true }).click()
      // 迁移夹具只删新增公开字段；旧草稿须从自己的v3补false，不能借当前v4的true。
      await page.evaluate((id) => {
        const key = `weftpilot.role-draft.${id}`
        const raw = JSON.parse(sessionStorage.getItem(key)!) as Record<string, unknown>
        delete raw.feishuEnabled
        sessionStorage.setItem(key, JSON.stringify(raw))
      }, original.id)
      await page.evaluate(async (role) => {
        const binding = role.feishuBinding!
        return window.weftpilot!.workflow.saveRole({
          key: crypto.randomUUID(),
          input: {
            id: role.id,
            expectedVersion: role.version,
            name: '其他渠道显式允许连接',
            responsibility: role.responsibility,
            cli: role.cli,
            model: role.model,
            permission: role.permission,
            feishu: {
              appId: binding.appId,
              tenantKey: binding.tenantKey,
              ownerOpenId: binding.ownerOpenId,
              chatId: binding.chatId,
              credentialRef: binding.credentialRef,
              enabled: true,
            },
          },
        })
      }, disabled)
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (value) =>
          value.roles.some((role) => role.id === original.id && role.version === 4),
      })
      await waitRoleCard(page, '其他渠道显式允许连接', 4)
      await openRoleEditor(page, original.id)
      await goRoleStep(page, 4)
      const permit = roleDialog(page).getByRole('checkbox', {
        name: '允许此角色绑定连接飞书',
        exact: true,
      })
      assert.equal(await permit.isChecked(), false)
      await goRoleStep(page, 5)
      await roleDialog(page).getByRole('button', { name: '保存新版本', exact: true }).click()
      await roleDialog(page).getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      await roleDialog(page)
        .getByRole('button', { name: '放弃表单草稿并读取当前版本', exact: true })
        .click()
      await goRoleStep(page, 4)
      assert.equal(await permit.isChecked(), true)
      await permit.uncheck()
      await saveVersion(page, 5)
      assert.equal(
        (await snapshot(page)).roles.find((role) => role.id === original.id && role.version === 5)
          ?.feishuBinding?.enabled,
        false,
      )
      await goRoleStep(page, 4)
      await permit.check()
      await saveVersion(page, 6)
      state = await snapshot(page)
      assert.equal(
        state.roles.find((role) => role.id === original.id && role.version === 6)?.feishuBinding
          ?.enabled,
        true,
      )
      assert.deepEqual(
        state.roles.find((role) => role.id === original.id && role.version === 3),
        disabled,
      )
      assert.equal(state.runs.length, 0)
      assert.equal(
        state.roleReadiness.some((role) => role.enabled),
        false,
      )
      await roleDialog(page).getByRole('button', { name: '关闭配置', exact: true }).click()
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
