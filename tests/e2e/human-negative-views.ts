import assert from 'node:assert/strict'
import type { Page } from 'playwright'
import { navigate } from './navigation-helpers'
import { snapshot } from './workflow-helpers'

/** 拒绝/过期仍提醒失败，停止不再提醒；所有入口只读投影同一UUID。 */
export const assertNegativeViews = async (page: Page, taskIds: string[]) => {
  const before = await snapshot(page)
  await navigate(page, /^(工作台|Overview)$/)
  const attention = page.getByRole('region', { name: /^(待我处理|Needs my attention)$/ })
  for (const [index, taskId] of taskIds.entries()) {
    const card = attention.locator(`[data-home-task-id="${taskId}"]`)
    if (index === 2) assert.equal(await card.count(), 0)
    else {
      await card.waitFor()
      await card
        .locator('.task-status')
        .filter({ hasText: /^(执行失败|Execution failed)$/ })
        .waitFor()
    }
  }
  await navigate(page, /^(任务管理|Tasks)$/)
  await page.getByRole('button', { name: /^(全部任务|All tasks)$/, exact: true }).click()
  await page.getByRole('button', { name: /^(看板视图|Board view)$/, exact: true }).click()
  const ended = page.getByRole('region', { name: /^(已结束|Ended)$/, exact: true })
  for (const [index, taskId] of taskIds.entries()) {
    const card = ended.locator(`[data-task-id="${taskId}"]`)
    await card.waitFor()
    await card
      .locator('.task-status')
      .filter({
        hasText: index === 2 ? /^(已停止|Stopped)$/ : /^(执行失败|Execution failed)$/,
      })
      .waitFor()
    assert.equal(await page.locator(`.task-board [data-task-id="${taskId}"]`).count(), 1)
    assert.equal(await card.getByRole('progressbar').count(), 0)
  }
  await page.getByRole('button', { name: /^(列表视图|List view)$/, exact: true }).click()
  for (const [index, taskId] of taskIds.entries()) {
    const row = page.locator('.task-table tr').filter({
      has: page.locator(`[data-task-id="${taskId}"]`),
    })
    await row
      .locator('.task-status')
      .filter({
        hasText: index === 2 ? /^(已停止|Stopped)$/ : /^(执行失败|Execution failed)$/,
      })
      .waitFor()
  }
  assert.deepEqual(await snapshot(page), before)
}

/** 历史请求即使拿旧版本再次调用，也不能改变任何Run或验收。 */
export const assertOldDecisionsRejected = async (page: Page) => {
  const before = await snapshot(page)
  for (const request of before.humanRequests) {
    const code = await page.evaluate(async (human) => {
      try {
        await window.weftpilot!.workflow.resolveHuman({
          key: crypto.randomUUID(),
          input: {
            requestId: human.id,
            expectedVersion: 1,
            expectedDigest: human.digest,
            response: { decision: 'approved' },
          },
        })
        return 'UNEXPECTED_APPROVAL'
      } catch (error) {
        return error instanceof Error ? error.message : ''
      }
    }, request)
    assert.ok(
      code.includes(
        request.status === 'expired' ? 'HUMAN_REQUEST_EXPIRED' : 'HUMAN_REQUEST_NOT_PENDING',
      ),
    )
    assert.deepEqual(await snapshot(page), before)
  }
}
