import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { openTeamEditor, waitTeamCard } from './team-helpers'
import { waitRoleCard } from './role-helpers'
import { navigate } from './navigation-helpers'

test(
  '成员连续选择保留每次勾选：12人上限、负责人强制加入后超限、明确移除与真实保存集合',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const initial = (await snapshot(page)).roles[0]!
      await page.evaluate(async () => {
        for (let index = 1; index <= 12; index++)
          await window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              expectedVersion: 0,
              name: `边界角色 ${index}`,
              responsibility: '仅验证成员选择，不运行CLI',
              cli: 'codex',
              model: '',
              permission: 'read-only',
              skills: [],
            },
          })
      })
      await waitRoleCard(page, '边界角色 12', 1)
      const state = await snapshot(page)
      const selected = state.roles.filter((role) => /^边界角色 (?:[1-9]|10|11)$/.test(role.name))
      const nextLead = state.roles.find((role) => role.name === '边界角色 12')!
      assert.equal(selected.length, 11)
      const editor = await openTeamEditor(page)
      await editor.getByLabel('团队名称', { exact: true }).fill('12人真实团队')
      for (let index = 1; index <= 11; index++)
        await editor
          .getByRole('checkbox', { name: `边界角色 ${index} · codex`, exact: true })
          .check()
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll('dialog[open] input[name="roles"]')].filter(
            (element) => (element as HTMLInputElement).checked,
          ).length === 12,
      )
      for (let index = 1; index <= 11; index++)
        assert.equal(
          await editor
            .getByRole('checkbox', { name: `边界角色 ${index} · codex`, exact: true })
            .isChecked(),
          true,
        )
      assert.equal(
        await editor
          .getByRole('checkbox', { name: '边界角色 12 · codex', exact: true })
          .isDisabled(),
        true,
      )
      await editor.getByLabel('团队负责人', { exact: true }).selectOption(nextLead.id)
      await editor.getByRole('alert').filter({ hasText: '最多选择12名成员' }).waitFor()
      assert.equal(
        await editor.getByRole('button', { name: '创建团队', exact: true }).isDisabled(),
        true,
      )
      assert.equal(
        await editor
          .getByRole('checkbox', { name: '边界角色 12 · codex', exact: true })
          .isChecked(),
        true,
      )
      await editor.getByRole('checkbox', { name: `${initial.name} · codex`, exact: true }).uncheck()
      await editor.getByRole('button', { name: '创建团队', exact: true }).click()
      await editor.waitFor({ state: 'detached' })
      const team = (await snapshot(page)).teams[0]!
      assert.equal(team.roleIds.length, 12)
      assert.equal(team.coordinatorRoleId, nextLead.id)
      assert.deepEqual(
        [...team.roleIds].sort(),
        [nextLead.id, ...selected.map((role) => role.id)].sort(),
      )
      assert.equal((await snapshot(page)).runs.length, 0)
      assert.equal(
        (await snapshot(page)).roleReadiness.some((role) => role.enabled),
        false,
      )
    } finally {
      await quit(application)
      await fixture.cleanup()
    }
  },
)

test(
  '真实团队目录：负责人/成员、严格UUID与唯一名称、说明版本/CAS保稿、历史只读及重启',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    try {
      let page = await configure(application, fixture.repository)
      const firstRole = (await snapshot(page)).roles[0]!
      await page.evaluate(async () =>
        window.weftpilot!.workflow.saveRole({
          key: crypto.randomUUID(),
          input: {
            expectedVersion: 0,
            name: '评审角色',
            responsibility: '只作团队配置检查，不启动模型',
            cli: 'claude',
            model: '',
            permission: 'read-only',
            skills: [],
          },
        }),
      )
      await waitRoleCard(page, '评审角色', 1)
      const secondRole = (await snapshot(page)).roles.find((role) => role.cli === 'claude')!
      const editor = await openTeamEditor(page)
      await editor.getByLabel('团队名称', { exact: true }).fill('Review Team')
      await editor.getByLabel('团队说明', { exact: true }).fill('职责\n中文上下文与原始名称')
      const lead = editor.getByLabel('团队负责人', { exact: true })
      assert.equal(await lead.inputValue(), firstRole.id)
      assert.equal(
        await editor
          .getByRole('checkbox', { name: '测试开发者 · codex', exact: true })
          .isDisabled(),
        true,
      )
      for (const value of ['   ', ` ${firstRole.id} `, crypto.randomUUID()]) {
        const before = await snapshot(page)
        await lead.evaluate((element, value) => {
          const select = element as HTMLSelectElement
          select.add(new Option('非法或缺失角色', value))
        }, value)
        await lead.selectOption(value)
        await editor.getByRole('button', { name: '创建团队', exact: true }).click()
        await editor.getByRole('alert').waitFor()
        assert.deepEqual(await snapshot(page), before)
        assert.equal(
          await editor.getByLabel('团队说明', { exact: true }).inputValue(),
          '职责\n中文上下文与原始名称',
        )
        await lead.selectOption(firstRole.id)
        const unavailable = editor.locator(`input[name="roles"][value="${value}"]`)
        await unavailable.click()
        await unavailable.waitFor({ state: 'detached' })
      }
      await lead.selectOption(secondRole.id)
      await editor.getByRole('checkbox', { name: '测试开发者 · codex', exact: true }).uncheck()
      assert.equal(
        await editor.getByRole('checkbox', { name: '评审角色 · claude', exact: true }).isChecked(),
        true,
      )
      await editor.getByRole('button', { name: '创建团队', exact: true }).click()
      await editor.waitFor({ state: 'detached' })
      const original = (await snapshot(page)).teams[0]!
      assert.deepEqual(original.roleIds, [secondRole.id])
      assert.equal(original.coordinatorRoleId, secondRole.id)
      const card = await waitTeamCard(page, original.name, 1)
      await page.waitForFunction(
        (id) =>
          document.activeElement?.closest('[data-team-id]')?.getAttribute('data-team-id') === id,
        original.id,
      )
      await card.getByText('负责人', { exact: true }).waitFor()
      const duplicate = await openTeamEditor(page)
      await duplicate.getByLabel('团队名称', { exact: true }).fill('Ｒｅｖｉｅｗ　Ｔｅａｍ')
      await duplicate.getByLabel('团队说明', { exact: true }).fill('冲突时保留')
      await duplicate.getByRole('button', { name: '创建团队', exact: true }).click()
      await duplicate.getByRole('alert').filter({ hasText: '团队名称已被其他团队使用' }).waitFor()
      assert.equal((await snapshot(page)).teams.length, 1)
      assert.equal(
        await duplicate.getByLabel('团队说明', { exact: true }).inputValue(),
        '冲突时保留',
      )
      await duplicate.getByLabel('团队名称', { exact: true }).fill('第二团队')
      await duplicate.getByRole('button', { name: '创建团队', exact: true }).click()
      await duplicate.waitFor({ state: 'detached' })
      await waitTeamCard(page, '第二团队', 1)
      const initial = await snapshot(page)
      await page.evaluate(
        async ({ team, projectId }) => {
          await window.weftpilot!.workflow.createTeamTask({
            key: crypto.randomUUID(),
            input: {
              teamId: team.id,
              expectedTeamVersion: team.version,
              projectId,
              title: '团队旧版计划',
              goal: '只保存计划',
              acceptanceCriteria: '人工核验',
              steps: [
                {
                  key: 'one',
                  roleId: team.coordinatorRoleId,
                  title: '旧成员步骤',
                  goal: '待执行',
                  acceptanceCriteria: '真实交付后验收',
                  dependsOn: [],
                },
              ],
            },
          })
        },
        { team: original, projectId: initial.projects[0]!.id },
      )
      const plan = (await snapshot(page)).tasks.find((task) => task.purpose === 'team_parent')!
      await card.getByRole('button', { name: '查看团队', exact: true }).click()
      const detail = page.getByRole('dialog', { name: '团队详情', exact: true })
      assert.equal(await detail.locator('.preserve-text').innerText(), original.description)
      await detail.getByRole('button', { name: '编辑当前版本', exact: true }).click()
      const edit = page.getByRole('dialog', { name: '编辑团队', exact: true })
      await edit.getByLabel('团队说明', { exact: true }).fill('未提交的说明草稿')
      await page.evaluate(
        async (team) =>
          window.weftpilot!.workflow.saveTeam({
            key: crypto.randomUUID(),
            input: {
              id: team.id,
              expectedVersion: team.version,
              name: '外部团队名',
              description: '来自另一渠道',
              roleIds: team.roleIds,
              coordinatorRoleId: team.coordinatorRoleId,
            },
          }),
        original,
      )
      await page
        .locator(`[data-team-id="${original.id}"] .team-card-heading h2`)
        .filter({ hasText: '外部团队名' })
        .waitFor()
      assert.equal(
        await edit.getByLabel('团队说明', { exact: true }).inputValue(),
        '未提交的说明草稿',
      )
      await edit.getByRole('button', { name: '保存新版本', exact: true }).click()
      await edit.getByRole('alert').filter({ hasText: '数据已变化' }).waitFor()
      assert.equal(await edit.getByLabel('团队名称', { exact: true }).inputValue(), original.name)
      await page.keyboard.press('Escape')
      await edit.waitFor({ state: 'detached' })
      assert.equal(await detail.isVisible(), true)
      assert.equal(
        await detail
          .getByLabel('团队历史版本', { exact: true })
          .evaluate((element) => document.activeElement === element),
        true,
      )
      assert.equal(
        await detail.getByRole('button', { name: '编辑当前版本', exact: true }).isDisabled(),
        true,
      )
      await detail.getByLabel('团队历史版本', { exact: true }).selectOption('2')
      await detail.getByRole('button', { name: '编辑当前版本', exact: true }).click()
      assert.equal(await edit.getByLabel('团队说明', { exact: true }).inputValue(), '来自另一渠道')
      await edit.getByLabel('团队说明', { exact: true }).fill('')
      await edit.getByRole('button', { name: '保存新版本', exact: true }).click()
      await edit.waitFor({ state: 'detached' })
      // 保存回执可能先于正在进行的快照轮询结束；等待确切版本到达，再核对选择结果。
      await detail
        .getByLabel('团队历史版本', { exact: true })
        .locator('option[value="3"]')
        .waitFor({ state: 'attached' })
      await page.waitForFunction(() => {
        const selector = document.querySelector('dialog[open] .team-detail select')
        return selector instanceof HTMLSelectElement && selector.value === '3'
      })
      assert.equal(await detail.getByLabel('团队历史版本', { exact: true }).inputValue(), '3')
      await detail.getByText('尚未记录团队说明', { exact: true }).waitFor()
      await detail.getByLabel('团队历史版本', { exact: true }).selectOption('1')
      assert.equal(await detail.locator('.preserve-text').innerText(), original.description)
      await page.keyboard.press('Escape')
      await detail.waitFor({ state: 'detached' })
      const after = await snapshot(page)
      assert.deepEqual(
        after.teams.find((team) => team.id === original.id && team.version === 1),
        original,
      )
      assert.deepEqual(
        after.tasks.find((task) => task.id === plan.id),
        plan,
      )
      assert.equal(after.runs.length, 0)
      assert.equal(after.humanRequests.length, 0)
      assert.equal(
        after.roleReadiness.some((role) => role.enabled),
        false,
      )
      await page.setViewportSize({ width: 1440, height: 1000 })
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/team-catalog-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await page
        .locator(`[data-team-id="${original.id}"]`)
        .getByRole('button', { name: 'View team', exact: true })
        .click()
      const english = page.getByRole('dialog', { name: 'Team details', exact: true })
      await english.getByLabel('Team version history', { exact: true }).selectOption('1')
      assert.equal(await english.locator('.preserve-text').innerText(), original.description)
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: '.tmp/evidence/team-catalog-en-dark-700.png' })
      await page.keyboard.press('Escape')
      await english.waitFor({ state: 'detached' })
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await navigate(page, 'Teams')
      assert.deepEqual((await snapshot(page)).teams, after.teams)
      assert.deepEqual((await snapshot(page)).tasks, after.tasks)
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
    } finally {
      await quit(application)
      await fixture.cleanup()
    }
  },
)
