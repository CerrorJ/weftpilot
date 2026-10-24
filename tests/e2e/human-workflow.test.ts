import { confirmPreflight } from './preflight-helpers'
import { openHumanPage } from './navigation-helpers'
import { openRoleEditor, goRoleStep, saveRoleEditor, activateSavedRole } from './role-helpers'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { readFile, access, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from 'playwright'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'

for (const cli of ['codex', 'claude'] as const)
  test(
    `真实${cli}人工处理：等待态重启、显式回答、同Run续接与交付验收`,
    { timeout: 240000, skip: process.env.WEFTPILOT_REAL_HUMAN !== '1' },
    async () => {
      const fixture = await createFixture()
      let application = await launch(fixture.data)
      try {
        let page = await configure(application, fixture.repository, { activate: cli === 'codex' })
        if (cli === 'claude') await configureClaude(page)
        const taskId = await createHumanTask(page, cli)
        await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
        await confirmPreflight(page)
        const paused = await waitForSnapshot({
          page,
          timeout: 90000,
          predicate: (state) =>
            state.runs.some((run) => run.taskId === taskId && run.status === 'waiting_input'),
        })
        const run = paused.runs.find((item) => item.taskId === taskId)!
        const request = paused.humanRequests.find((item) => item.runId === run.id)!
        assert.equal(run.processState, 'confirmed_ended')
        assert.equal(request.status, 'pending')
        assert.equal(
          paused.deliveries.some((item) => item.runId === run.id),
          false,
        )
        await assert.rejects(access(join(run.workDirectory, 'answer.txt')))
        await quit(application)
        application = await launch(fixture.data)
        page = await application.firstWindow()
        await openHumanPage(page)
        const restored = await snapshot(page)
        assert.equal(
          restored.humanRequests.find((item) => item.id === request.id)?.status,
          'pending',
        )
        assert.equal(restored.runs.find((item) => item.id === run.id)?.status, 'waiting_input')
        assert.equal(
          await page.getByRole('combobox', { name: '选择回答', exact: true }).inputValue(),
          '',
        )
        await page.getByRole('button', { name: '提交回答并继续', exact: true }).click()
        assert.equal(
          (await snapshot(page)).humanRequests.find((item) => item.id === request.id)?.status,
          'pending',
        )
        await page.locator('.appearance-settings summary').click()
        await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
        const answer = `OWNER_${randomUUID()}`
        await page
          .getByRole('textbox', { name: 'Your own answer (takes priority)', exact: true })
          .fill(answer)
        await page.getByRole('button', { name: 'Submit answers and continue', exact: true }).click()
        const finished = await waitForSnapshot({
          page,
          timeout: 90000,
          predicate: (state) =>
            state.runs.find((item) => item.id === run.id)?.status === 'succeeded',
        })
        const continued = finished.runs.find((item) => item.id === run.id)!
        assert.equal(continued.attempt, 1)
        assert.deepEqual(continued.roleSnapshot, run.roleSnapshot)
        assert.equal(finished.runs.filter((item) => item.taskId === taskId).length, 1)
        assert.equal(
          (await readFile(join(continued.workDirectory, 'answer.txt'), 'utf8')).trim(),
          answer,
        )
        assert.equal(
          finished.humanRequests.find((item) => item.id === request.id)?.status,
          'answered',
        )
        assert.equal(finished.tasks.find((item) => item.id === taskId)?.status, 'in_review')
        await page.getByRole('button', { name: 'Tasks', exact: true }).click()
        await page.getByRole('button', { name: 'All tasks', exact: true }).click()
        await page
          .locator('.task-table button')
          .filter({ hasText: taskId.slice(0, 8) })
          .click()
        await page.getByRole('button', { name: 'Accept delivery', exact: true }).click()
        await waitForSnapshot({
          page,
          timeout: 10000,
          predicate: (state) => state.tasks.find((item) => item.id === taskId)?.status === 'done',
        })
        await quit(application)
      } catch (error) {
        // 仅保存本用例合成数据，失败后仍能区分模型拒绝、协议失败和执行未结束。
        const page = await application.firstWindow().catch(() => undefined)
        const state = page ? await snapshot(page).catch(() => undefined) : undefined
        await mkdir('.tmp/evidence', { recursive: true })
        await writeFile(
          `.tmp/evidence/human-${cli}-failure-${Date.now()}.json`,
          JSON.stringify({ fixture: fixture.directory, state }, null, 2),
        )
        throw error
      } finally {
        await application.close().catch(() => undefined)
        await fixture.cleanup()
      }
    },
  )

const configureClaude = async (page: Page) => {
  await openRoleEditor(page, (await snapshot(page)).roles[0]!.id)
  await goRoleStep(page, 1)
  await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption('claude')
  await saveRoleEditor(page)
  await page
    .getByRole('option', { name: '测试开发者 · v2', exact: true })
    .waitFor({ state: 'attached' })
  await activateSavedRole(page)
}

const createHumanTask = async (page: Page, cli: 'codex' | 'claude'): Promise<string> => {
  await page.getByRole('button', { name: '任务管理', exact: true }).click()
  await page.getByRole('button', { name: '创建任务', exact: true }).click()
  await page.getByRole('textbox', { name: '任务名称', exact: true }).fill('真实人工澄清')
  const first =
    cli === 'codex'
      ? 'First call the registered agent_team request_clarification tool.'
      : 'First return a structured outcome.kind clarification request.'
  await page
    .getByRole('textbox', { name: '任务目标', exact: true })
    .fill(
      `${first} Ask one question with id format, prompt Which output?, options a=Alpha and b=Beta. Do not answer yourself or create any files yet. After the owner answers in a later continuation, write answer.txt containing exactly their answer text and finish. Do not use network, commit or push.`,
    )
  await page
    .getByRole('textbox', { name: '验收条件', exact: true })
    .fill('必须先等待所有者，回答后同Run写入answer.txt；交付仍需人工验收。')
  await page.getByRole('button', { name: '创建待执行任务', exact: true }).click()
  await page.getByRole('heading', { name: '真实人工澄清', exact: true }).waitFor()
  return (await snapshot(page)).tasks.find((task) => task.title === '真实人工澄清')!.id
}
