import { openSettingsPage } from './navigation-helpers'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cp, mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { _electron as electron } from 'playwright'
import { prepareElectronTest } from './electron-test-session'
import { quit } from './workflow-helpers'

test(
  '真实 Electron 工具进程运行锁定内核，窗口关闭继续，完全退出确认结束',
  { timeout: 60_000 },
  async (context) => {
    const data = await mkdtemp(join(tmpdir(), '纬舟 native '))
    let executablePath = process.env.WEFTPILOT_PACKAGED_EXE
    if (executablePath && process.platform === 'win32') {
      const installDirectory = join(data, '安装 # 中文路径')
      await cp(dirname(executablePath), installDirectory, { recursive: true })
      executablePath = join(installDirectory, basename(executablePath))
    }
    const packagedPath =
      process.platform === 'win32'
        ? join(process.env.SystemRoot ?? 'C:/Windows', 'System32')
        : '/usr/bin:/bin'
    const application = await prepareElectronTest(
      await electron.launch({
        ...(executablePath ? { executablePath, args: [] } : { args: ['.'] }),
        ...(executablePath ? { cwd: data } : {}),
        env: {
          ...process.env,
          WEFTPILOT_TEST_DATA: data,
          ...(executablePath ? { PATH: packagedPath, Path: packagedPath } : {}),
        },
      }),
    )
    // after钩子独立报告清理失败，避免finally的EBUSY覆盖原业务断言。
    context.after(async () => {
      await application.close().catch(() => undefined)
      assert.equal(dirname(resolve(data)), resolve(tmpdir()))
      assert.ok(basename(data).startsWith('纬舟 native '))
      await rm(data, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 })
    })
    const page = await application.firstWindow()
    await openSettingsPage(page, 'kernel')
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })
    await page.getByText('Agent-Team 内核已连接', { exact: true }).waitFor()
    const lock = JSON.parse(await readFile('config/kernel-lock.json', 'utf8')) as {
      sourceCommit: string
    }
    assert.equal(await page.getByTestId('source-commit').textContent(), lock.sourceCommit)
    assert.equal(
      await page.evaluate(() => typeof (window as unknown as { require?: unknown }).require),
      'undefined',
    )
    await page.getByRole('button', { name: '重新检测' }).click()
    await page.getByText('Agent-Team 内核已连接', { exact: true }).waitFor()
    await mkdir('.tmp/evidence', { recursive: true })
    await page.screenshot({ path: '.tmp/evidence/m0-windows.png' })
    await application.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.close()
    })
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]?.isVisible(),
      ),
      false,
    )
    assert.equal(await page.getByTestId('source-commit').textContent(), lock.sourceCommit)
    await application.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.show()
    })
    await page.getByRole('button', { name: '重新检测' }).click()
    await page.getByText('Agent-Team 内核已连接', { exact: true }).waitFor()
    assert.deepEqual(pageErrors, [])
    assert.equal(
      await application.evaluate(({ safeStorage }) => {
        if (!safeStorage.isEncryptionAvailable()) return false
        const probe = 'weftpilot-test-probe'
        return safeStorage.decryptString(safeStorage.encryptString(probe)) === probe
      }),
      true,
    )
    await quit(application)
    const { DatabaseSync } = await import('node:sqlite')
    const db = new DatabaseSync(resolve(data, 'kernel/kernel.sqlite'), { readOnly: true })
    const events = db.prepare('SELECT type FROM events ORDER BY sequence').all()
    db.close()
    assert.deepEqual(
      events.map((event) => event.type),
      ['kernel.started', 'kernel.stopped'],
    )
  },
)
