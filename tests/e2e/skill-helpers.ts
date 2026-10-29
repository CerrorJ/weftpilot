import assert from 'node:assert/strict'
import type { Page } from 'playwright'
import { snapshot, waitForSnapshot } from './workflow-helpers'

export const skillFixtureCommits = [
  'd9b64543d28459c98f6245a2c483a3f640e10e3d',
  '55fe61b4254e8c7e1bdc2b362ee572b85043ca6c',
] as const
export const skillProofV1 = 'weftpilot-skill-integration-f936a5d1-80b9-4c0c-95da-ec75fe2d15f4\n'
export const fixtureSkillDirectory = 'tests/fixtures/skills/weftpilot-verification'

/** 下载真实公共提交，不替换网络、安装器或内核；本仓原创MIT资源免于复制第三方技能。 */
export const importFixtureSkill = async (page: Page, version: 1 | 2 = 1) => {
  await page.getByRole('button', { name: '技能中心', exact: true }).click()
  await page.getByRole('button', { name: '添加来源 / 预览技能', exact: true }).click()
  if (version === 2) {
    const source = (await snapshot(page)).skillSources[0]!
    await page.getByRole('combobox', { name: '编辑来源', exact: true }).selectOption(source.id)
  }
  await page.getByLabel('来源名称', { exact: true }).fill('纬舟原创验收技能')
  await page
    .getByLabel('公共仓库地址', { exact: true })
    .fill('https://github.com/CerrorJ/weftpilot')
  await page
    .getByLabel('固定提交（40位 SHA）', { exact: true })
    .fill(skillFixtureCommits[version - 1]!)
  await page
    .getByRole('button', { name: version === 1 ? '添加来源' : '保存来源新版本', exact: true })
    .click()
  const sources = await waitForSnapshot({
    page,
    timeout: 10000,
    predicate: (state) => state.skillSources.length === version,
  })
  const source = sources.skillSources.find((item) => item.version === version)!
  await page
    .getByRole('combobox', { name: '来源版本', exact: true })
    .selectOption(`${source.id}@${source.version}`)
  await page.getByLabel('技能目录（仓库内）', { exact: true }).fill(fixtureSkillDirectory)
  await page
    .getByLabel('许可证文件（仓库内）', { exact: true })
    .fill(`${fixtureSkillDirectory}/LICENSE`)
  await page.getByRole('button', { name: '下载并校验预览', exact: true }).click()
  const result = await waitForSnapshot({
    page,
    timeout: 60000,
    predicate: (state) =>
      state.skillImports.some(
        (item) =>
          item.source.version === version && ['preview_ready', 'failed'].includes(item.state),
      ),
  })
  const item = result.skillImports.find((item) => item.source.version === version)!
  assert.equal(item.state, 'preview_ready', item.failureCode ?? 'download failed')
  assert.ok(item.package)
  assert.equal(
    result.skills.some((skill) => skill.id === item.id),
    false,
  )
  const record = page.locator(`[data-import-id="${item.id}"]`)
  await record.getByRole('button', { name: '确认安装此版本', exact: true }).click()
  assert.equal(
    (await snapshot(page)).skills.some((skill) => skill.id === item.id),
    false,
  )
  await record.getByRole('checkbox').check()
  await record.getByRole('button', { name: '确认安装此版本', exact: true }).click()
  const installed = await waitForSnapshot({
    page,
    timeout: 10000,
    predicate: (state) => state.skills.some((skill) => skill.id === item.id),
  })
  await page
    .getByRole('dialog', { name: '技能版本详情', exact: true })
    .getByRole('button', { name: '关闭', exact: true })
    .click()
  // 内核已安装回执早于下一次界面轮询；等实际卡片反映安装后再切换已安装视图。
  await page
    .locator(`[data-catalog-id="${item.id}"]`)
    .getByText('已安装', { exact: true })
    .waitFor()
  return installed.skills.find((skill) => skill.id === item.id)!
}

export const openSkillDetail = async (page: Page, id: string) => {
  await page
    .locator(`[data-catalog-id="${id}"]`)
    .getByRole('button', { name: '查看详情', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: '技能版本详情', exact: true })
  // React先挂载dialog再由effect调用showModal；不能在原生弹窗打开前发送Esc。
  await dialog.waitFor({ state: 'visible' })
  return dialog
}
