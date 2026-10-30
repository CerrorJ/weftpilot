import type { Page } from 'playwright'

/** 所有测试走正式八页导航；设置子页不能伪装成另一套主导航。 */
export const navigate = async (page: Page, name: string | RegExp): Promise<void> => {
  await page
    .getByRole('navigation', { name: /^(主导航|Main navigation)$/ })
    .getByRole('button', { name, exact: true })
    .click()
}

export const openSettingsPage = async (
  page: Page,
  section: 'kernel' | 'models' | 'feishu',
): Promise<void> => {
  await navigate(page, /^(设置|Settings)$/)
  const names = {
    kernel: /^(内核信息|Kernel)$/,
    models: /^(模型配置|Model profile)$/,
    feishu: /^(飞书连接|Feishu connection)$/,
  }
  await page
    .getByRole('navigation', { name: /^(设置分类|Settings sections)$/ })
    .getByRole('button', { name: names[section], exact: true })
    .click()
  if (section === 'feishu') await page.locator('.legacy-feishu summary').click()
}

export const openHumanPage = async (page: Page): Promise<void> => {
  await navigate(page, /^(任务管理|Tasks)$/)
  await page.getByRole('button', { name: /^(待处理|Needs your input)$/, exact: true }).click()
}
