import { openSettingsPage } from './navigation-helpers'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { _electron as electron } from 'playwright'
import { diagnosticReportSchema } from '../../packages/kernel-client/diagnostics-contract'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'

test(
  '真实诊断预览与原子导出：排除业务/路径/密钥、取消/拒绝/写失败、中英明暗700px',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const secret = `synthetic-diagnostic-secret-${randomUUID()}`
      await page.evaluate(
        (secret) =>
          window.weftpilot!.workflow.saveModel({
            key: crypto.randomUUID(),
            input: {
              expectedVersion: 0,
              name: 'private-synthetic-model-name',
              cli: 'codex',
              provider: 'openai-compatible',
              model: 'synthetic-model',
              baseUrl: 'http://127.0.0.1:9/v1',
              credentialRef: null,
              reasoningEffort: '',
              secret,
            },
          }),
        secret,
      )
      const before = await snapshot(page)
      await openSettingsPage(page, 'kernel')
      await page.getByRole('heading', { name: '环境检查', exact: true }).waitFor()
      await page.getByText('诊断报告预览', { exact: true }).click()
      const preview = diagnosticReportSchema.parse(
        JSON.parse(await page.locator('.diagnostic-export pre').innerText()),
      )
      assert.equal(preview.environment.authentication, 'unchecked')
      assert.equal(
        preview.environment.checks.find((check) => check.id === 'database')?.state,
        'passed',
      )
      assert.equal(preview.environment.checks.find((check) => check.id === 'projects')?.count, 0)
      assert.deepEqual(
        preview.environment.tools.map((tool) => tool.id),
        ['git', 'codex', 'claude'],
      )
      for (const excluded of [
        secret,
        fixture.directory,
        'private-synthetic-model-name',
        before.roles[0]!.responsibility,
      ])
        assert.equal(JSON.stringify(preview).includes(excluded), false)
      const output = join(fixture.directory, 'diagnostic-report.json')
      await writeFile(output, 'previous synthetic export')
      await application.evaluate(({ dialog }, filePath) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath })
      }, output)
      await page.getByRole('button', { name: '导出已预览报告', exact: true }).click()
      await page.getByRole('status').filter({ hasText: '已导出' }).waitFor()
      assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), preview)
      assert.deepEqual(await snapshot(page), before)
      await application.evaluate(({ dialog }) => {
        dialog.showSaveDialog = async () => ({ canceled: true, filePath: '' })
      })
      await page.getByRole('button', { name: '导出已预览报告', exact: true }).click()
      assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), preview)
      const stale = await page.evaluate(async () => {
        try {
          await window.weftpilot!.exportDiagnostics({
            ticket: crypto.randomUUID(),
            language: 'zh-CN',
          })
          return ''
        } catch (error) {
          return String(error)
        }
      })
      assert.match(stale, /DIAGNOSTIC_PREVIEW_STALE/)
      await application.evaluate(({ dialog }, filePath) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath })
      }, fixture.directory)
      await page.getByRole('button', { name: '导出已预览报告', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'DIAGNOSTIC_EXPORT_FAILED' }).waitFor()
      assert.equal(
        (await readdir(fixture.directory)).some((file) =>
          file.startsWith('.weftpilot-diagnostic-'),
        ),
        false,
      )
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.getByRole('heading', { name: 'Environment checks', exact: true }).waitFor()
      await application.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.setSize(700, 780)
      })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        true,
      )
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/m4-diagnostics-en-dark.png', fullPage: true })
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('light')
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        true,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实独立内核在精简PATH下明确报告缺少工具，仍可检查SQLite；不冒充登录或执行成功',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const executablePath = process.env.WEFTPILOT_PACKAGED_EXE
    const path =
      process.platform === 'win32'
        ? join(process.env.SystemRoot ?? 'C:/Windows', 'System32')
        : '/usr/bin:/bin'
    const application = await electron.launch({
      ...(executablePath ? { executablePath, args: [] } : { args: ['.'] }),
      env: { ...process.env, PATH: path, Path: path, WEFTPILOT_TEST_DATA: fixture.data },
    })
    try {
      const page = await application.firstWindow()
      await openSettingsPage(page, 'kernel')
      await page.getByRole('heading', { name: '环境检查', exact: true }).waitFor()
      const result = await page.evaluate(() => window.weftpilot!.diagnostics())
      const report = diagnosticReportSchema.strip().parse(result)
      assert.equal(report.environment.authentication, 'unchecked')
      assert.ok(
        report.environment.tools.filter((tool) => tool.id !== 'git').every((tool) => !tool.found),
      )
      assert.equal(
        report.environment.checks.find((check) => check.id === 'database')?.state,
        'passed',
      )
      assert.equal(
        await page.locator('[data-tool="codex"]').innerText(),
        'Codex CLI\n未找到受支持入口',
      )
      assert.deepEqual((await snapshot(page)).runs, [])
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '业务数据损坏仍可从真实内核导出最小故障报告，不修复数据或误报断线',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    const damaged = 'private-synthetic-invalid-json'
    try {
      await configure(application, fixture.repository)
      await quit(application)
      const database = new DatabaseSync(join(fixture.data, 'kernel/kernel.sqlite'))
      database.prepare('UPDATE projects SET data=?').run(damaged)
      database.close()
      application = await launch(fixture.data)
      const page = await application.firstWindow()
      await openSettingsPage(page, 'kernel')
      await page.getByText('Agent-Team 内核已连接', { exact: true }).waitFor()
      await page.locator('[data-check="workspace-data"]').filter({ hasText: '检查失败' }).waitFor()
      await page.locator('[data-check="dependent-checks"]').filter({ hasText: '未检测' }).waitFor()
      await page.getByText('诊断报告预览', { exact: true }).click()
      const report = diagnosticReportSchema.parse(
        JSON.parse(await page.locator('.diagnostic-export pre').innerText()),
      )
      assert.equal(JSON.stringify(report).includes(damaged), false)
      assert.equal(
        report.environment.checks.find((check) => check.id === 'database')?.state,
        'passed',
      )
      assert.equal(
        report.environment.checks.find((check) => check.id === 'projects'),
        undefined,
      )
      const output = join(fixture.directory, 'fault-report.json')
      await application.evaluate(({ dialog }, filePath) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath })
      }, output)
      await page.getByRole('button', { name: '导出已预览报告', exact: true }).click()
      await page.getByRole('status').filter({ hasText: '已导出' }).waitFor()
      assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), report)
      await quit(application)
      const unchanged = new DatabaseSync(join(fixture.data, 'kernel/kernel.sqlite'), {
        readOnly: true,
      })
      assert.equal(unchanged.prepare('SELECT data FROM projects').get()?.data, damaged)
      assert.equal(
        unchanged.prepare('SELECT type FROM events ORDER BY sequence DESC LIMIT 1').get()?.type,
        'kernel.stopped',
      )
      unchanged.close()
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
