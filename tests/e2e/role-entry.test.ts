import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { openRoleEditor, roleDialog } from './role-helpers'

test(
  '原型角色入口：直接点确切卡片编辑，取消和Esc还来源，多角色选择及新建不写版本',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const first = (await snapshot(page)).roles[0]!
      const second = await page.evaluate(async () => {
        const response = await window.weftpilot!.workflow.saveRole({
          key: crypto.randomUUID(),
          input: {
            expectedVersion: 0,
            name: '第二入口角色',
            slug: 'second-entry',
            responsibility: '独立角色入口测试',
            cli: 'claude',
            model: '',
            permission: 'read-only',
          },
        })
        if (!response || typeof response !== 'object' || !('id' in response))
          throw new Error('INVALID_ROLE_RECEIPT')
        return String(response.id)
      })
      const before = await snapshot(page)
      assert.equal(
        await page.getByRole('combobox', { name: /^(编辑角色|Edit role)$/, exact: true }).count(),
        0,
      )
      await openRoleEditor(page, second)
      assert.equal(
        await roleDialog(page).getByRole('textbox', { name: '角色名称', exact: true }).inputValue(),
        '第二入口角色',
      )
      await roleDialog(page).getByRole('button', { name: '取消', exact: true }).last().click()
      assert.equal(
        await page
          .locator(`[data-role-id="${second}"] .role-card-main`)
          .evaluate((element) => element === document.activeElement),
        true,
      )
      await openRoleEditor(page, first.id)
      assert.equal(
        await roleDialog(page).getByRole('textbox', { name: '角色名称', exact: true }).inputValue(),
        first.name,
      )
      await page.keyboard.press('Escape')
      assert.equal(
        await page
          .locator(`[data-role-id="${first.id}"] .role-card-main`)
          .evaluate((element) => element === document.activeElement),
        true,
      )
      await openRoleEditor(page)
      assert.equal(
        await roleDialog(page).getByRole('textbox', { name: '角色名称', exact: true }).inputValue(),
        '',
      )
      await page.keyboard.press('Escape')
      assert.equal(
        await page
          .getByRole('button', { name: '创建角色', exact: true })
          .evaluate((element) => element === document.activeElement),
        true,
      )
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
