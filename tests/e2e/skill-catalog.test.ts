import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { test } from 'node:test'
import type { Page } from 'playwright'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  waitForSnapshot,
  quit,
} from './workflow-helpers'

const openSources = async (page: Page) => {
  await page.getByRole('button', { name: '添加来源 / 预览技能', exact: true }).click()
  return page.getByRole('dialog', { name: '管理技能源', exact: true })
}

test(
  '真实技能目录空态/筛选/来源版本CAS不造安装，弹窗Esc焦点及中英文深色700px',
  { timeout: 90000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      await page.getByRole('button', { name: '技能中心', exact: true }).click()
      await page.getByRole('heading', { name: '从一个可信来源开始', exact: true }).waitFor()
      assert.equal(await page.locator('[data-catalog-id]').count(), 0)
      await page.getByRole('button', { name: /^已安装/ }).click()
      await page.getByRole('heading', { name: '尚未安装技能', exact: true }).waitFor()
      await page.getByRole('searchbox', { name: '搜索技能', exact: true }).fill('NO_SUCH_SKILL')
      await page.getByRole('heading', { name: '没有找到匹配的技能', exact: true }).waitFor()
      await page.getByRole('searchbox', { name: '搜索技能', exact: true }).fill('')
      const dialog = await openSources(page)
      await dialog.getByLabel('来源名称', { exact: true }).fill('固定来源 Original')
      await dialog
        .getByLabel('公共仓库地址', { exact: true })
        .fill('https://github.com/CerrorJ/weftpilot')
      await dialog.getByLabel('固定提交（40位 SHA）', { exact: true }).fill('a'.repeat(40))
      await dialog.getByRole('button', { name: '添加来源', exact: true }).click()
      let state = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (value) => value.skillSources.length === 1,
      })
      const source = state.skillSources[0]!
      await dialog.getByRole('combobox', { name: '编辑来源', exact: true }).selectOption(source.id)
      await dialog.getByLabel('来源名称', { exact: true }).fill('我未保存的来源草稿')
      // 另一客户端追加版本；本窗口仍须保留自己的输入和v1 CAS基准。
      await page.evaluate(
        async (input) =>
          window.weftpilot!.workflow.saveSkillSource({
            key: crypto.randomUUID(),
            input: { ...input, expectedVersion: 1, name: '外部来源v2' },
          }),
        { id: source.id, repository: source.repository, commit: source.commit },
      )
      await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (value) => value.skillSources.length === 2,
      })
      await dialog
        .getByRole('option', { name: '外部来源v2 · v2', exact: true })
        .waitFor({ state: 'attached' })
      assert.equal(
        await dialog.getByLabel('来源名称', { exact: true }).inputValue(),
        '我未保存的来源草稿',
      )
      await dialog.getByRole('button', { name: '保存来源新版本', exact: true }).click()
      await dialog.getByRole('alert').filter({ hasText: 'VERSION_CONFLICT' }).waitFor()
      await dialog.getByRole('button', { name: '读取当前来源版本', exact: true }).click()
      assert.equal(await dialog.getByLabel('来源名称', { exact: true }).inputValue(), '外部来源v2')
      await dialog.getByRole('combobox', { name: '编辑来源', exact: true }).selectOption('')
      await dialog.getByLabel('来源名称', { exact: true }).fill('外部来源v2')
      await dialog.getByLabel('公共仓库地址', { exact: true }).fill(source.repository)
      await dialog.getByLabel('固定提交（40位 SHA）', { exact: true }).fill(source.commit)
      await dialog.getByRole('button', { name: '添加来源', exact: true }).click()
      state = await waitForSnapshot({
        page,
        timeout: 10000,
        predicate: (value) => value.skillSources.length === 3,
      })
      const duplicate = state.skillSources.find((value) => value.id !== source.id)!
      const editor = dialog.getByRole('combobox', { name: '编辑来源', exact: true })
      await editor.locator(`option[value="${duplicate.id}"]`).waitFor({ state: 'attached' })
      const firstLabel = await editor.locator(`option[value="${source.id}"]`).textContent()
      const secondLabel = await editor.locator(`option[value="${duplicate.id}"]`).textContent()
      assert.notEqual(firstLabel, secondLabel)
      assert.match(firstLabel!, new RegExp(source.id.slice(0, 8)))
      assert.match(secondLabel!, new RegExp(duplicate.id.slice(0, 8)))
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      assert.equal(
        await page
          .getByRole('button', { name: '添加来源 / 预览技能', exact: true })
          .evaluate((element) => element === document.activeElement),
        true,
      )
      state = await snapshot(page)
      assert.equal(state.skillImports.length, 0)
      assert.equal(state.skills.length, 0)
      assert.equal(state.runs.length, 0)
      assert.equal(state.skillSources[0]!.name, source.name)
      const filter = page.getByRole('combobox', { name: '筛选技能源', exact: true })
      assert.notEqual(
        await filter.locator(`option[value="${source.id}"]`).textContent(),
        await filter.locator(`option[value="${duplicate.id}"]`).textContent(),
      )
      await filter.selectOption(duplicate.id)
      assert.equal(await filter.inputValue(), duplicate.id)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/skill-catalog-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await application
        .browserWindow(page)
        .then((window) => window.evaluate((native) => native.setSize(700, 820)))
      await page.getByRole('searchbox', { name: 'Search skills', exact: true }).fill(randomUUID())
      await page.getByRole('heading', { name: 'No matching skills', exact: true }).waitFor()
      await page.screenshot({ path: '.tmp/evidence/skill-catalog-en-dark-700.png' })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
