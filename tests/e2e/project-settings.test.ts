import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import type { Page } from 'playwright'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'
import { waitTeamCard } from './team-helpers'

test(
  '项目设置：真实创建、严格团队ID、CAS草稿、明确清空及重启；中英文与明暗主题',
  { timeout: 60000 },
  async () => {
    const first = await createFixture()
    const second = await createFixture()
    let application = await launch(first.data)
    try {
      let page = await configure(application, first.repository)
      const team = await seedTeam(page)
      await navigate(page, '项目管理')
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, second.repository)
      await page.getByRole('button', { name: '新建项目', exact: true }).click()
      const create = page.getByRole('dialog', { name: '新建项目', exact: true })
      await create.getByLabel('项目名称', { exact: true }).fill('项目上下文')
      await create.getByLabel('项目目标', { exact: true }).fill('literal Project goal 项目目标')
      await create.getByLabel('项目描述', { exact: true }).fill('职责\n这里是用户原文')
      await create.getByLabel('默认团队', { exact: true }).selectOption(team.id)
      await create.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await create.waitFor({ state: 'detached' })
      const project = (await snapshot(page)).projects.find((item) => item.name === '项目上下文')!
      assert.equal(project.goal, 'literal Project goal 项目目标')
      assert.equal(project.description, '职责\n这里是用户原文')
      assert.equal(project.defaultTeamId, team.id)
      await page.locator(`[data-project-id="${project.id}"] button`).click()
      await page.getByRole('heading', { name: '项目上下文', exact: true }).waitFor()
      await page
        .getByRole('region', { name: '项目团队', exact: true })
        .getByRole('heading', { name: team.name, exact: true })
        .waitFor()
      await page.getByRole('button', { name: '项目设置', exact: true }).click()
      const editor = page.getByRole('dialog', { name: '项目设置', exact: true })
      const select = editor.getByLabel('默认团队', { exact: true })
      for (const value of ['   ', ` ${team.id} `, crypto.randomUUID()]) {
        const before = await snapshot(page)
        await select.evaluate((element, value) => {
          const target = element as HTMLSelectElement
          target.add(new Option('非法或不存在的团队', value))
          target.value = value
        }, value)
        await editor.getByRole('button', { name: '保存项目设置', exact: true }).click()
        await editor.getByRole('alert').waitFor()
        assert.equal(await select.inputValue(), value)
        assert.deepEqual(await snapshot(page), before)
        await select.selectOption(team.id)
      }
      await editor.getByLabel('项目目标', { exact: true }).fill('未提交草稿')
      await page.evaluate(
        async (project) =>
          window.weftpilot!.workflow.configureProject({
            key: crypto.randomUUID(),
            input: {
              projectId: project.id,
              expectedVersion: project.version,
              name: project.name,
              goal: '外部新目标',
              description: project.description ?? '',
              defaultTeamId: project.defaultTeamId ?? null,
            },
          }),
        project,
      )
      await page.locator('.project-goal').getByText('外部新目标', { exact: true }).waitFor()
      assert.equal(await editor.getByLabel('项目目标', { exact: true }).inputValue(), '未提交草稿')
      await editor.getByRole('button', { name: '保存项目设置', exact: true }).click()
      await editor.getByRole('alert').filter({ hasText: '数据已变化' }).waitFor()
      assert.equal(await editor.getByLabel('项目目标', { exact: true }).inputValue(), '未提交草稿')
      await page.keyboard.press('Escape')
      await editor.waitFor({ state: 'detached' })
      await page.getByRole('button', { name: '项目设置', exact: true }).click()
      assert.equal(await editor.getByLabel('项目目标', { exact: true }).inputValue(), '外部新目标')
      await editor.getByLabel('项目目标', { exact: true }).fill('最终项目目标')
      await editor.getByRole('button', { name: '保存项目设置', exact: true }).click()
      await editor.waitFor({ state: 'detached' })
      await mkdir('.tmp/evidence', { recursive: true })
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.locator('.project-repository').getByText('工作区干净', { exact: true }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/project-settings-zh-light.png' })
      const saved = (await snapshot(page)).projects.find((item) => item.id === project.id)!
      assert.equal(saved.version, 3)
      assert.equal(saved.repositoryPath, second.repository)
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await page.getByRole('button', { name: 'Project settings', exact: true }).click()
      const english = page.getByRole('dialog', { name: 'Project settings', exact: true })
      assert.equal(
        await english.getByLabel('Project description', { exact: true }).inputValue(),
        '职责\n这里是用户原文',
      )
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/project-settings-en-dark-700.png' })
      await english.getByLabel('Project goal', { exact: true }).fill('')
      await english.getByLabel('Project description', { exact: true }).fill('')
      await english.getByLabel('Default team', { exact: true }).selectOption('')
      await english.getByRole('button', { name: 'Save project settings', exact: true }).click()
      await english.waitFor({ state: 'detached' })
      const cleared = (await snapshot(page)).projects.find((item) => item.id === project.id)!
      assert.equal(cleared.goal, '')
      assert.equal(cleared.description, '')
      assert.equal(cleared.defaultTeamId, null)
      assert.equal((await snapshot(page)).runs.length, 0)
      assert.equal((await snapshot(page)).tasks.length, 0)
      await quit(application)
      application = await launch(first.data)
      page = await application.firstWindow()
      assert.deepEqual(
        (await snapshot(page)).projects.find((item) => item.id === project.id),
        cleared,
      )
    } finally {
      await quit(application)
      await first.cleanup()
      await second.cleanup()
    }
  },
)

test(
  '项目默认团队计划：固定打开版本、后台更新不清草稿、项目及团队CAS冲突、快照与键盘返回',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const team = await seedTeam(page)
      const project = (await snapshot(page)).projects[0]!
      await page.evaluate(
        async ({ project, team }) =>
          window.weftpilot!.workflow.configureProject({
            key: crypto.randomUUID(),
            input: {
              projectId: project.id,
              expectedVersion: project.version,
              name: project.name,
              goal: '默认团队目标',
              description: '',
              defaultTeamId: team.id,
            },
          }),
        { project, team },
      )
      await navigate(page, '项目管理')
      await page.locator(`[data-project-id="${project.id}"] button`).click()
      const open = page.getByRole('button', { name: '创建团队任务', exact: true })
      await open.click()
      const dialog = page.getByRole('dialog', { name: '创建团队任务', exact: true })
      assert.equal(await dialog.getByLabel('所属项目', { exact: true }).isDisabled(), true)
      assert.equal(await dialog.getByLabel('执行团队', { exact: true }).inputValue(), team.id)
      await fillPlan(page, '旧版团队草稿')
      await page.evaluate(
        async (team) =>
          window.weftpilot!.workflow.saveTeam({
            key: crypto.randomUUID(),
            input: {
              id: team.id,
              expectedVersion: 1,
              name: '新团队版本',
              coordinatorRoleId: team.coordinatorRoleId,
              roleIds: team.roleIds,
            },
          }),
        team,
      )
      await page.locator('.project-team h3').filter({ hasText: '新团队版本' }).waitFor()
      assert.equal(
        await dialog.getByLabel('团队任务名称', { exact: true }).inputValue(),
        '旧版团队草稿',
      )
      assert.equal(
        await dialog.getByLabel('执行团队', { exact: true }).locator('option:checked').innerText(),
        `${team.name} · v1`,
      )
      await dialog.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: '数据已变化' }).waitFor()
      assert.equal((await snapshot(page)).tasks.length, 0)
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      assert.equal(await open.evaluate((element) => document.activeElement === element), true)
      await open.click()
      await fillPlan(page, '项目版本冲突草稿')
      const base = (await snapshot(page)).projects[0]!
      await page.evaluate(
        async (project) =>
          window.weftpilot!.workflow.configureProject({
            key: crypto.randomUUID(),
            input: {
              projectId: project.id,
              expectedVersion: project.version,
              name: project.name,
              goal: '新项目目标',
              description: '',
              defaultTeamId: project.defaultTeamId ?? null,
            },
          }),
        base,
      )
      await page.locator('.project-goal').getByText('新项目目标', { exact: true }).waitFor()
      await dialog.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: '数据已变化' }).waitFor()
      assert.equal((await snapshot(page)).tasks.length, 0)
      assert.equal(
        await dialog.getByLabel('团队任务名称', { exact: true }).inputValue(),
        '项目版本冲突草稿',
      )
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      await open.click()
      await fillPlan(page, '解除关联时保留草稿')
      await setProjectTeam(page, null)
      await page.locator('.project-team .empty-state').waitFor()
      assert.equal(await dialog.isVisible(), true)
      assert.equal(
        await dialog.getByLabel('团队任务名称', { exact: true }).inputValue(),
        '解除关联时保留草稿',
      )
      assert.equal(await dialog.getByLabel('执行团队', { exact: true }).inputValue(), team.id)
      await dialog.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: '数据已变化' }).waitFor()
      assert.equal((await snapshot(page)).tasks.length, 0)
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      assert.equal(
        await page
          .locator('.project-team')
          .evaluate((element) => document.activeElement === element),
        true,
      )
      await setProjectTeam(page, team.id)
      await open.waitFor()
      await open.click()
      await fillPlan(page, '固定新团队计划')
      await dialog.getByRole('button', { name: '保存团队计划', exact: true }).click()
      await page.getByRole('heading', { name: '固定新团队计划', exact: true }).waitFor()
      const result = await snapshot(page)
      const parent = result.tasks.find((item) => item.title === '固定新团队计划')!
      assert.equal(parent.projectId, project.id)
      assert.equal(parent.teamSnapshot?.version, 2)
      assert.equal(result.tasks.length, 2)
      assert.equal(result.runs.length, 0)
    } finally {
      await quit(application)
      await fixture.cleanup()
    }
  },
)

const seedTeam = async (page: Page) => {
  const role = (await snapshot(page)).roles[0]!
  await page.evaluate(
    async (roleId) =>
      window.weftpilot!.workflow.saveTeam({
        key: crypto.randomUUID(),
        input: {
          expectedVersion: 0,
          name: '项目开发团队',
          coordinatorRoleId: roleId,
          roleIds: [roleId],
        },
      }),
    role.id,
  )
  await navigate(page, '团队管理')
  await waitTeamCard(page, '项目开发团队', 1)
  return (await snapshot(page)).teams.at(-1)!
}

const setProjectTeam = async (page: Page, defaultTeamId: string | null) => {
  const project = (await snapshot(page)).projects[0]!
  await page.evaluate(
    async ({ project, defaultTeamId }) =>
      window.weftpilot!.workflow.configureProject({
        key: crypto.randomUUID(),
        input: {
          projectId: project.id,
          expectedVersion: project.version,
          name: project.name,
          goal: project.goal ?? '',
          description: project.description ?? '',
          defaultTeamId,
        },
      }),
    { project, defaultTeamId },
  )
}

const fillPlan = async (page: Page, title: string) => {
  const dialog = page.getByRole('dialog', { name: '创建团队任务', exact: true })
  await dialog.getByLabel('团队任务名称', { exact: true }).fill(title)
  await dialog.getByLabel('团队目标', { exact: true }).fill('真实团队计划')
  await dialog.getByLabel('团队验收条件', { exact: true }).fill('人工核验')
  await dialog.getByLabel('子任务名称', { exact: true }).fill('第一步')
  await dialog.getByLabel('子任务目标', { exact: true }).fill('执行前人工检查')
  await dialog.getByLabel('子任务验收条件', { exact: true }).fill('检查真实产物')
}
