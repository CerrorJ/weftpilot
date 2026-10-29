import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
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
import { openRoleEditor, goRoleStep, roleDialog } from './role-helpers'
import { holdRoleReceipt, releaseRoleReceipt, waitRoleReceipt } from './role-feishu-receipts'

const fillChannel = async (page: Page, secret: string) => {
  const dialog = roleDialog(page)
  await dialog.getByRole('radio', { name: '关联已有应用', exact: true }).check()
  await dialog.getByLabel('App ID', { exact: true }).fill('cli_0123456789abcdef')
  await dialog.getByLabel('租户 Tenant Key', { exact: true }).fill('synthetic-tenant')
  await dialog.getByLabel('所有者 Open ID', { exact: true }).fill('ou_synthetic_owner')
  await dialog.getByLabel('通知会话 Chat ID', { exact: true }).fill('oc_synthetic_chat')
  await dialog.getByLabel('App Secret', { exact: true }).fill(secret)
}

const saveVersion = async (page: Page, version: number) => {
  await goRoleStep(page, 5)
  const dialog = roleDialog(page)
  await dialog.getByRole('button', { name: /^(保存角色配置|保存新版本)$/, exact: true }).click()
  await dialog
    .locator('.role-health')
    .getByText(new RegExp(` · v${version} · `))
    .waitFor()
}

test(
  '角色飞书真实宿主保存：三种入口、草稿不存密钥、系统密文、重启和中英明暗；不连接合成应用',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    const secret = `synthetic-role-feishu-${randomUUID()}`
    try {
      let page = await configure(application, fixture.repository)
      await openRoleEditor(page)
      await page.getByLabel('角色名称', { exact: true }).fill('渠道角色')
      await page.getByLabel('角色标识', { exact: true }).fill('role-channel-ui')
      await page.getByLabel('职责', { exact: true }).fill('验证角色专属渠道；不连接真实租户。')
      await goRoleStep(page, 4)
      await roleDialog(page).getByRole('radio', { name: '新建飞书机器人', exact: true }).check()
      await roleDialog(page)
        .getByText('当前提供控制台辅助创建；不会自动复制现有机器人或读取其密钥。', { exact: true })
        .waitFor()
      await fillChannel(page, secret)
      const drafts = await page.evaluate(() =>
        Object.keys(sessionStorage)
          .filter((key) => key.startsWith('weftpilot.role-draft.'))
          .map((key) => sessionStorage.getItem(key))
          .join('\n'),
      )
      assert.equal(drafts.includes(secret), false)
      assert.equal(drafts.includes('credentialRef'), false)
      await goRoleStep(page, 2)
      await roleDialog(page).getByRole('button', { name: '去技能市场', exact: true }).click()
      await page.getByRole('button', { name: '返回角色配置', exact: true }).click()
      await goRoleStep(page, 4)
      assert.equal(
        await roleDialog(page).getByLabel('App ID', { exact: true }).inputValue(),
        'cli_0123456789abcdef',
      )
      assert.equal(
        await roleDialog(page).getByLabel('App Secret', { exact: true }).inputValue(),
        '',
      )
      await roleDialog(page).getByLabel('App Secret', { exact: true }).fill(secret)
      await saveVersion(page, 1)
      const state = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (value) => value.roles.some((role) => role.slug === 'role-channel-ui'),
      })
      const role = state.roles.find((item) => item.slug === 'role-channel-ui')!
      assert.ok(role.feishuBinding)
      assert.equal(role.feishuBinding.appId, 'cli_0123456789abcdef')
      assert.equal(JSON.stringify(state).includes(secret), false)
      assert.equal(state.runs.length, 0)
      await roleDialog(page)
        .locator('.role-channel-status')
        .getByText('未连接', { exact: true })
        .waitFor()
      const status = await page.evaluate(
        (roleId) => window.weftpilot!.workflow.roleFeishuStatus({ roleId }),
        role.id,
      )
      assert.deepEqual(status, { roleId: role.id, roleVersion: 1, connections: [] })
      assert.equal(
        (
          await readFile(
            join(fixture.data, 'credentials/feishu', `${role.feishuBinding.credentialRef}.bin`),
          )
        ).includes(Buffer.from(secret)),
        false,
      )
      await goRoleStep(page, 4)
      assert.equal(
        await roleDialog(page).getByLabel('App Secret', { exact: true }).inputValue(),
        '',
      )
      await page.setViewportSize({ width: 1124, height: 900 })
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/role-feishu-zh-light.png' })
      await roleDialog(page).getByRole('button', { name: '保存表单草稿', exact: true }).click()
      await page
        .locator(`[data-role-id="${role.id}"]`)
        .getByText('飞书绑定已配置', { exact: true })
        .waitFor()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page
        .locator(`[data-role-id="${role.id}"]`)
        .getByText('Feishu binding configured', { exact: true })
        .waitFor()
      await openRoleEditor(page, role.id)
      await goRoleStep(page, 4)
      await page.setViewportSize({ width: 700, height: 860 })
      await roleDialog(page)
        .getByRole('radio', { name: 'Link an existing app', exact: true })
        .waitFor()
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/role-feishu-en-dark-700.png' })
      await page.keyboard.press('Escape')
      await page.locator('dialog:has(.role-wizard)').waitFor({ state: 'detached' })
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.locator('html[data-theme="dark"]').waitFor()
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      assert.deepEqual(
        (await snapshot(page)).roles.find((item) => item.id === role.id),
        role,
      )
      assert.deepEqual(
        await page.evaluate(
          (roleId) => window.weftpilot!.workflow.roleFeishuStatus({ roleId }),
          role.id,
        ),
        status,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '角色渠道CAS保稿、重新载入后显式绑定/null清除、复制不继承授权及旧版本不变',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    const secret = `synthetic-cas-${randomUUID()}`
    try {
      const page = await configure(application, fixture.repository)
      const legacyId = await page.evaluate(async () => {
        const result = await window.weftpilot!.workflow.saveRole({
          key: crypto.randomUUID(),
          input: {
            expectedVersion: 0,
            name: '旧渠道兼容角色',
            responsibility: '旧客户端省略渠道字段',
            cli: 'codex',
            model: '',
            permission: 'read-only',
          },
        })
        return (result as { id: string }).id
      })
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.roles.some((role) => role.id === legacyId),
      })
      const original = (await snapshot(page)).roles.find((role) => role.id === legacyId)!
      await openRoleEditor(page, original.id)
      await goRoleStep(page, 4)
      await roleDialog(page)
        .getByRole('radio', { name: '保留旧工作空间渠道', exact: true })
        .waitFor()
      await fillChannel(page, secret)
      await page.evaluate(
        (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: role.version,
              name: '其他渠道更新',
              responsibility: role.responsibility,
              cli: role.cli,
              model: role.model,
              permission: role.permission,
            },
          }),
        original,
      )
      await goRoleStep(page, 5)
      await roleDialog(page).getByRole('button', { name: '保存新版本', exact: true }).click()
      await roleDialog(page).getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      await goRoleStep(page, 4)
      assert.equal(
        await roleDialog(page).getByLabel('App Secret', { exact: true }).inputValue(),
        secret,
      )
      assert.deepEqual(
        (await snapshot(page)).roles.find((role) => role.id === original.id && role.version === 1),
        original,
      )
      await roleDialog(page)
        .getByRole('button', { name: '放弃表单草稿并读取当前版本', exact: true })
        .click()
      await goRoleStep(page, 4)
      assert.equal(
        await roleDialog(page).getByLabel('App Secret', { exact: true }).inputValue(),
        '',
      )
      await fillChannel(page, secret)
      await saveVersion(page, 3)
      const bound = (await snapshot(page)).roles.find(
        (role) => role.id === original.id && role.version === 3,
      )!
      assert.ok(bound.feishuBinding)
      const copiedId = await page.evaluate(async (role) => {
        const result = await window.weftpilot!.workflow.copyRole({
          key: crypto.randomUUID(),
          input: {
            sourceRoleId: role.id,
            expectedSourceVersion: role.version,
            name: '渠道副本',
            slug: 'role-channel-copy',
          },
        })
        return (result as { id: string }).id
      }, bound)
      assert.equal(
        (await snapshot(page)).roles.find((role) => role.id === copiedId)?.feishuBinding,
        null,
      )
      await goRoleStep(page, 4)
      await roleDialog(page).getByRole('radio', { name: '暂不接入飞书', exact: true }).check()
      await saveVersion(page, 4)
      const after = await snapshot(page)
      assert.equal(
        after.roles.find((role) => role.id === original.id && role.version === 4)?.feishuBinding,
        null,
      )
      assert.deepEqual(
        after.roles.find((role) => role.id === original.id && role.version === 3),
        bound,
      )
      assert.equal(after.runs.length, 0)
      assert.equal(
        after.roleReadiness.some((role) => role.enabled),
        false,
      )
      const result = await page.evaluate(async (roleId) => {
        try {
          await window.weftpilot!.workflow.connectRoleFeishu({ roleId, expectedRoleVersion: 4 })
          return 'unexpected'
        } catch (error) {
          return error instanceof Error ? error.message : 'unknown'
        }
      }, original.id)
      assert.match(result, /FEISHU_NOT_CONFIGURED/)
      await roleDialog(page).getByRole('button', { name: '关闭配置', exact: true }).click()
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '角色保存已提交但回执迟到：明确重载的新草稿不被消费，下一次保存继续同一角色',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const original = (await snapshot(page)).roles[0]!
      await openRoleEditor(page, original.id)
      await goRoleStep(page, 4)
      await fillChannel(page, `synthetic-delayed-${randomUUID()}`)
      await goRoleStep(page, 5)
      await holdRoleReceipt(application, original.id)
      await roleDialog(page).getByRole('button', { name: '保存新版本', exact: true }).click()
      await waitRoleReceipt(application)
      const committed = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.roles.some((role) => role.id === original.id && role.version === 2),
      })
      const second = committed.roles.find((role) => role.id === original.id && role.version === 2)!
      await roleDialog(page)
        .getByRole('button', { name: '放弃表单草稿并读取当前版本', exact: true })
        .click()
      await roleDialog(page).getByLabel('角色名称', { exact: true }).fill('重载后的新草稿')
      const key = `weftpilot.role-draft.${original.id}`
      const draft = await page.evaluate((value) => sessionStorage.getItem(value), key)
      assert.match(draft ?? '', /重载后的新草稿/)
      await releaseRoleReceipt(application)
      await roleDialog(page)
        .getByRole('button', { name: '下一步', exact: true })
        .and(page.locator(':enabled'))
        .waitFor()
      assert.equal(
        await roleDialog(page).getByLabel('角色名称', { exact: true }).inputValue(),
        '重载后的新草稿',
      )
      assert.equal(await page.evaluate((value) => sessionStorage.getItem(value), key), draft)
      await goRoleStep(page, 4)
      assert.equal(
        await roleDialog(page).getByLabel('App Secret', { exact: true }).inputValue(),
        '',
      )
      await fillChannel(page, `synthetic-new-draft-${randomUUID()}`)
      await saveVersion(page, 3)
      const after = await snapshot(page)
      assert.equal(
        after.roles.find((role) => role.id === original.id && role.version === 3)?.name,
        '重载后的新草稿',
      )
      assert.deepEqual(
        after.roles.find((role) => role.id === original.id && role.version === 2),
        second,
      )
      assert.deepEqual(
        after.roles.find((role) => role.id === original.id && role.version === 1),
        original,
      )
      assert.equal(after.runs.length, 0)
      await roleDialog(page).getByRole('button', { name: '关闭配置', exact: true }).click()
      await quit(application)
    } finally {
      await releaseRoleReceipt(application).catch(() => undefined)
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
