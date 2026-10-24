import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, createTask, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test(
  '真实任务筛选与回执选择：外部新增不抢详情，筛选关闭不抢焦点，筛选中创建打开确切对象',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await createTask(page, '不启动CLI，只检查列表选择。', '正在查看的任务')
      const original = await snapshot(page)
      const task = original.tasks[0]!
      // 经过正式白名单IPC创建另一条真实任务，模拟其他渠道入站，不伪造快照或执行成功。
      await page.evaluate(
        async (task) =>
          window.weftpilot!.workflow.createTask({
            key: crypto.randomUUID(),
            input: {
              projectId: task.projectId,
              roleId: task.roleId!,
              title: '另一渠道新增',
              goal: '不启动CLI',
              acceptanceCriteria: '保持当前详情',
            },
          }),
        task,
      )
      await page.locator('.task-title').filter({ hasText: '另一渠道新增' }).waitFor()
      assert.equal(await page.locator('.task-drawer h2').first().innerText(), '正在查看的任务')
      const running = page.getByRole('button', { name: '执行中', exact: true })
      await running.click()
      await page.locator('.task-drawer').waitFor({ state: 'detached' })
      assert.equal(await running.evaluate((element) => element === document.activeElement), true)
      assert.equal(await page.locator('.task-table tbody tr').count(), 0)
      await page.getByRole('button', { name: '待处理', exact: true }).click()
      await page.getByRole('heading', { name: '人工请求', exact: true }).waitFor()
      assert.equal(await page.locator('.task-table tbody tr').count(), 0)
      await page.getByRole('button', { name: '已完成', exact: true }).click()
      assert.equal(await page.locator('.task-table tbody tr').count(), 0)
      await page.getByRole('searchbox', { name: '搜索任务', exact: true }).fill('不存在')
      await createTask(page, '创建回执决定选择，不推断快照最后一条。', '筛选后创建')
      await page.getByRole('heading', { name: '筛选后创建', exact: true }).waitFor()
      assert.equal(
        await page
          .getByRole('button', { name: '全部任务', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
      assert.equal(
        await page.getByRole('searchbox', { name: '搜索任务', exact: true }).inputValue(),
        '',
      )
      assert.equal(await page.locator('.task-table tbody tr').count(), 3)
      assert.equal((await snapshot(page)).runs.length, 0)
      await page.keyboard.press('Escape')
      await navigate(page, '工作台')
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
