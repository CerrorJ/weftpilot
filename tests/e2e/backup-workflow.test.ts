import { openSettingsPage } from './navigation-helpers'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { backupManifestSchema } from '@weftpilot/agent-team-kernel/protocol'
import { maintenanceStatusSchema } from '../../packages/kernel-client/maintenance-contract'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'
import type { ElectronApplication } from 'playwright'

test(
  '真实Electron备份恢复：系统选择器、密钥排除、完整快照、新内核切换/重启与损坏拒绝',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    const secret = `synthetic-backup-secret-${randomUUID()}`
    try {
      let page = await configure(application, fixture.repository)
      page.setDefaultTimeout(12000)
      await page.evaluate(async (secret) => {
        await window.weftpilot!.workflow.saveModel({
          key: crypto.randomUUID(),
          input: {
            expectedVersion: 0,
            name: '备份加密引用',
            cli: 'codex',
            provider: 'openai-compatible',
            model: 'synthetic-model',
            baseUrl: 'http://127.0.0.1:9/v1',
            credentialRef: null,
            reasoningEffort: '',
            secret,
          },
        })
      }, secret)
      const original = await snapshot(page)
      assert.equal(original.models.length, 1)
      await openSettingsPage(page, 'kernel')
      await pickDirectory(application, fixture.directory)
      await page.getByRole('button', { name: '创建工作台备份', exact: true }).click()
      await page.getByText('备份已完成并核对摘要', { exact: true }).waitFor()
      const backupDirectory = await page.locator('.backup-result code').innerText()
      const manifest = backupManifestSchema.parse(
        JSON.parse(await readFile(join(backupDirectory, 'backup.json'), 'utf8')),
      )
      assert.deepEqual(
        manifest.files.map((file) => file.path),
        ['kernel.sqlite'],
      )
      assert.equal(
        (await readFile(join(backupDirectory, 'kernel.sqlite'))).includes(Buffer.from(secret)),
        false,
      )
      assert.deepEqual((await readdir(backupDirectory)).sort(), ['backup.json', 'kernel.sqlite'])
      await page.evaluate(() =>
        window.weftpilot!.workflow.saveSkillSource({
          key: crypto.randomUUID(),
          input: {
            expectedVersion: 0,
            name: '备份之后新增',
            repository: 'https://github.com/CerrorJ/weftpilot',
            commit: 'a'.repeat(40),
          },
        }),
      )
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.skillSources.length === 1,
      })
      await pickDirectory(application, backupDirectory)
      await page.getByRole('button', { name: '选择并检查备份', exact: true }).click()
      await page.getByRole('heading', { name: '已核对的恢复预览', exact: true }).waitFor()
      await page.getByRole('button', { name: '恢复到新工作台', exact: true }).click()
      assert.equal(
        maintenanceStatusSchema.parse(
          await page.evaluate(() => window.weftpilot!.workflow.maintenanceStatus()),
        ).slot,
        'default',
      )
      await page.locator('.backup-consent input').check()
      await page.getByRole('button', { name: '恢复到新工作台', exact: true }).click()
      await page.getByRole('heading', { name: '工作台', exact: true }).waitFor({ timeout: 20000 })
      const restored = await waitForSnapshot({
        page,
        timeout: 20000,
        predicate: (state) => state.skillSources.length === 0,
      })
      assert.deepEqual(restored.projects, original.projects)
      assert.deepEqual(restored.roles, original.roles)
      assert.deepEqual(restored.models, original.models)
      const status = maintenanceStatusSchema.parse(
        await page.evaluate(() => window.weftpilot!.workflow.maintenanceStatus()),
      )
      assert.notEqual(status.slot, 'default')
      assert.equal(status.operation?.phase, 'activated')
      const old = new DatabaseSync(join(fixture.data, 'kernel/kernel.sqlite'), { readOnly: true })
      try {
        assert.equal(old.prepare('SELECT COUNT(*) AS n FROM skill_sources').get()?.n, 1)
      } finally {
        old.close()
      }
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      // 偏好由React effect应用并保存，需观察生效后再退出，不能把选择事件当成持久化确认。
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      assert.deepEqual((await snapshot(page)).models, original.models)
      assert.equal((await snapshot(page)).skillSources.length, 0)
      // preload IPC可早于React首次渲染就绪；仍须精确验证重启后的主题值。
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await openSettingsPage(page, 'kernel')
      await page
        .getByText('This workspace was restored from a backup. Previous data is retained.', {
          exact: true,
        })
        .waitFor()
      const invalid = join(fixture.directory, 'corrupted-backup')
      await cp(backupDirectory, invalid, { recursive: true })
      await writeFile(join(invalid, 'kernel.sqlite'), 'corrupted synthetic database')
      await pickDirectory(application, invalid)
      await page.getByRole('button', { name: 'Choose and inspect backup', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'BACKUP_DIGEST_MISMATCH' }).waitFor()
      assert.equal(
        maintenanceStatusSchema.parse(
          await page.evaluate(() => window.weftpilot!.workflow.maintenanceStatus()),
        ).slot,
        status.slot,
      )
      assert.deepEqual((await snapshot(page)).models, original.models)
      await pickDirectory(application, backupDirectory)
      await page.getByRole('button', { name: 'Choose and inspect backup', exact: true }).click()
      await page.getByRole('heading', { name: 'Verified restore preview', exact: true }).waitFor()
      await writeFile(
        join(backupDirectory, 'backup.json'),
        JSON.stringify({ ...manifest, id: randomUUID() }),
      )
      await page.locator('.backup-consent input').check()
      await page.getByRole('button', { name: 'Restore into a new workspace', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'BACKUP_PREVIEW_STALE' }).waitFor()
      assert.equal(
        maintenanceStatusSchema.parse(
          await page.evaluate(() => window.weftpilot!.workflow.maintenanceStatus()),
        ).slot,
        status.slot,
      )
      assert.deepEqual((await snapshot(page)).models, original.models)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/m4-backup-restored-en-dark.png' })
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实Electron恢复期间完全退出：等待切换完成与新内核退出，再从恢复数据重启',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    try {
      let page = await configure(application, fixture.repository)
      page.setDefaultTimeout(12000)
      await openSettingsPage(page, 'kernel')
      await pickDirectory(application, fixture.directory)
      await page.getByRole('button', { name: '创建工作台备份', exact: true }).click()
      await page.getByText('备份已完成并核对摘要', { exact: true }).waitFor()
      const backupDirectory = await page.locator('.backup-result code').innerText()
      await pickDirectory(application, backupDirectory)
      await page.getByRole('button', { name: '选择并检查备份', exact: true }).click()
      await page.getByRole('heading', { name: '已核对的恢复预览', exact: true }).waitFor()
      await page.locator('.backup-consent input').check()
      await page.getByRole('button', { name: '恢复到新工作台', exact: true }).click()
      await quit(application)
      const status = JSON.parse(
        await readFile(join(fixture.data, 'active-kernel.json'), 'utf8'),
      ) as { slot: string }
      assert.notEqual(status.slot, 'default')
      const restoredPath = join(fixture.data, 'workspaces', status.slot)
      const database = new DatabaseSync(join(restoredPath, 'kernel.sqlite'), { readOnly: true })
      try {
        assert.equal(
          database.prepare('SELECT type FROM events ORDER BY sequence DESC LIMIT 1').get()?.type,
          'kernel.stopped',
        )
      } finally {
        database.close()
      }
      const lock = new DatabaseSync(join(restoredPath, 'instance.sqlite'))
      try {
        lock.exec('BEGIN EXCLUSIVE; ROLLBACK')
      } finally {
        lock.close()
      }
      application = await launch(fixture.data)
      page = await application.firstWindow()
      assert.equal((await snapshot(page)).projects.length, 1)
      assert.equal(
        maintenanceStatusSchema.parse(
          await page.evaluate(() => window.weftpilot!.workflow.maintenanceStatus()),
        ).slot,
        status.slot,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

const pickDirectory = async (
  application: ElectronApplication,
  directory: string,
): Promise<void> => {
  // 只替代系统选择器；协议、SQLite、safeStorage、实际工具进程与原子位置切换均使用真实实现。
  await application.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  }, directory)
}
