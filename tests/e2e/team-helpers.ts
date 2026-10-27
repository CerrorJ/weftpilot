import type { Page } from 'playwright'
import { navigate } from './navigation-helpers'

export const openTeamEditor = async (page: Page, id?: string) => {
  await navigate(page, '团队管理')
  if (id) {
    await page
      .locator(`[data-team-id="${id}"]`)
      .getByRole('button', { name: '查看团队', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: '团队详情', exact: true })
      .getByRole('button', { name: '编辑当前版本', exact: true })
      .click()
  } else await page.getByRole('button', { name: '创建团队', exact: true }).click()
  return page.getByRole('dialog', { name: id ? '编辑团队' : '创建团队', exact: true })
}

export const waitTeamCard = async (page: Page, name: string, version: number) => {
  const card = page
    .locator('.team-card')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
  await card
    .locator('.team-card-heading .badge')
    .filter({ hasText: new RegExp(`v${version}$`) })
    .waitFor()
  return card
}
