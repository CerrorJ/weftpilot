import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from 'playwright'
import { openRoleEditor, goRoleStep, saveRoleEditor } from './role-helpers'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'

test(
  '真实双 CLI 团队：文件挑战、上游验收门控、贡献交接、父任务与重启',
  { timeout: 360000, skip: process.env.WEFTPILOT_REAL_TEAM !== '1' },
  async () => {
    const fixture = await createFixture()
    // 本用例验证逐字节复制，合成仓库固定 LF，避免本机全局 Git 配置改变输入。
    execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: fixture.repository })
    let application = await launch(fixture.data)
    try {
      let page = await configure(application, fixture.repository, { activate: true })
      await openRoleEditor(page)
      await page.getByRole('textbox', { name: '角色名称', exact: true }).fill('Claude 文件开发者')
      await page
        .getByRole('textbox', { name: '职责', exact: true })
        .fill('仅操作本次隔离目录，按提示读写文件，不使用网络、不提交或推送，完成后结束。')
      await goRoleStep(page, 1)
      await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption('claude')
      await goRoleStep(page, 3)
      await page
        .getByRole('combobox', { name: '工具权限', exact: true })
        .selectOption('workspace-write')
      await saveRoleEditor(page)
      const health = page.locator('.role-health').filter({ hasText: 'Claude 文件开发者' })
      await health.getByRole('button', { name: '真实试运行', exact: true }).click()
      await health
        .getByRole('button', { name: '启用角色', exact: true })
        .and(page.locator(':enabled'))
        .waitFor({ timeout: 120000 })
      await health.getByRole('button', { name: '启用角色', exact: true }).click()
      const configured = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.roleReadiness.length === 2 && state.roleReadiness.every((item) => item.enabled),
      })
      const codex = configured.roles.find((role) => role.cli === 'codex')!
      const claude = configured.roles.find((role) => role.cli === 'claude')!
      await page.getByRole('button', { name: '团队管理', exact: true }).click()
      await page.getByRole('textbox', { name: '团队名称', exact: true }).fill('双 CLI 文件团队')
      await page.getByRole('checkbox', { name: '测试开发者 · codex', exact: true }).check()
      await page.getByRole('checkbox', { name: 'Claude 文件开发者 · claude', exact: true }).check()
      await page.getByRole('button', { name: '创建团队', exact: true }).click()
      await page
        .getByRole('option', { name: '双 CLI 文件团队 · v1', exact: true })
        .waitFor({ state: 'attached' })
      await page.getByRole('button', { name: '任务管理', exact: true }).click()
      await page.getByRole('button', { name: '创建团队任务', exact: true }).click()
      await page.getByRole('textbox', { name: '团队任务名称', exact: true }).fill('跨 CLI 文件交接')
      await page
        .getByRole('textbox', { name: '团队目标', exact: true })
        .fill('已验收贡献进入下游工作树')
      await page
        .getByRole('textbox', { name: '团队验收条件', exact: true })
        .fill('随机内容一致，全部人工接受后完成')
      const tag = randomUUID()
      await fillStep(page, 0, {
        title: '上游文件',
        role: codex.id,
        goal: `Create a.txt containing exactly ${tag} followed by a newline. Only write this file, then finish. Do not use network or commit.`,
      })
      await page.getByRole('button', { name: '添加子任务', exact: true }).click()
      await fillStep(page, 1, {
        title: '下游文件',
        role: claude.id,
        goal: 'Read the actual a.txt in this working directory and copy its entire content to b.txt. Use Read and Write only. Do not guess content, scan the repository, use network or commit. Finish immediately after writing.',
      })
      await page
        .locator('.plan-step')
        .nth(1)
        .getByRole('checkbox', { name: '子任务 1', exact: true })
        .check()
      await page.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
      const upstream = await waitForSnapshot({
        page,
        timeout: 120000,
        predicate: (state) =>
          state.tasks.some((task) => task.title === '上游文件' && task.status === 'in_review'),
      })
      const parent = upstream.tasks.find((task) => task.title === '跨 CLI 文件交接')!
      const first = upstream.tasks.find((task) => task.title === '上游文件')!
      const second = upstream.tasks.find((task) => task.title === '下游文件')!
      const waiting = upstream.runs.find((run) => run.taskId === second.id)!
      assert.equal(waiting.status, 'queued')
      assert.equal(waiting.processState, 'not_started')
      assert.equal(waiting.waitingReason, 'dependency_acceptance')
      const firstRun = upstream.runs.find((run) => run.taskId === first.id)!
      const sourceFile = await readFile(join(firstRun.workDirectory, 'a.txt'))
      assert.deepEqual(sourceFile, Buffer.from(`${tag}\n`))
      const sourceDelivery = upstream.deliveries.find((item) => item.runId === firstRun.id)!
      await page.locator('.task-table button').filter({ hasText: '上游文件' }).click()
      await page.getByRole('button', { name: '验收通过', exact: true }).click()
      const downstream = await waitForSnapshot({
        page,
        timeout: 120000,
        predicate: (state) =>
          state.tasks.some((task) => task.id === second.id && task.status === 'in_review'),
      })
      const secondRun = downstream.runs.find((run) => run.taskId === second.id)!
      const actualInput = await readFile(join(secondRun.workDirectory, 'a.txt'))
      const actualOutput = await readFile(join(secondRun.workDirectory, 'b.txt'))
      assert.deepEqual(actualInput, sourceFile)
      assert.deepEqual(actualOutput, sourceFile)
      assert.deepEqual(secondRun.inputDeliveryIds, [sourceDelivery.id])
      assert.equal(downstream.tasks.find((task) => task.id === parent.id)?.status, 'in_review')
      await page.locator('.task-table button').filter({ hasText: '下游文件' }).click()
      await page.getByRole('button', { name: '验收通过', exact: true }).click()
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.tasks.find((task) => task.id === parent.id)?.status === 'done',
      })
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      const restored = await snapshot(page)
      assert.equal(restored.tasks.find((task) => task.id === parent.id)?.status, 'done')
      assert.ok(restored.runs.every((run) => run.processState === 'confirmed_ended'))
      assert.equal(restored.acceptances.length, 2)
      assert.deepEqual(restored.runs.find((run) => run.id === secondRun.id)?.inputDeliveryIds, [
        sourceDelivery.id,
      ])
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

const fillStep = async (
  page: Page,
  index: number,
  input: { title: string; role: string; goal: string },
) => {
  const step = page.locator('.plan-step').nth(index)
  await step.getByRole('textbox', { name: '子任务名称', exact: true }).fill(input.title)
  await step.getByRole('combobox', { name: '执行角色', exact: true }).selectOption(input.role)
  await step.getByRole('textbox', { name: '子任务目标', exact: true }).fill(input.goal)
  await step.getByRole('textbox', { name: '子任务验收条件', exact: true }).fill('实际文件内容一致')
}
