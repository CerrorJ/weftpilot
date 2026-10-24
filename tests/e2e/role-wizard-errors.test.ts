import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { openRoleEditor, goRoleStep, roleDialog } from './role-helpers'

const variants = [
  {
    english: false,
    title: '中文',
    role: '角色名称',
    identifier: '角色标识',
    responsibility: '职责',
    save: '保存角色配置',
    close: '关闭配置',
    message: /已被使用/,
    slug: 'recovered-wizard-zh',
  },
  {
    english: true,
    title: '英文',
    role: 'Role name',
    identifier: 'Role identifier',
    responsibility: 'Responsibilities',
    save: 'Save role configuration',
    close: 'Close configuration',
    message: /already used/,
    slug: 'recovered-wizard-en',
  },
]
for (const words of variants)
  test(
    `角色六步标识冲突${words.title}：真实拒绝可见、输入保留、修正后显式提交`,
    { timeout: 45000 },
    async () => {
      const fixture = await createFixture()
      const application = await launch(fixture.data)
      try {
        const page = await configure(application, fixture.repository)
        const original = (await snapshot(page)).roles[0]!
        if (words.english) {
          await page.locator('.topbar .appearance-settings summary').click()
          await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
          await page.locator('.topbar .appearance-settings summary').click()
        }
        await openRoleEditor(page)
        await page.getByLabel(words.role, { exact: true }).fill('保留的冲突角色')
        await page.getByLabel(words.identifier, { exact: true }).fill(original.slug!)
        await page.getByLabel(words.responsibility, { exact: true }).fill('合成职责')
        await goRoleStep(page, 5)
        const save = roleDialog(page).getByRole('button', {
          name: words.save,
          exact: true,
        })
        await save.click()
        const alert = roleDialog(page)
          .getByRole('alert')
          .filter({ hasText: 'ROLE_IDENTIFIER_TAKEN' })
        await alert.waitFor()
        assert.match(await alert.innerText(), words.message)
        assert.doesNotMatch(await alert.innerText(), /Error invoking|workflow:|too_small/)
        assert.equal((await snapshot(page)).roles.length, 1)
        assert.equal(await alert.evaluate((element) => element === document.activeElement), true)
        await goRoleStep(page, 0)
        assert.equal(
          await page.getByLabel(words.role, { exact: true }).inputValue(),
          '保留的冲突角色',
        )
        await page.getByLabel(words.identifier, { exact: true }).fill(words.slug)
        await goRoleStep(page, 5)
        assert.equal((await snapshot(page)).roles.length, 1)
        await save.click()
        await roleDialog(page).locator('.role-health').waitFor()
        assert.equal((await snapshot(page)).roles.length, 2)
        assert.equal((await snapshot(page)).runs.length, 0)
        await roleDialog(page).getByRole('button', { name: words.close, exact: true }).click()
        await quit(application)
      } finally {
        await application.close().catch(() => undefined)
        await fixture.cleanup()
      }
    },
  )
