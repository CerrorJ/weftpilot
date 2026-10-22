import assert from 'node:assert/strict'
import { test } from 'node:test'
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  createFixture,
  launch,
  quit,
  configure,
  waitForSnapshot,
  createTask,
  businessSnapshot as snapshot,
} from './workflow-helpers'

test(
  '真实窗口：中英文与主题持久化，项目角色任务重启恢复，脏仓库不执行',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await createTask(page, '在隔离目录创建 hello.txt。')
      await writeFile(join(fixture.repository, 'user-uncommitted.txt'), '必须保留')
      await page.getByRole('button', { name: '开始真实执行' }).click()
      await page.getByRole('alert').filter({ hasText: 'GIT_DIRTY' }).waitFor()
      assert.equal((await snapshot(page)).runs.length, 0)
      assert.equal(
        await readFile(join(fixture.repository, 'user-uncommitted.txt'), 'utf8'),
        '必须保留',
      )
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('heading', { name: 'Tasks & deliveries', exact: true }).waitFor()
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      assert.equal(await page.locator('html').getAttribute('lang'), 'en')
      assert.equal(
        await page.locator('body').evaluate((body) => getComputedStyle(body).color),
        'rgb(227, 234, 221)',
      )
      assert.equal(
        await application.evaluate(({ Menu }) => Menu.getApplicationMenu()?.items[1]?.label),
        'Edit',
      )
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/m1-english-dark.png' })
      await page.reload()
      await page.getByRole('heading', { name: 'Tasks & deliveries', exact: true }).waitFor()
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await quit(application)
      application = await launch(fixture.data)
      const restored = await application.firstWindow()
      await restored.getByRole('heading', { name: 'Tasks & deliveries', exact: true }).waitFor()
      assert.equal((await snapshot(restored)).tasks.length, 1)
      assert.equal(await restored.locator('html').getAttribute('data-theme'), 'dark')
      await restored.locator('.appearance-settings summary').click()
      await restored
        .getByRole('combobox', { name: 'Appearance', exact: true })
        .selectOption('light')
      await restored.getByRole('combobox', { name: 'Language', exact: true }).selectOption('zh-CN')
      await restored.getByRole('heading', { name: '任务与交付', exact: true }).waitFor()
      await restored.getByRole('combobox', { name: '外观', exact: true }).selectOption('system')
      await restored.emulateMedia({ colorScheme: 'dark' })
      assert.equal(
        await restored.locator('body').evaluate((body) => getComputedStyle(body).color),
        'rgb(227, 234, 221)',
      )
      await restored.emulateMedia({ colorScheme: 'light' })
      assert.equal(
        await restored.locator('body').evaluate((body) => getComputedStyle(body).color),
        'rgb(35, 56, 43)',
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实 CLI：桌面创建到交付退回、新 Run 重试与人工验收',
  { timeout: 300000, skip: process.env.WEFTPILOT_REAL_CLI !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      await createTask(
        page,
        'In this isolated repository create hello.txt containing exactly WEFTPILOT_M1_OK followed by a newline. Do not use network, install anything, touch other directories, commit or push. Reply briefly.',
      )
      await page.getByRole('button', { name: '开始真实执行' }).click()
      await page.getByRole('button', { name: '验收通过', exact: true }).waitFor({ timeout: 75000 })
      let state = await snapshot(page)
      assert.equal(state.tasks[0]?.status, 'in_review')
      assert.equal(state.runs[0]?.status, 'succeeded')
      assert.ok(state.runs[0]?.workDirectory)
      assert.equal(
        (await readFile(join(state.runs[0].workDirectory, 'hello.txt'), 'utf8')).trim(),
        'WEFTPILOT_M1_OK',
      )
      assert.ok(state.deliveries[0]?.diff.includes('WEFTPILOT_M1_OK'))
      await page.getByLabel('验收备注 / 退回原因', { exact: true }).fill('重试验证，保留此前交付')
      await page.getByRole('button', { name: '退回并保留原因', exact: true }).click()
      await page.getByRole('button', { name: '创建新 Run 重试' }).click()
      await page.getByRole('button', { name: '验收通过', exact: true }).waitFor({ timeout: 75000 })
      state = await snapshot(page)
      assert.equal(state.runs.length, 2)
      assert.notEqual(state.runs[0]?.id, state.runs[1]?.id)
      assert.equal(state.deliveries[1]?.version, 2)
      assert.equal(state.acceptances[0]?.reason, '重试验证，保留此前交付')
      await page.getByRole('button', { name: '验收通过', exact: true }).click()
      await page.locator('.task-detail .badge').filter({ hasText: '已验收' }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/m1-real-cli-accepted.png' })
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实 CLI：请求停止和完全退出均等待在途进程结束',
  { timeout: 240000, skip: process.env.WEFTPILOT_REAL_CLI !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      await createTask(
        page,
        'For this isolated test, first run a shell command that waits 40 seconds (Start-Sleep on Windows or sleep elsewhere). After the wait write hello.txt containing WEFTPILOT_M1_OK. Do not use network, commit or push.',
      )
      await page.getByRole('button', { name: '开始真实执行' }).click()
      await waitForSnapshot({
        page,
        timeout: 60000,
        predicate: (state) => {
          const run = state.runs.filter((item) => item.purpose !== 'role_trial').at(-1)
          return state.logs.some(
            (item) =>
              item.runId === run?.id &&
              !['session', 'stats', 'retry', 'result', 'error', 'tool_end'].includes(item.label),
          )
        },
      })
      await page.getByRole('button', { name: '请求停止', exact: true }).click()
      await page.getByRole('heading', { name: /已停止/ }).waitFor({ timeout: 15000 })
      const state = await snapshot(page)
      assert.equal(state.runs[0]?.processState, 'confirmed_ended')
      assert.equal(state.runs[0]?.failureCode, null)
      assert.equal(state.tasks[0]?.status, 'ready')
      await page.getByRole('button', { name: '创建新 Run 重试' }).click()
      await page.getByRole('button', { name: '请求停止', exact: true }).waitFor()
      await quit(application)
      await assertEndedProcesses(fixture.data)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

const assertEndedProcesses = async (data: string) => {
  const { DatabaseSync } = await import('node:sqlite')
  const database = new DatabaseSync(join(data, 'kernel/kernel.sqlite'), {
    readOnly: true,
  })
  try {
    const runs = database
      .prepare('SELECT data FROM runs ORDER BY rowid')
      .all()
      .map(
        (row) =>
          JSON.parse(String(row.data)) as {
            processState: string
            status: string
            purpose?: string
          },
      )
    assert.equal(runs.filter((run) => run.purpose !== 'role_trial').length, 2)
    assert.ok(runs.every((run) => run.processState === 'confirmed_ended'))
    const segments = database.prepare('SELECT pid,ended_at FROM execution_segments').all()
    for (const segment of segments) {
      assert.ok(segment.ended_at)
      if (segment.pid) assert.throws(() => process.kill(Number(segment.pid), 0), /ESRCH|找不到/)
    }
  } finally {
    database.close()
  }
}

test(
  '真实 CLI：启动后立即停止的竞争重复三次',
  { timeout: 180000, skip: process.env.WEFTPILOT_REAL_CLI !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      await createTask(
        page,
        'Create hello.txt containing WEFTPILOT_M1_OK in this isolated directory only. Do not use network, commit or push.',
      )
      for (let attempt = 0; attempt < 3; attempt++) {
        const startName = attempt === 0 ? '开始真实执行' : '创建新 Run 重试'
        await page.getByRole('button', { name: startName, exact: true }).click()
        await page.getByRole('button', { name: '请求停止', exact: true }).click()
        await page
          .getByRole('button', { name: '创建新 Run 重试', exact: true })
          .waitFor({ timeout: 15000 })
        const state = await snapshot(page)
        assert.equal(state.runs.at(-1)?.processState, 'confirmed_ended')
        assert.ok(['stopped', 'cancelled'].includes(state.runs.at(-1)?.status ?? ''))
      }
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
