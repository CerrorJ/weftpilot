import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile, readFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

test(
  '真实项目卡片：错误保留/确切创建回执/键盘返回，项目内任务绑定确切项目',
  { timeout: 60000 },
  async () => {
    const first = await createFixture()
    const second = await createFixture()
    const application = await launch(first.data)
    try {
      const page = await configure(application, first.repository)
      await navigate(page, '项目管理')
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, second.repository)
      await page.getByRole('button', { name: '新建项目', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '新建项目', exact: true })
      const name = 'Project-'.repeat(24)
      await dialog.getByLabel('项目名称', { exact: true }).fill(name)
      await dialog.getByLabel('默认分支', { exact: true }).fill('missing-default')
      await dialog.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: 'GIT_BRANCH_INVALID' }).waitFor()
      assert.equal(await dialog.getByLabel('项目名称', { exact: true }).inputValue(), name)
      assert.equal((await snapshot(page)).projects.length, 1)
      await dialog.getByLabel('默认分支', { exact: true }).fill('main')
      await dialog.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await dialog.waitFor({ state: 'detached' })
      const state = await snapshot(page)
      const created = state.projects.find((project) => project.name === name)!
      assert.ok(created)
      assert.equal(created.repositoryPath, second.repository)
      const card = page.locator(`[data-project-id="${created.id}"] button`)
      await card.waitFor()
      await page.waitForFunction(
        (id) =>
          document.activeElement?.closest('[data-project-id]')?.getAttribute('data-project-id') ===
          id,
        created.id,
      )
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/project-catalog-wide-zh-light.png' })
      await page.keyboard.press('Enter')
      await page.getByRole('heading', { name, exact: true }).waitFor()
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/project-detail-long-wide-zh-light.png' })
      await page.getByText('工作区干净', { exact: true }).waitFor()
      assert.ok((await page.locator('.project-facts').innerText()).includes(second.repository))
      await page.getByRole('button', { name: '返回项目列表', exact: true }).click()
      await page.waitForFunction(
        (id) =>
          document.activeElement?.closest('[data-project-id]')?.getAttribute('data-project-id') ===
          id,
        created.id,
      )
      await card.click()
      await page.getByText('工作区干净', { exact: true }).waitFor()
      await page.getByRole('button', { name: '新建项目任务', exact: true }).click()
      const task = page.getByRole('dialog', { name: '创建任务', exact: true })
      assert.equal(await task.getByLabel('所属项目', { exact: true }).inputValue(), created.id)
      await task.getByLabel('任务名称', { exact: true }).fill('project-two-task')
      await task.getByLabel('任务目标', { exact: true }).fill('不执行模型，仅检查绑定。')
      await task.getByLabel('验收条件', { exact: true }).fill('项目ID与创建来源一致。')
      await task.getByRole('button', { name: '创建待执行任务', exact: true }).click()
      await page.getByRole('heading', { name: 'project-two-task', exact: true }).waitFor()
      const after = await snapshot(page)
      assert.equal(after.tasks[0]?.projectId, created.id)
      assert.equal(after.runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await first.cleanup()
      await second.cleanup()
    }
  },
)

test(
  '真实项目详情：脏仓库/分离HEAD/检查失败与重启，英文深色不翻译用户项目名',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const gitDirectory = join(fixture.repository, '.git')
    const savedGit = join(fixture.repository, '.git-owned-fixture-saved')
    let application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { projectName: '设置' })
      await navigate(page, '项目管理')
      await page.locator('.project-card-main').click()
      await page.getByText('工作区干净', { exact: true }).waitFor()
      const file = join(fixture.repository, 'existing-user-change.txt')
      await writeFile(file, 'retain existing bytes')
      execFileSync('git', ['checkout', '--detach'], { cwd: fixture.repository, stdio: 'ignore' })
      await page.getByRole('button', { name: '重新检查仓库', exact: true }).click()
      await page.getByText('有未提交改动', { exact: true }).waitFor()
      await page.getByText('分离 HEAD', { exact: true }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/project-detail-wide-zh-light.png' })
      await rename(gitDirectory, savedGit)
      await page.getByRole('button', { name: '重新检查仓库', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'GIT_ROOT_REQUIRED' }).waitFor()
      await page.getByText('尚未确认仓库状态', { exact: true }).waitFor()
      assert.equal(await page.getByText('工作区干净', { exact: true }).count(), 0)
      await rename(savedGit, gitDirectory)
      await page.getByRole('button', { name: '重新检查仓库', exact: true }).click()
      await page.getByText('有未提交改动', { exact: true }).waitFor()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await page.getByText('Uncommitted changes', { exact: true }).waitFor()
      await page.getByText('Detached HEAD', { exact: true }).waitFor()
      await page.getByRole('heading', { name: '设置', exact: true }).waitFor()
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/project-detail-narrow-en-dark.png' })
      await page.getByRole('button', { name: 'Back to projects', exact: true }).click()
      await page.screenshot({ path: '.tmp/evidence/project-catalog-narrow-en-dark.png' })
      assert.equal(await readFile(file, 'utf8'), 'retain existing bytes')
      await quit(application)
      application = await launch(fixture.data)
      const restored = await application.firstWindow()
      await navigate(restored, 'Projects')
      await restored.locator('.project-card-main').click()
      await restored.getByText('Uncommitted changes', { exact: true }).waitFor()
      await restored.getByText('Detached HEAD', { exact: true }).waitFor()
      assert.equal(await restored.locator('html').getAttribute('data-theme'), 'dark')
      assert.equal((await snapshot(restored)).runs.length, 0)
      await quit(application)
    } finally {
      if (existsSync(savedGit)) await rename(savedGit, gitDirectory)
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
