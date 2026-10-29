import assert from 'node:assert/strict'
import { test } from 'node:test'
import { launch, snapshot, waitForSnapshot, quit } from './workflow-helpers'
import { openSkillDetail } from './skill-helpers'
import { prepareSkillHistory } from './skill-history-fixture'

test(
  '受控旧技能记录+真实窗口：卸载后Esc回当前视图，仍存在的卡片正常归焦；不证明下载安装',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareSkillHistory()
    const application = await launch(fixture.data)
    try {
      const page = await application.firstWindow()
      await page.getByRole('button', { name: '技能中心', exact: true }).click()
      await page.getByRole('button', { name: /^已安装/ }).click()
      const detail = await openSkillDetail(page, fixture.first.id)
      await detail.getByRole('button', { name: '卸载此版本', exact: true }).click()
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (state) =>
          state.skills.find((skill) => skill.id === fixture.first.id)?.available === false,
      })
      await page.locator(`[data-catalog-id="${fixture.first.id}"]`).waitFor({ state: 'detached' })
      await page.keyboard.press('Escape')
      await detail.waitFor({ state: 'detached' })
      await page.waitForFunction(() =>
        document.activeElement?.matches('.skill-catalog-tabs button[aria-pressed="true"]'),
      )
      const second = await openSkillDetail(page, fixture.second.id)
      await page.keyboard.press('Escape')
      await second.waitFor({ state: 'detached' })
      assert.equal(
        await page
          .locator(`[data-catalog-id="${fixture.second.id}"] button`)
          .evaluate((element) => element === document.activeElement),
        true,
      )
      const state = await snapshot(page)
      assert.equal(state.skills.find((skill) => skill.id === fixture.first.id)?.available, false)
      assert.deepEqual(
        state.skills.find((skill) => skill.id === fixture.second.id),
        fixture.second,
      )
      assert.equal(state.runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
