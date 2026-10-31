import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import { prepareSkillRecovery } from './skill-recovery-fixture'
import { launch, snapshot, waitForSnapshot, quit } from './workflow-helpers'
import { openSkillDetail, skillFixtureCommits } from './skill-helpers'

test(
  '受控失败+真实窗口：只为下载失败提供手动恢复，原来源v1不随v2改变且浏览不重发',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareSkillRecovery()
    const application = await launch(fixture.data)
    try {
      const page = await application.firstWindow()
      await page.getByRole('button', { name: '技能中心', exact: true }).click()
      await page.locator('.topbar .appearance-settings summary').click()
      await page.getByRole('combobox', { name: '外观', exact: true }).selectOption('light')
      await page.locator('.topbar .appearance-settings summary').click()
      const before = await snapshot(page)
      const failed = before.skillImports.find(
        (item) => item.failureCode === 'SKILL_DOWNLOAD_RATE_LIMITED',
      )!
      const invalid = before.skillImports.find(
        (item) => item.failureCode === 'SKILL_SOURCE_INVALID',
      )!
      assert.ok(
        before.skillSources.some(
          (source) => source.id === failed.source.id && source.version === 2,
        ),
      )
      let detail = await openSkillDetail(page, failed.id)
      await detail.getByRole('button', { name: '按此来源版本重新下载', exact: true }).waitFor()
      await detail.getByText(skillFixtureCommits[0], { exact: true }).first().waitFor()
      assert.equal(
        await detail.getByRole('button', { name: '确认安装此版本', exact: true }).count(),
        0,
      )
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/skill-recovery-zh-light.png' })
      await page.keyboard.press('Escape')
      await detail.waitFor({ state: 'detached' })
      detail = await openSkillDetail(page, invalid.id)
      assert.equal(
        await detail.getByRole('button', { name: '按此来源版本重新下载', exact: true }).count(),
        0,
      )
      await page.keyboard.press('Escape')
      await detail.waitFor({ state: 'detached' })
      await page.locator('.topbar .appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.topbar .appearance-settings summary').click()
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setContentSize(700, 820)))
      detail = await openSkillDetail(page, failed.id)
      await detail
        .getByRole('button', { name: 'Download this source version again', exact: true })
        .waitFor()
      await page.screenshot({ path: '.tmp/evidence/skill-recovery-en-dark-700.png' })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      await new Promise((resolve) => setTimeout(resolve, 1800))
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实公共下载恢复：手动新记录固定旧来源、保留失败、重新同意安装并重启保留',
  {
    timeout: 180000,
    skip: process.env.WEFTPILOT_REAL_SKILLS !== '1',
  },
  async () => {
    const fixture = await prepareSkillRecovery()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      await page.getByRole('button', { name: '技能中心', exact: true }).click()
      const before = await snapshot(page)
      const old = before.skillImports.find(
        (item) => item.failureCode === 'SKILL_DOWNLOAD_RATE_LIMITED',
      )!
      let detail = await openSkillDetail(page, old.id)
      await detail.getByRole('button', { name: '按此来源版本重新下载', exact: true }).dblclick()
      await detail.getByText('新下载记录已创建，本次失败保持原状。', { exact: true }).waitFor()
      const acknowledged = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) => state.skillImports.length === before.skillImports.length + 1,
      })
      const fresh = acknowledged.skillImports.find(
        (item) => !before.skillImports.some((previous) => previous.id === item.id),
      )!
      assert.deepEqual(fresh.source, old.source)
      assert.equal(fresh.directory, old.directory)
      assert.equal(fresh.licensePath, old.licensePath)
      assert.deepEqual(
        acknowledged.skillImports.find((item) => item.id === old.id),
        old,
      )
      await detail.getByRole('button', { name: '查看新下载记录', exact: true }).click()
      detail = page.getByRole('dialog', { name: '技能版本详情', exact: true })
      await detail.locator(`[data-import-id="${fresh.id}"]`).waitFor()
      const finished = await waitForSnapshot({
        page,
        timeout: 60000,
        predicate: (state) =>
          ['preview_ready', 'failed'].includes(
            state.skillImports.find((item) => item.id === fresh.id)?.state ?? '',
          ),
      })
      const ready = finished.skillImports.find((item) => item.id === fresh.id)!
      assert.equal(ready.state, 'preview_ready', ready.failureCode ?? 'preview required')
      assert.equal(finished.skills.length, 0)
      await detail.getByRole('button', { name: '确认安装此版本', exact: true }).click()
      assert.equal((await snapshot(page)).skills.length, 0)
      await detail.getByRole('checkbox').check()
      await detail.getByRole('button', { name: '确认安装此版本', exact: true }).click()
      const installed = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.skillImports.find((item) => item.id === fresh.id)?.state === 'installed',
      })
      assert.equal(installed.skillImports.length, before.skillImports.length + 1)
      assert.deepEqual(
        installed.skillImports.find((item) => item.id === old.id),
        old,
      )
      assert.deepEqual(installed.skillSources, before.skillSources)
      assert.equal(installed.skills[0]?.source.commit, old.source.commit)
      assert.equal(installed.runs.length, 0)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/skill-recovery-real-installed.png' })
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      const restored = await snapshot(page)
      assert.deepEqual(restored.skillImports, installed.skillImports)
      assert.deepEqual(restored.skills, installed.skills)
      await quit(application)
    } catch (error) {
      const page = await application.firstWindow().catch(() => undefined)
      await mkdir('.tmp/evidence', { recursive: true })
      await writeFile(
        `.tmp/evidence/skill-recovery-real-failure-${Date.now()}.json`,
        JSON.stringify(page ? await snapshot(page) : {}),
      )
      throw error
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
