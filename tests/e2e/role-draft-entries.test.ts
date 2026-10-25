import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import {
  openRoleEditor,
  roleDialog,
  goRoleStep,
  resumeRoleDraft,
  saveRoleEditor,
} from './role-helpers'

test(
  '原型继续草稿与新建并存：多份表单不覆盖，失败/市场/重载保留，保存只消费确切草稿',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const before = await snapshot(page)
      await openRoleEditor(page)
      await page.getByLabel('角色名称', { exact: true }).fill('草稿 A')
      await page.getByLabel('角色标识', { exact: true }).fill(before.roles[0]!.slug!)
      await page.getByLabel('职责', { exact: true }).fill('独立 A 职责')
      await goRoleStep(page, 1)
      await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption('claude')
      await goRoleStep(page, 2)
      await page.getByRole('button', { name: '去技能市场', exact: true }).click()
      await page.getByRole('button', { name: '返回角色配置', exact: true }).click()
      await roleDialog(page).locator('[data-role-step="2"]').waitFor({ state: 'visible' })
      await page.getByRole('button', { name: '保存表单草稿', exact: true }).click()
      await resumeRoleDraft(page)
      await roleDialog(page).locator('[data-role-step="2"]').waitFor({ state: 'visible' })
      await page.keyboard.press('Escape')
      await openRoleEditor(page)
      assert.equal(await page.getByLabel('角色名称', { exact: true }).inputValue(), '')
      await page.getByLabel('角色名称', { exact: true }).fill('草稿 B')
      await page.getByLabel('职责', { exact: true }).fill('独立 B 职责')
      await page.getByRole('button', { name: '保存表单草稿', exact: true }).click()
      await resumeRoleDraft(page, '草稿 A')
      await goRoleStep(page, 0)
      assert.equal(await page.getByLabel('角色名称', { exact: true }).inputValue(), '草稿 A')
      assert.equal(await page.getByLabel('职责', { exact: true }).inputValue(), '独立 A 职责')
      await goRoleStep(page, 5)
      await page.getByRole('button', { name: '保存角色配置', exact: true }).click()
      await roleDialog(page)
        .getByRole('alert')
        .filter({ hasText: 'ROLE_IDENTIFIER_TAKEN' })
        .waitFor()
      assert.deepEqual(await snapshot(page), before)
      await page.keyboard.press('Escape')
      await page.reload()
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      await resumeRoleDraft(page, '草稿 A')
      await goRoleStep(page, 0)
      assert.equal(await page.getByLabel('职责', { exact: true }).inputValue(), '独立 A 职责')
      await page.getByLabel('角色标识', { exact: true }).fill('independent-draft-a')
      await goRoleStep(page, 1)
      assert.equal(
        await page.getByRole('combobox', { name: 'CLI', exact: true }).inputValue(),
        'claude',
      )
      await saveRoleEditor(page)
      await page.waitForFunction(() => document.activeElement?.textContent === '继续角色草稿')
      await resumeRoleDraft(page)
      assert.equal(await page.getByLabel('角色名称', { exact: true }).inputValue(), '草稿 B')
      await saveRoleEditor(page)
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains('role-create-action'),
      )
      const after = await snapshot(page)
      assert.equal(after.roles.length, 3)
      assert.equal(new Set(after.roles.map((role) => role.id)).size, 3)
      assert.deepEqual(
        after.roles.find((role) => role.id === before.roles[0]!.id),
        before.roles[0],
      )
      assert.equal(after.runs.length, 0)
      assert.equal(await page.getByRole('button', { name: '继续角色草稿', exact: true }).count(), 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '旧new草稿不被新建删除，编辑草稿继续绑定旧版本；英文深色选择及取消返回',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const source = (await snapshot(page)).roles[0]!
      // 只设置旧版本本地表单格式；没有构造权威Role/Run或模拟成功回执。
      await page.evaluate(() =>
        sessionStorage.setItem(
          'weftpilot.role-draft.new',
          JSON.stringify({
            name: '原有旧new草稿',
            responsibility: '保留原有内容',
            cli: 'codex',
            profile: '',
            model: '',
            permission: 'read-only',
            skills: [],
            slug: 'legacy-new-draft',
            step: 0,
            baseVersion: 0,
          }),
        ),
      )
      const legacy = await page.evaluate(() => sessionStorage.getItem('weftpilot.role-draft.new'))
      await openRoleEditor(page)
      assert.equal(await page.getByLabel('角色名称', { exact: true }).inputValue(), '')
      await page.keyboard.press('Escape')
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem('weftpilot.role-draft.new')),
        legacy,
      )
      await resumeRoleDraft(page)
      assert.equal(await page.getByLabel('角色名称', { exact: true }).inputValue(), '原有旧new草稿')
      await page.keyboard.press('Escape')
      await openRoleEditor(page, source.id)
      await page.getByLabel('角色名称', { exact: true }).fill('保留的v1编辑草稿')
      await page.getByRole('button', { name: '保存表单草稿', exact: true }).click()
      await page.evaluate(
        async (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: 1,
              name: '外部正式v2',
              responsibility: role.responsibility,
              cli: role.cli,
              model: role.model,
              permission: role.permission,
            },
          }),
        source,
      )
      const before = await snapshot(page)
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 900 })
      await resumeRoleDraft(page, '保留的v1编辑草稿')
      assert.equal(
        await page.getByLabel('Role name', { exact: true }).inputValue(),
        '保留的v1编辑草稿',
      )
      assert.match(await roleDialog(page).locator('.role-draft-status').innerText(), /v?1/)
      await goRoleStep(page, 5)
      await roleDialog(page).getByRole('button', { name: 'Save new version', exact: true }).click()
      await roleDialog(page).getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      assert.deepEqual(await snapshot(page), before)
      await page.keyboard.press('Escape')
      assert.equal(
        await page
          .getByRole('button', { name: 'Continue role draft', exact: true })
          .evaluate((element) => element === document.activeElement),
        true,
      )
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem('weftpilot.role-draft.new')),
        legacy,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
