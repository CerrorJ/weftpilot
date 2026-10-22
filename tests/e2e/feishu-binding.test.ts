import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createFixture, launch, snapshot, waitForSnapshot, quit } from './workflow-helpers'

test(
  '真实Electron飞书绑定：系统密文、应用绑定、重启、中英主题；不连接合成应用或模拟租户成功',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    const firstSecret = `synthetic-feishu-${randomUUID()}`
    try {
      let page = await application.firstWindow()
      await page.getByRole('button', { name: '飞书连接', exact: true }).click()
      assert.equal(
        await page.getByRole('button', { name: '连接专用应用', exact: true }).isDisabled(),
        true,
      )
      await page
        .getByRole('textbox', { name: 'App ID', exact: true })
        .fill('cli_invalid_extra_underscore')
      await page
        .getByRole('textbox', { name: '租户 Tenant Key', exact: true })
        .fill('synthetic-tenant')
      await page.getByRole('textbox', { name: '所有者 Open ID', exact: true }).fill('ou_synthetic')
      await page
        .getByRole('textbox', { name: '通知会话 Chat ID', exact: true })
        .fill('oc_synthetic')
      await page.getByLabel('App Secret', { exact: true }).fill(firstSecret)
      await page.getByRole('checkbox', { name: '允许此绑定连接飞书', exact: true }).check()
      await page.getByRole('button', { name: '保存飞书绑定', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: '输入格式或协议版本不兼容' }).waitFor()
      assert.equal((await snapshot(page)).feishuBinding, null)
      assert.equal((await page.getByRole('alert').innerText()).includes('regex'), false)
      await page.getByRole('textbox', { name: 'App ID', exact: true }).fill('cli_0123456789abcdef')
      await page.getByRole('button', { name: '保存飞书绑定', exact: true }).click()
      const initial = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.feishuBinding?.version === 1,
      })
      const binding = initial.feishuBinding!
      assert.equal(JSON.stringify(initial).includes(firstSecret), false)
      assert.equal(await page.getByLabel('App Secret', { exact: true }).inputValue(), '')
      const encrypted = await readFile(
        join(fixture.data, 'credentials/feishu', `${binding.credentialRef}.bin`),
      )
      assert.equal(encrypted.includes(Buffer.from(firstSecret)), false)
      assert.equal(
        (await readFile(join(fixture.data, 'kernel/kernel.sqlite'))).includes(
          Buffer.from(firstSecret),
        ),
        false,
      )
      await page.getByText('未连接', { exact: true }).waitFor()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.getByRole('heading', { name: 'Console setup guide', exact: true }).waitFor()
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.getByRole('button', { name: 'Feishu connection', exact: true }).click()
      assert.deepEqual((await snapshot(page)).feishuBinding, binding)
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await page.getByText('Disconnected', { exact: true }).waitFor()
      await page.getByRole('textbox', { name: 'App ID', exact: true }).fill('cli_abcdef0123456789')
      await page.getByRole('button', { name: 'Save Feishu binding', exact: true }).click()
      await page
        .getByRole('alert')
        .filter({ hasText: 'App Secret after changing App ID' })
        .waitFor()
      assert.deepEqual((await snapshot(page)).feishuBinding, binding)
      await page.getByLabel('App Secret', { exact: true }).fill(`rotated-${randomUUID()}`)
      await page.getByRole('button', { name: 'Save Feishu binding', exact: true }).click()
      const rotated = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.feishuBinding?.version === 2,
      })
      assert.equal(rotated.feishuBinding!.appId, 'cli_abcdef0123456789')
      assert.notEqual(rotated.feishuBinding!.credentialRef, binding.credentialRef)
      await page.getByText('Disconnected', { exact: true }).waitFor()
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
