import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

const locales = [
  {
    english: false,
    language: '中文',
    tasks: '任务管理',
    title: '创建任务',
    name: '任务名称',
    goal: '任务目标',
    criteria: '验收条件',
    submit: '创建待执行任务',
    cancel: '取消',
    error: /请检查必填项/,
  },
  {
    english: true,
    language: '英文',
    tasks: 'Tasks',
    title: 'Create task',
    name: 'Task name',
    goal: 'Goal',
    criteria: 'Acceptance criteria',
    submit: 'Create task',
    cancel: 'Cancel',
    error: /Check required fields/,
  },
]

for (const locale of locales) {
  test(
    `真实任务输入拒绝：${locale.language}可读提示与弹窗输入保留`,
    { timeout: 45000 },
    async () => {
      const fixture = await createFixture()
      const application = await launch(fixture.data)
      try {
        const page = await configure(application, fixture.repository)
        if (locale.english) {
          await page.locator('.topbar .appearance-settings summary').click()
          await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
          await page.locator('.topbar .appearance-settings summary').click()
        }
        await navigate(page, locale.tasks)
        const title = locale.title
        await page.getByRole('button', { name: title, exact: true }).click()
        const dialog = page.getByRole('dialog', { name: title, exact: true })
        const name = dialog.getByRole('textbox', {
          name: locale.name,
          exact: true,
        })
        const goal = dialog.getByRole('textbox', {
          name: locale.goal,
          exact: true,
        })
        const criteria = dialog.getByRole('textbox', {
          name: locale.criteria,
          exact: true,
        })
        await name.fill('   ')
        await goal.fill('保留目标，不启动CLI。')
        await criteria.fill('拒绝时保留本次输入。')
        await dialog.getByRole('button', { name: locale.submit, exact: true }).click()
        const alert = dialog.getByRole('alert')
        await alert.filter({ hasText: 'INPUT_INVALID' }).waitFor()
        assert.equal(
          await alert.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return (
              document.activeElement === element && bounds.top >= 0 && bounds.bottom <= innerHeight
            )
          }),
          true,
        )
        assert.match(await alert.innerText(), locale.error)
        assert.doesNotMatch(await alert.innerText(), /Error invoking|too_small|Zod|workflow:/)
        assert.equal(await name.inputValue(), '   ')
        assert.equal(await goal.inputValue(), '保留目标，不启动CLI。')
        assert.equal(await criteria.inputValue(), '拒绝时保留本次输入。')
        assert.equal((await snapshot(page)).tasks.length, 0)
        assert.equal((await snapshot(page)).runs.length, 0)
        await dialog.getByRole('button', { name: locale.cancel, exact: true }).click()
        await dialog.waitFor({ state: 'detached' })
        await page.getByRole('button', { name: title, exact: true }).click()
        await dialog.waitFor()
        assert.equal(await dialog.getByRole('alert').count(), 0, '新表单不能带入上次提交错误')
        await dialog.getByRole('button', { name: locale.cancel, exact: true }).click()
        await quit(application)
      } finally {
        await application.close().catch(() => undefined)
        await fixture.cleanup()
      }
    },
  )
}
