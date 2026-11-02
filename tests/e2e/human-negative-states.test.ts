import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import { prepareHumanStateFixture } from './human-state-fixture'
import { launch, quit, snapshot, waitForSnapshot } from './workflow-helpers'
import { openHumanPage, navigate } from './navigation-helpers'
import { assertNegativeViews, assertOldDecisionsRejected } from './human-negative-views'

test(
  '受控等待态+实际窗口：带原因拒绝、真实时钟到期拒绝、停止撤销及重启历史',
  { timeout: 150000 },
  async () => {
    const fixture = await prepareHumanStateFixture()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      await openHumanPage(page)
      const initial = await snapshot(page)
      assert.deepEqual(initial, fixture.state)
      const expiring = initial.humanRequests.find((item) => item.taskId === fixture.tasks[0])!
      const rejecting = initial.humanRequests.find((item) => item.taskId === fixture.tasks[1])!
      const cancelling = initial.humanRequests.find((item) => item.taskId === fixture.tasks[2])!
      const plan = page.getByRole('article', { name: '方案确认', exact: true })
      const reject = plan.getByRole('button', { name: '拒绝并结束本次执行', exact: true })
      assert.equal(await reject.isDisabled(), true)
      await plan.getByRole('textbox', { name: '拒绝原因', exact: true }).fill('   ')
      assert.equal(await reject.isDisabled(), true)
      assert.deepEqual(await snapshot(page), initial)
      const reason = '受控验收拒绝原因；保留，不应自动继续。'
      await plan.getByRole('textbox', { name: '拒绝原因', exact: true }).fill(reason)
      await reject.click()
      const rejected = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.humanRequests.find((item) => item.id === rejecting.id)?.status === 'rejected',
      })
      assert.equal(
        rejected.humanRequests.find((item) => item.id === rejecting.id)?.resolutionReason,
        reason,
      )
      assert.equal(
        rejected.runs.find((item) => item.id === rejecting.runId)?.failureCode,
        'HUMAN_REQUEST_REJECTED',
      )
      await navigate(page, '任务管理')
      await page.getByRole('button', { name: '全部任务', exact: true }).click()
      await page.locator(`.task-table [data-task-id="${cancelling.taskId}"]`).click()
      await page.getByRole('button', { name: '结束等待并停止', exact: true }).click()
      const cancelled = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.humanRequests.find((item) => item.id === cancelling.id)?.status === 'cancelled',
      })
      assert.equal(
        cancelled.runs.find((item) => item.id === cancelling.runId)?.processState,
        'confirmed_ended',
      )
      assert.equal(cancelled.runs.find((item) => item.id === cancelling.runId)?.status, 'stopped')
      await page.getByRole('button', { name: '关闭详情', exact: true }).click()
      await openHumanPage(page)
      const operation = page.getByRole('article', { name: '单次操作审批', exact: true })
      // 等待协议允许的真实60秒期限，不改数据库时间或应用时钟。
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, Date.parse(expiring.expiresAt) - Date.now() + 100)),
      )
      await operation.getByRole('button', { name: '批准本次操作并继续', exact: true }).click()
      const expired = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.humanRequests.find((item) => item.id === expiring.id)?.status === 'expired',
      })
      assert.equal(
        expired.runs.find((item) => item.id === expiring.runId)?.failureCode,
        'HUMAN_REQUEST_EXPIRED',
      )
      assert.equal(expired.runs.length, initial.runs.length)
      assert.deepEqual(expired.deliveries, initial.deliveries)
      assert.equal(
        expired.deliveries.some((delivery) =>
          initial.humanRequests.some((request) => request.runId === delivery.runId),
        ),
        false,
      )
      assert.equal(expired.acceptances.length, 0)
      for (const before of initial.runs) {
        const after = expired.runs.find((item) => item.id === before.id)!
        assert.deepEqual(after.roleSnapshot, before.roleSnapshot)
        assert.equal(after.attempt, 1)
        assert.equal(after.processState, 'confirmed_ended')
      }
      await assertOldDecisionsRejected(page)
      await assertNegativeViews(page, fixture.tasks)
      await openHumanPage(page)
      await page.getByRole('checkbox', { name: '包含已处理记录', exact: true }).check()
      const history = page.getByRole('article', { name: '方案确认', exact: true })
      await history.getByText(reason, { exact: true }).waitFor()
      assert.equal(await page.locator('.human-request button').count(), 0)
      await mkdir('.tmp/evidence', { recursive: true })
      await history.scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/human-negative-zh-light.png' })
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      assert.deepEqual(await snapshot(page), expired)
      await openHumanPage(page)
      assert.equal(await page.getByRole('article').count(), 0)
      await page.getByRole('checkbox', { name: '包含已处理记录', exact: true }).check()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.setViewportSize({ width: 700, height: 820 })
      for (const label of ['Rejected', 'Expired', 'Cancelled'])
        await page
          .locator('.human-request .badge')
          .filter({ hasText: new RegExp(`^${label} · v2$`) })
          .waitFor()
      assert.equal(await page.locator('.human-request button').count(), 0)
      assert.deepEqual(await snapshot(page), expired)
      await page.keyboard.press('Escape')
      await page.getByRole('article', { name: 'Plan review', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/human-negative-en-dark-700.png' })
      await assertNegativeViews(page, fixture.tasks)
      await writeFile(
        '.tmp/evidence/human-negative-result.json',
        JSON.stringify({ initial, expired }, null, 2),
      )
      await quit(application)
    } catch (error) {
      const page = await application.firstWindow().catch(() => undefined)
      await mkdir('.tmp/evidence', { recursive: true })
      await writeFile(
        `.tmp/evidence/human-negative-failure-${Date.now()}.json`,
        JSON.stringify({ state: page ? await snapshot(page).catch(() => undefined) : undefined }),
      )
      throw error
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
