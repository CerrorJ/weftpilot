import { confirmPreflight } from './preflight-helpers'
import { openDeliveryReview, checkAcceptanceCriteria } from './delivery-helpers'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from 'playwright'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'
import { importFixtureSkill, skillProofV1 } from './skill-helpers'
import {
  openRoleEditor,
  goRoleStep,
  saveRoleEditor,
  activateSavedRole,
  waitRoleCard,
  resumeRoleDraft,
} from './role-helpers'

test(
  '真实来源技能：预览、许可确认、升级文件变化、角色草稿、卸载与重启',
  {
    timeout: 180000,
    skip: process.env.WEFTPILOT_REAL_SKILLS !== '1',
  },
  async () => {
    const fixture = await createFixture()
    let application = await launch(fixture.data)
    try {
      let page = await configure(application, fixture.repository)
      await openRoleEditor(page)
      await page.getByRole('textbox', { name: '角色名称', exact: true }).fill('保留的角色草稿')
      await page
        .getByRole('textbox', { name: '职责', exact: true })
        .fill('从技能中心回来后保留这段职责。')
      await goRoleStep(page, 1)
      await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption('claude')
      await page.getByRole('button', { name: '保存表单草稿', exact: true }).click()
      const first = await importFixtureSkill(page)
      const second = await importFixtureSkill(page, 2)
      assert.notEqual(first.digest, second.digest)
      assert.notEqual(first.id, second.id)
      const changes = page
        .locator(`[data-import-id="${second.id}"] details`)
        .filter({ hasText: '与此前安装版本的文件变化' })
      await changes.waitFor()
      assert.match(await changes.innerText(), /references\/proof.txt/)
      assert.doesNotMatch(await changes.innerText(), /文件内容一致/)
      const imports = (await snapshot(page)).skillImports
      assert.equal(imports.find((item) => item.id === second.id)?.comparisonPackageId, first.id)
      assert.equal(imports.find((item) => item.id === first.id)?.comparisonPackageId, null)
      await page.getByRole('button', { name: '角色管理', exact: true }).click()
      await resumeRoleDraft(page)
      await goRoleStep(page, 0)
      assert.equal(
        await page.getByLabel('角色名称', { exact: true }).inputValue(),
        '保留的角色草稿',
      )
      assert.equal(
        await page.getByLabel('职责', { exact: true }).inputValue(),
        '从技能中心回来后保留这段职责。',
      )
      await goRoleStep(page, 1)
      assert.equal(
        await page.getByRole('combobox', { name: 'CLI', exact: true }).inputValue(),
        'claude',
      )
      await goRoleStep(page, 2)
      await page.locator(`input[name="skills"][value="${first.id}@${first.digest}"]`).check()
      await saveRoleEditor(page)
      const saved = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.roles.some((role) => role.name === '保留的角色草稿'),
      })
      const role = saved.roles.find((role) => role.name === '保留的角色草稿')!
      assert.deepEqual(role.skills, [{ id: first.id, digest: first.digest }])
      await page.getByRole('button', { name: '技能中心', exact: true }).click()
      await page
        .locator(`[data-skill-id="${first.id}"]`)
        .getByRole('button', { name: '卸载此版本', exact: true })
        .click()
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.skills.find((skill) => skill.id === first.id)?.available === false,
      })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.getByRole('heading', { name: 'Skills', exact: true }).waitFor()
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      await page.getByRole('button', { name: 'Skills', exact: true }).click()
      const restored = await snapshot(page)
      assert.equal(restored.skills.find((skill) => skill.id === first.id)?.available, false)
      assert.equal(restored.skills.find((skill) => skill.id === second.id)?.available, true)
      assert.deepEqual(restored.roles.find((item) => item.id === role.id)?.skills, role.skills)
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

for (const cli of ['codex', 'claude'] as const)
  test(
    `真实${cli}读取固定技能资源，角色试运行与交付不含技能控制文件`,
    {
      timeout: 240000,
      skip: process.env.WEFTPILOT_REAL_SKILL_CLI !== '1',
    },
    async () => {
      const fixture = await createFixture()
      const application = await launch(fixture.data)
      try {
        const page = await configure(application, fixture.repository)
        const skill = await importFixtureSkill(page)
        await page.getByRole('button', { name: '角色管理', exact: true }).click()
        await openRoleEditor(page, (await snapshot(page)).roles[0]!.id)
        await goRoleStep(page, 1)
        await page.getByRole('combobox', { name: 'CLI', exact: true }).selectOption(cli)
        await goRoleStep(page, 2)
        await page.locator(`input[name="skills"][value="${skill.id}@${skill.digest}"]`).check()
        await saveRoleEditor(page)
        await waitRoleCard(page, '测试开发者', 2)
        await activateSavedRole(page)
        const taskId = await createSkillTask(page)
        await page.getByRole('button', { name: '开始真实执行', exact: true }).click()
        await confirmPreflight(page)
        const finished = await waitForSnapshot({
          page,
          timeout: 90000,
          predicate: (state) =>
            state.runs.some(
              (run) => run.taskId === taskId && run.processState === 'confirmed_ended',
            ),
        })
        const run = finished.runs.find((run) => run.taskId === taskId)!
        assert.equal(run.status, 'succeeded', run.failureCode ?? 'CLI did not succeed')
        assert.deepEqual(run.roleSnapshot.skills, [{ id: skill.id, digest: skill.digest }])
        const actual = await readFile(join(run.workDirectory, 'weftpilot-skill-proof.txt'))
        assert.ok(
          actual.equals(Buffer.from(skillProofV1)),
          'Skill resource bytes must match the pinned version',
        )
        const delivery = finished.deliveries.find((delivery) => delivery.runId === run.id)!
        assert.match(delivery.diff, /weftpilot-skill-proof.txt/)
        assert.doesNotMatch(delivery.diff, /weftpilot-skills|SKILL.md|manifest.json/)
        assert.equal(finished.tasks.find((task) => task.id === taskId)?.status, 'in_review')
        await checkAcceptanceCriteria(await openDeliveryReview(page))
        await page.getByRole('button', { name: '验收通过', exact: true }).click()
        await waitForSnapshot({
          page,
          timeout: 10000,
          predicate: (state) => state.tasks.find((task) => task.id === taskId)?.status === 'done',
        })
        await quit(application)
      } catch (error) {
        await mkdir('.tmp/evidence', { recursive: true })
        const state = await snapshot(await application.firstWindow()).catch(() => undefined)
        await writeFile(
          `.tmp/evidence/skill-${cli}-failure-${Date.now()}.json`,
          JSON.stringify({ fixture: fixture.directory, state }, null, 2),
        )
        throw error
      } finally {
        await application.close().catch(() => undefined)
        await fixture.cleanup()
      }
    },
  )

const createSkillTask = async (page: Page): Promise<string> => {
  await page.getByRole('button', { name: '任务管理', exact: true }).click()
  await page.getByRole('button', { name: '创建任务', exact: true }).click()
  await page.getByLabel('任务名称', { exact: true }).fill('真实技能资源验证')
  await page
    .getByLabel('任务目标', { exact: true })
    .fill(
      '按本角色固定安装的 weftpilot-verification 技能完成验证。实际读取技能说明和相邻资源，按说明写入项目根目录的 weftpilot-skill-proof.txt，然后结束。不要联网、提交或修改技能文件。',
    )
  await page
    .getByLabel('验收条件', { exact: true })
    .fill('输出与固定版本技能 references/proof.txt 逐字节相同；执行成功后仍需人工验收。')
  await page.getByRole('button', { name: '创建待执行任务', exact: true }).click()
  await page.getByRole('heading', { name: '真实技能资源验证', exact: true }).waitFor()
  return (await snapshot(page)).tasks.find((task) => task.title === '真实技能资源验证')!.id
}
