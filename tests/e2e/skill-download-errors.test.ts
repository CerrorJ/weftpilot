import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import { prepareSkillErrors } from './skill-error-fixture'
import { launch, snapshot, quit } from './workflow-helpers'
import { openSkillDetail } from './skill-helpers'

test(
  '受控失败+真实新内核窗口：限流/TLS分别解释，中英明暗，不泄漏原始异常或自动重试',
  { timeout: 60000 },
  async () => {
    const fixture = await prepareSkillErrors()
    let application = await launch(fixture.data)
    try {
      let page = await application.firstWindow()
      await page.getByRole('button', { name: '技能中心', exact: true }).click()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '外观', exact: true }).selectOption('light')
      await page.locator('.appearance-settings summary').click()
      const before = await snapshot(page)
      const rate = before.skillImports.find((item) => item.source.name === 'rate-source')!
      const tls = before.skillImports.find((item) => item.source.name === 'tls-source')!
      assert.equal(rate.failureCode, 'SKILL_DOWNLOAD_RATE_LIMITED')
      assert.equal(tls.failureCode, 'SKILL_DOWNLOAD_TLS_FAILED')
      let detail = await openSkillDetail(page, rate.id)
      await detail
        .getByText(
          'SKILL_DOWNLOAD_RATE_LIMITED: 技能源请求被限流，请稍后手动重新导入；不会自动重试',
          { exact: true },
        )
        .waitFor()
      assert.equal(
        await detail.getByRole('button', { name: '确认安装此版本', exact: true }).count(),
        0,
      )
      assert.doesNotMatch(await page.locator('body').innerText(), /synthetic-private-marker/)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/skill-download-errors-zh-light.png' })
      await page.keyboard.press('Escape')
      await detail.waitFor({ state: 'detached' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page
        .locator(`[data-catalog-id="${tls.id}"]`)
        .getByRole('button', { name: 'View details', exact: true })
        .click()
      detail = page.getByRole('dialog', { name: 'Skill version details', exact: true })
      await detail
        .getByText(
          'SKILL_DOWNLOAD_TLS_FAILED: The source certificate could not be verified. Check the clock and trusted certificates; keep TLS verification enabled.',
          { exact: true },
        )
        .waitFor()
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setContentSize(700, 820)))
      await page.screenshot({ path: '.tmp/evidence/skill-download-errors-en-dark-700.png' })
      assert.doesNotMatch(await page.locator('body').innerText(), /synthetic-private-marker/)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      await page.keyboard.press('Escape')
      await detail.waitFor({ state: 'detached' })
      await quit(application)
      application = await launch(fixture.data)
      page = await application.firstWindow()
      const after = await snapshot(page)
      assert.deepEqual(after.skillImports, before.skillImports)
      assert.equal(after.runs.length, 0)
      assert.equal(after.skills.length, 0)
      assert.equal(JSON.stringify(after).includes('synthetic-private-marker'), false)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
