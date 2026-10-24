import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { openRoleEditor, goRoleStep, roleDialog } from './role-helpers'

for (const english of [false, true])
  test(
    `实际CLI检查界面${english ? '英文深色' : '中文'}：分项未验证、切换CLI不自动检查、严格命名IPC拒绝且不创建Run`,
    { timeout: 60000 },
    async () => {
      const fixture = await createFixture()
      const application = await launch(fixture.data)
      try {
        const page = await configure(application, fixture.repository)
        const before = await snapshot(page)
        if (english) {
          await page.locator('.appearance-settings summary').click()
          await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
          await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
          await page.locator('.appearance-settings summary').click()
        }
        await openRoleEditor(page, before.roles[0]!.id)
        await goRoleStep(page, 1)
        const panel = roleDialog(page).getByRole('region', {
          name: english ? 'Separate CLI checks' : 'CLI分项检查',
          exact: true,
        })
        assert.equal(
          await panel.getByText(english ? 'Not checked' : '尚未检查', { exact: true }).count(),
          2,
        )
        await panel
          .getByText(
            english
              ? 'Unverified. Save, then run a real trial in the final step.'
              : '尚未验证；保存后在最后一步真实试运行',
            { exact: true },
          )
          .waitFor()
        await roleDialog(page)
          .getByRole('combobox', { name: 'CLI', exact: true })
          .selectOption('claude')
        await panel.getByRole('heading', { name: /claude/ }).waitFor()
        assert.equal(
          await panel.getByText(english ? 'Not checked' : '尚未检查', { exact: true }).count(),
          2,
        )
        const rejected = await page.evaluate(async () => {
          try {
            await Reflect.apply(window.weftpilot!.workflow.checkCli, null, [
              { cli: 'codex', check: 'version', command: 'whoami' },
            ])
            return 'UNEXPECTED_SUCCESS'
          } catch (error) {
            return String(error)
          }
        })
        assert.match(rejected, /INPUT_INVALID/)
        assert.deepEqual(await snapshot(page), before)
        await page.keyboard.press('Escape')
        await quit(application)
      } finally {
        await application.close().catch(() => undefined)
        await fixture.cleanup()
      }
    },
  )

test(
  '实际包CLI分项：真实Codex/Claude版本和登录命令，返回来源时间但不创建Run或改就绪',
  { timeout: 120000, skip: process.env.WEFTPILOT_REAL_CLI_CHECKS !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const before = await snapshot(page)
      await openRoleEditor(page, before.roles[0]!.id)
      await goRoleStep(page, 1)
      const panel = roleDialog(page).getByRole('region', { name: 'CLI分项检查', exact: true })
      for (const cli of ['codex', 'claude']) {
        await roleDialog(page).getByRole('combobox', { name: 'CLI', exact: true }).selectOption(cli)
        assert.equal(await panel.getByText('尚未检查', { exact: true }).count(), 2)
        await panel.getByRole('button', { name: '读取版本', exact: true }).click()
        await panel
          .getByRole('status')
          .filter({ hasText: '已读取版本（未确认功能兼容性）' })
          .waitFor()
        await panel.getByRole('button', { name: '检查登录状态', exact: true }).click()
        await panel
          .getByRole('status')
          .filter({ hasText: 'CLI报告已登录（未验证服务调用）' })
          .waitFor()
        assert.equal(await panel.locator('time').count(), 2)
        assert.doesNotMatch(
          await panel.innerText(),
          /Logged in using|apiProvider|configDirectory|partialKey|@/,
        )
        assert.deepEqual(await snapshot(page), before)
      }
      await page.keyboard.press('Escape')
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
