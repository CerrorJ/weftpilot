import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  createFixture,
  launch,
  quit,
  configure,
  createTask,
  snapshot,
  waitForSnapshot,
} from './workflow-helpers'
import { confirmPreflight, assertPreflightClickCloseFocus } from './preflight-helpers'

for (const language of ['zh-CN', 'en'] as const)
  test(
    `实际预检${language}：只读阻塞、脏文件保留、重查和Esc返回任务详情`,
    { timeout: 60000 },
    async () => {
      const fixture = await createFixture()
      const application = await launch(fixture.data)
      try {
        const page = await configure(application, fixture.repository)
        await createTask(page, '只测试预检，不启动CLI。', '执行前检查测试')
        if (language === 'en') {
          await page.locator('.appearance-settings summary').click()
          await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
          await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
        }
        const before = await snapshot(page)
        const title = language === 'en' ? 'Preflight check' : '执行前检查'
        const trigger = page.getByRole('button', {
          name: language === 'en' ? 'Start execution' : '开始真实执行',
          exact: true,
        })
        await trigger.click()
        const dialog = page.getByRole('dialog', { name: title, exact: true })
        await dialog.getByRole('alert').filter({ hasText: 'ROLE_NOT_READY' }).waitFor()
        const confirm = dialog.getByRole('button', {
          name: language === 'en' ? 'Confirm and start' : '确认并开始',
          exact: true,
        })
        assert.equal(await confirm.isDisabled(), true)
        assert.deepEqual(await snapshot(page), before)
        const file = join(fixture.repository, 'user-change.txt')
        await writeFile(file, 'WEFTPILOT_PRESERVE_PREFLIGHT')
        await dialog
          .getByRole('button', {
            name: language === 'en' ? 'Check again' : '重新检查',
            exact: true,
          })
          .click()
        await dialog.getByRole('alert').filter({ hasText: 'GIT_DIRTY' }).waitFor()
        assert.equal(await readFile(file, 'utf8'), 'WEFTPILOT_PRESERVE_PREFLIGHT')
        assert.deepEqual(await snapshot(page), before)
        await unlink(file)
        await dialog
          .getByRole('button', {
            name: language === 'en' ? 'Check again' : '重新检查',
            exact: true,
          })
          .click()
        await dialog.getByRole('alert').filter({ hasText: 'ROLE_NOT_READY' }).waitFor()
        await page.keyboard.press('Escape')
        await dialog.waitFor({ state: 'hidden' })
        assert.equal(
          await page
            .getByRole('complementary', {
              name: language === 'en' ? 'Task details' : '任务详情',
              exact: true,
            })
            .isVisible(),
          true,
        )
        assert.equal(await trigger.evaluate((element) => element === document.activeElement), true)
        await assertPreflightClickCloseFocus({ trigger, dialog, language })
        assert.deepEqual(await snapshot(page), before)
        const invalid = {
          operation: 'start' as const,
          id: before.tasks[0]!.id,
          expectedVersion: 1,
          arbitraryPath: 'FORBIDDEN_PATH',
        }
        await assert.rejects(
          page.evaluate((input) => window.weftpilot!.workflow.preflight(input), invalid),
          /INPUT_INVALID/,
        )
        const absent = await page.evaluate(
          (id) =>
            window.weftpilot!.workflow.preflight({ operation: 'start', id, expectedVersion: 1 }),
          randomUUID(),
        )
        assert.equal((absent as { canStart: boolean }).canStart, false)
        assert.equal(JSON.stringify(absent).includes('NOT_FOUND'), true)
        await quit(application)
      } finally {
        await application.close().catch(() => undefined)
        await fixture.cleanup()
      }
    },
  )

test(
  '真实Codex预检：旧Git基线拒绝、显式重查确认才创建Run，执行与验收分离',
  { timeout: 180000, skip: process.env.WEFTPILOT_REAL_PREFLIGHT !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      await createTask(
        page,
        'Respond exactly WEFTPILOT_PREFLIGHT_REAL_OK. Do not modify files, run commands, use network, commit or push.',
        '真实预检闭环',
      )
      const before = await snapshot(page)
      const task = before.tasks.find((item) => item.title === '真实预检闭环')!
      await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '执行前检查', exact: true })
      const confirm = dialog
        .getByRole('button', { name: '确认并开始', exact: true })
        .and(page.locator(':enabled'))
      await confirm.waitFor()
      assert.deepEqual(await snapshot(page), before)
      assert.equal(
        await dialog.getByText('CLI 登录状态尚未验证', { exact: true }).isVisible(),
        true,
      )
      execFileSync(
        'git',
        [
          '-c',
          'user.name=WeftPilot Test',
          '-c',
          'user.email=test@weftpilot.invalid',
          'commit',
          '--allow-empty',
          '-m',
          'updated preflight baseline',
        ],
        { cwd: fixture.repository, stdio: 'ignore' },
      )
      await confirm.click()
      await dialog.getByRole('alert').filter({ hasText: 'PREFLIGHT_CHANGED' }).waitFor()
      assert.equal((await snapshot(page)).runs.filter((run) => run.taskId === task.id).length, 0)
      assert.equal(
        await dialog.getByRole('button', { name: '确认并开始', exact: true }).isDisabled(),
        true,
      )
      await dialog.getByRole('button', { name: '重新检查', exact: true }).click()
      await confirmPreflight(page)
      const finished = await waitForSnapshot({
        page,
        timeout: 90000,
        predicate: (state) =>
          state.runs.some(
            (run) => run.taskId === task.id && run.processState === 'confirmed_ended',
          ),
      })
      const run = finished.runs.find((item) => item.taskId === task.id)!
      assert.equal(run.status, 'succeeded')
      assert.equal(finished.tasks.find((item) => item.id === task.id)?.status, 'in_review')
      assert.equal(
        run.baselineCommit,
        execFileSync('git', ['rev-parse', 'main'], {
          cwd: fixture.repository,
          encoding: 'utf8',
        }).trim(),
      )
      assert.ok(
        finished.deliveries
          .find((item) => item.runId === run.id)
          ?.answer.includes('WEFTPILOT_PREFLIGHT_REAL_OK'),
      )
      assert.equal(finished.acceptances.filter((item) => item.taskId === task.id).length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
