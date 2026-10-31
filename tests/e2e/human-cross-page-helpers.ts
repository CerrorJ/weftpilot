import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import type { Page } from 'playwright'
import { navigate, openHumanPage } from './navigation-helpers'
import { snapshot } from './workflow-helpers'

type Phase = 'pending' | 'review' | 'accepted'
type PhaseOptions = { page: Page; taskId: string; phase: Phase; cli: string }
const statusLabels = {
  pending: /^(等待澄清|Waiting for clarification)$/,
  review: /^(待验收|Awaiting review)$/,
  accepted: /^(已验收|Accepted)$/,
}
const columnLabels = {
  pending: /^(执行与待处理|Execution & attention)$/,
  review: /^(待验收|Awaiting review)$/,
  accepted: /^(已结束|Ended)$/,
}

/** 只浏览真实CLI产生的稳定阶段；各入口必须投影同一任务，浏览不能产生决定或新Run。 */
export const assertHumanCrossPagePhase = async (options: PhaseOptions): Promise<void> => {
  const { page, taskId, phase, cli } = options
  const before = await snapshot(page)
  const task = before.tasks.find((item) => item.id === taskId)!
  const attention = phase !== 'accepted'
  await navigate(page, /^(工作台|Overview)$/)
  const panel = page.getByRole('region', { name: /^(待我处理|Needs my attention)$/ })
  const homeCard = panel.locator(`[data-home-task-id="${taskId}"]`)
  if (attention) {
    await homeCard.waitFor()
    await homeCard.locator('.task-status').filter({ hasText: statusLabels[phase] }).waitFor()
    await homeCard.getByRole('button').click()
    const drawer = page.getByRole('complementary', { name: /^(任务详情|Task details)$/ })
    await drawer.getByRole('heading', { name: task.title, exact: true }).waitFor()
    await drawer.getByRole('button', { name: /^(关闭详情|Close details)$/, exact: true }).click()
    await navigate(page, /^(工作台|Overview)$/)
  } else assert.equal(await homeCard.count(), 0)
  await capture(page, `${cli}-${phase}-home`)
  await navigate(page, /^(任务管理|Tasks)$/)
  await page.getByRole('button', { name: /^(全部任务|All tasks)$/, exact: true }).click()
  await page.getByRole('button', { name: /^(看板视图|Board view)$/, exact: true }).click()
  const column = page.getByRole('region', { name: columnLabels[phase], exact: true })
  const boardCard = column.locator(`[data-task-id="${taskId}"]`)
  await boardCard.waitFor()
  assert.equal(await page.locator(`.task-board [data-task-id="${taskId}"]`).count(), 1)
  await boardCard.locator('.task-status').filter({ hasText: statusLabels[phase] }).waitFor()
  assert.equal(await boardCard.getByRole('progressbar').count(), 0)
  await capture(page, `${cli}-${phase}-board`)
  await page.getByRole('button', { name: /^(列表视图|List view)$/, exact: true }).click()
  await page
    .locator('.task-table tr')
    .filter({ has: page.locator(`[data-task-id="${taskId}"]`) })
    .locator('.task-status')
    .filter({ hasText: statusLabels[phase] })
    .waitFor()
  await assertRequestHistory(options)
  assert.deepEqual(await snapshot(page), before, '跨页浏览不得写入业务状态、验收或重试')
}

const assertRequestHistory = async ({ page, taskId, phase }: PhaseOptions): Promise<void> => {
  await openHumanPage(page)
  const state = await snapshot(page)
  const title = state.tasks.find((task) => task.id === taskId)!.title
  const request = state.humanRequests.find((item) => item.taskId === taskId)!
  const card = page.getByRole('article').filter({ hasText: title })
  if (phase === 'pending') {
    await card
      .getByRole('combobox', { name: /^(选择回答|Choose an answer)$/, exact: true })
      .waitFor()
    return
  }
  assert.equal(await card.count(), 0, '已回答的请求不能继续混入待处理')
  const history = page.getByRole('checkbox', {
    name: /^(包含已处理记录|Include resolved requests)$/,
    exact: true,
  })
  await history.check()
  await card
    .locator('.badge')
    .filter({ hasText: new RegExp(`^(已回答|Answered) · v${request.version}$`) })
    .waitFor()
  assert.equal(await card.getByRole('button').count(), 0, '历史回答不能再次决定')
  await history.uncheck()
}

const capture = async (page: Page, name: string): Promise<void> => {
  await mkdir('.tmp/evidence', { recursive: true })
  await page.screenshot({ path: `.tmp/evidence/human-cross-${name}.png` })
}
