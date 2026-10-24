import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import {
  launch,
  quit,
  configure,
  createTask,
  snapshot,
  waitForSnapshot,
  createFixture,
} from './workflow-helpers'
import { prepareDeliveryFixture } from './delivery-fixture'
import { openDeliveryReview, checkAcceptanceCriteria } from './delivery-helpers'
import { confirmPreflight } from './preflight-helpers'

test(
  '受控历史SQLite夹具+实际窗口：旧Run快照及旧交付只读，当前验收无自动通过',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    const application = await launch(fixture.data)
    try {
      const page = await application.firstWindow()
      await page.getByRole('button', { name: '任务管理', exact: true }).click()
      await page.locator(`[data-task-id="${fixture.taskId}"]`).click()
      const before = await snapshot(page)
      await page.locator(`[data-run-id="${fixture.firstId}"] > button`).click()
      const history = page.getByRole('dialog', { name: '执行记录快照', exact: true })
      await history.getByText(fixture.firstId, { exact: true }).waitFor()
      assert.ok((await history.innerText()).includes('固定历史角色 · v1'))
      await history.getByRole('button', { name: '查看交付与验收', exact: true }).click()
      const old = page.getByRole('dialog', { name: '交付与验收', exact: true })
      await old.getByText('第一版退回原因必须保留', { exact: true }).waitFor()
      assert.equal(await old.getByRole('button', { name: '验收通过', exact: true }).count(), 0)
      assert.equal(
        await old.getByRole('button', { name: '退回并保留原因', exact: true }).count(),
        0,
      )
      await page.keyboard.press('Escape')
      await old.waitFor({ state: 'hidden' })
      assert.equal(await history.isVisible(), true)
      await page.keyboard.press('Escape')
      await history.waitFor({ state: 'hidden' })
      assert.deepEqual(await snapshot(page), before)
      const dialog = await openDeliveryReview(page)
      assert.equal(
        await dialog.getByRole('button', { name: '验收通过', exact: true }).isDisabled(),
        true,
      )
      assert.equal(
        await dialog.getByRole('button', { name: '退回并保留原因', exact: true }).isDisabled(),
        true,
      )
      await dialog.getByRole('checkbox').first().check()
      assert.equal(
        await dialog.getByRole('button', { name: '验收通过', exact: true }).isDisabled(),
        true,
      )
      await dialog
        .getByRole('textbox', { name: '验收备注 / 退回原因', exact: true })
        .fill('只填表，不提交')
      await dialog.getByRole('button', { name: '关闭', exact: true }).last().click()
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '受控展示夹具+英文深色窗口：显式核对确切交付后验收，重启保留历史与退回原因',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareDeliveryFixture()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.getByRole('button', { name: 'Tasks', exact: true }).click()
      await page.locator(`[data-task-id="${fixture.taskId}"]`).click()
      await page.getByRole('button', { name: 'Review delivery', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Delivery & acceptance', exact: true })
      await dialog
        .getByText('CONTROLLED_DELIVERY_ONLY · 不代表真实CLI执行。', { exact: true })
        .waitFor()
      await checkAcceptanceCriteria(dialog)
      await dialog.getByRole('button', { name: 'Accept delivery', exact: true }).click()
      await dialog.waitFor({ state: 'hidden' })
      let state = await snapshot(page)
      assert.equal(state.tasks.find((task) => task.id === fixture.taskId)?.status, 'done')
      assert.equal(state.acceptances.length, 2)
      assert.equal(
        state.acceptances.find(
          (item) =>
            item.deliveryId === state.deliveries.find((item) => item.runId === fixture.firstId)?.id,
        )?.reason,
        '第一版退回原因必须保留',
      )
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.getByRole('button', { name: 'Tasks', exact: true }).click()
      await page.locator(`[data-task-id="${fixture.taskId}"]`).click()
      state = await snapshot(page)
      assert.equal(state.runs.filter((run) => run.taskId === fixture.taskId).length, 2)
      await page.getByRole('button', { name: 'View delivery & acceptance', exact: true }).click()
      const restored = page.getByRole('dialog', { name: 'Delivery & acceptance', exact: true })
      await restored.getByText(/^Accepted ·/).waitFor()
      await restored
        .getByText('This delivery was accepted. The record is retained as read only.', {
          exact: true,
        })
        .waitFor()
      assert.equal(
        await restored.getByRole('button', { name: 'Accept delivery', exact: true }).count(),
        0,
      )
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实Codex交付：退回后新Run保留旧快照，角色新版本不改写验收依据，明确核对后通过',
  { timeout: 240000, skip: process.env.WEFTPILOT_REAL_REVIEW !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      await createTask(
        page,
        'Respond exactly WEFTPILOT_REVIEW_REAL_OK. Do not modify files, run commands, use network, commit or push.',
        '真实交付验收',
        '交付包含 WEFTPILOT_REVIEW_REAL_OK\n没有代码差异，不提交、不推送',
      )
      const task = (await snapshot(page)).tasks.find((item) => item.title === '真实交付验收')!
      await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
      await confirmPreflight(page)
      const firstDialog = await openDeliveryReview(page)
      let state = await snapshot(page)
      const first = state.runs.find((run) => run.taskId === task.id)!
      const firstDelivery = state.deliveries.find((item) => item.runId === first.id)!
      assert.ok(firstDelivery.answer.includes('WEFTPILOT_REVIEW_REAL_OK'))
      assert.equal(firstDelivery.diff, '')
      assert.equal(firstDelivery.headCommit, first.baselineCommit)
      assert.equal(state.acceptances.length, 0)
      await firstDialog
        .getByRole('textbox', { name: '验收备注 / 退回原因', exact: true })
        .fill('真实退回：保留第一版以核对新执行')
      await firstDialog.getByRole('button', { name: '退回并保留原因', exact: true }).click()
      await firstDialog.waitFor({ state: 'hidden' })
      await page.getByRole('button', { name: '创建新 Run 重试', exact: true }).click()
      await confirmPreflight(page)
      state = await waitForSnapshot({
        page,
        timeout: 90000,
        predicate: (state) =>
          state.runs.some(
            (run) =>
              run.taskId === task.id && run.attempt === 2 && run.processState === 'confirmed_ended',
          ),
      })
      const second = state.runs.find((run) => run.taskId === task.id && run.attempt === 2)!
      assert.equal(second.status, 'succeeded')
      const secondDelivery = state.deliveries.find((item) => item.runId === second.id)!
      assert.ok(secondDelivery.answer.includes('WEFTPILOT_REVIEW_REAL_OK'))
      assert.equal(secondDelivery.diff, '')
      assert.equal(secondDelivery.headCommit, second.baselineCommit)
      assert.equal(second.feedbackSnapshot, '真实退回：保留第一版以核对新执行')
      await page.evaluate(
        async (roleId) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: roleId,
              expectedVersion: 1,
              name: '执行后新名称',
              responsibility: '新的配置只影响新Run',
              cli: 'codex',
              model: '',
              permission: 'read-only',
            },
          }),
        task.roleId,
      )
      const finalDialog = await openDeliveryReview(page)
      await checkAcceptanceCriteria(finalDialog)
      await finalDialog.getByRole('button', { name: '验收通过', exact: true }).click()
      await finalDialog.waitFor({ state: 'hidden' })
      state = await snapshot(page)
      assert.equal(state.tasks.find((item) => item.id === task.id)?.status, 'done')
      assert.equal(state.runs.find((run) => run.id === first.id)?.roleSnapshot.version, 1)
      assert.equal(state.runs.find((run) => run.id === second.id)?.roleSnapshot.version, 1)
      assert.equal(state.roles.filter((role) => role.id === task.roleId).at(-1)?.version, 2)
      assert.equal(state.acceptances.length, 2)
      await mkdir('.tmp/evidence', { recursive: true })
      await writeFile(
        `.tmp/evidence/task-review-real-assertions-${Date.now()}.json`,
        JSON.stringify(
          {
            taskId: task.id,
            first,
            second,
            deliveries: state.deliveries.filter((item) => item.taskId === task.id),
            acceptances: state.acceptances,
            latestRoleVersion: 2,
            taskStatus: 'done',
          },
          null,
          2,
        ),
        { flag: 'wx' },
      )
      assert.equal(
        execFileSync('git', ['status', '--porcelain=v1'], {
          cwd: fixture.repository,
          encoding: 'utf8',
        }).trim(),
        '',
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
