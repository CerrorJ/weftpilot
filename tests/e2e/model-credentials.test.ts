import { openSettingsPage } from './navigation-helpers'
import {
  openRoleEditor,
  goRoleStep,
  saveRoleEditor,
  openRoleManagement,
  waitRoleCard,
} from './role-helpers'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  createFixture,
  launch,
  quit,
  configure,
  snapshot,
  waitForSnapshot,
} from './workflow-helpers'

test(
  '真实 Electron：系统加密、密钥轮换、地址绑定、重启后真实 Codex 认证拒绝',
  { timeout: 120000, skip: process.env.WEFTPILOT_CREDENTIAL_PROBE !== '1' },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    const firstKey = 'synthetic-weftpilot-v1-key'
    const secondKey = 'synthetic-weftpilot-v2-key'
    const requests: boolean[] = []
    const server = createServer((request, response) => {
      requests.push(request.headers.authorization === `Bearer ${firstKey}`)
      request.resume()
      response.writeHead(401, { 'Content-Type': 'application/json' })
      response.end(
        JSON.stringify({
          error: { message: 'Synthetic authentication rejection', code: 'invalid_api_key' },
        }),
      )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    assert.ok(address && typeof address === 'object')
    const endpoint = `http://127.0.0.1:${address.port}/v1`
    try {
      let page = await configure(application, fixture.repository)
      await openSettingsPage(page, 'models')
      await page.getByRole('textbox', { name: '配置名称', exact: true }).fill('认证拒绝探针')
      await page.getByRole('combobox', { name: '认证方式', exact: true }).selectOption('custom')
      await page.getByRole('textbox', { name: '接口地址', exact: true }).fill(endpoint)
      await page.getByLabel('API 密钥', { exact: true }).fill(firstKey)
      await page
        .getByRole('textbox', { name: '模型标识（可选）', exact: true })
        .fill('synthetic-model')
      await page.getByRole('button', { name: '创建模型配置', exact: true }).click()
      await page
        .getByRole('option', { name: '认证拒绝探针 · v1', exact: true })
        .waitFor({ state: 'attached' })
      assert.equal(await page.getByLabel('API 密钥', { exact: true }).inputValue(), '')
      const initial = (await snapshot(page)).models[0]!
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      await openRoleEditor(page, (await snapshot(page)).roles[0]!.id)
      await goRoleStep(page, 1)
      await page
        .getByRole('combobox', { name: '模型配置', exact: true })
        .selectOption(`${initial.id}@1`)
      await saveRoleEditor(page)
      await waitRoleCard(page, '测试开发者', 2)
      await openSettingsPage(page, 'models')
      await page
        .getByRole('combobox', { name: '编辑模型配置', exact: true })
        .selectOption(initial.id)
      await page.getByLabel('API 密钥', { exact: true }).fill(secondKey)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await page
        .getByRole('option', { name: '认证拒绝探针 · v2', exact: true })
        .waitFor({ state: 'attached' })
      const state = await snapshot(page)
      assert.notEqual(state.models.at(-1)?.credentialRef, initial.credentialRef)
      assert.equal(state.roles.at(-1)?.modelProfileSnapshot?.credentialRef, initial.credentialRef)
      assert.equal(JSON.stringify(state).includes(firstKey), false)
      assert.equal(JSON.stringify(state).includes(secondKey), false)
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      await openRoleEditor(page, (await snapshot(page)).roles[0]!.id)
      await goRoleStep(page, 1)
      assert.equal(
        await page.getByRole('combobox', { name: '模型配置', exact: true }).inputValue(),
        `${initial.id}@1`,
      )
      await saveRoleEditor(page)
      await waitRoleCard(page, '测试开发者', 3)
      assert.equal((await snapshot(page)).roles.at(-1)?.modelProfileSnapshot?.version, 1)
      await openSettingsPage(page, 'models')
      await page
        .getByRole('combobox', { name: '编辑模型配置', exact: true })
        .selectOption(initial.id)
      const vaultDirectory = join(fixture.data, 'credentials/models')
      const files = await readdir(vaultDirectory)
      assert.equal(files.length, 2)
      for (const file of files) {
        const data = await readFile(join(vaultDirectory, file))
        assert.equal(data.includes(Buffer.from(firstKey)), false)
        assert.equal(data.includes(Buffer.from(secondKey)), false)
      }
      await page
        .getByRole('textbox', { name: '接口地址', exact: true })
        .fill(`${endpoint}/different`)
      await page.getByRole('button', { name: '保存新版本', exact: true }).click()
      await page
        .getByRole('alert')
        .filter({ hasText: /MODEL_CREDENTIAL_REQUIRED/ })
        .waitFor()
      assert.equal((await snapshot(page)).models.length, 2)
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      await openRoleManagement(page)
      await page.getByRole('button', { name: '真实试运行', exact: true }).click()
      await waitForSnapshot({
        page,
        timeout: 70000,
        predicate: (state) =>
          state.runs.some(
            (run) => run.status === 'failed' && run.processState === 'confirmed_ended',
          ),
      })
      const observed = await snapshot(page)
      assert.ok(
        requests.length > 0,
        `No request; run failure codes: ${JSON.stringify(observed.runs.map((run) => ({ status: run.status, code: run.failureCode, process: run.processState })))}`,
      )
      assert.ok(requests.every(Boolean), '旧角色必须仍使用旧版本密钥')
      const final = await snapshot(page)
      assert.equal(final.roleReadiness[0]?.enabled, false)
      assert.equal(final.deliveries.length, 0)
      assert.equal(JSON.stringify(final).includes(firstKey), false)
      await quit(application)
    } finally {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
