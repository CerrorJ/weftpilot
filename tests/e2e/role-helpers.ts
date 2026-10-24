import type { Page } from 'playwright'

export const roleDialog = (page: Page) =>
  page.getByRole('dialog', {
    name: /^(创建角色|编辑角色配置|Create role|Edit role configuration)$/,
  })

/** 测试走正式六步入口，不从隐藏字段或旧版平铺表单绕过用户流程。 */
export const openRoleEditor = async (page: Page, id?: string) => {
  if (id)
    await page
      .getByRole('combobox', { name: /^(编辑角色|Edit role)$/, exact: true })
      .selectOption(id)
  await page
    .getByRole('button', {
      name: id ? /^(编辑角色配置|Edit role configuration)$/ : /^(创建角色|Create role)$/,
      exact: true,
    })
    .click()
  await roleDialog(page).waitFor()
}

export const goRoleStep = async (page: Page, step: number) => {
  const dialog = roleDialog(page)
  let current = Number(await dialog.locator('.role-steps li[aria-current] span').innerText()) - 1
  while (current < step) {
    await dialog.getByRole('button', { name: /^(下一步|Next)$/, exact: true }).click()
    current++
  }
  while (current > step) {
    await dialog.getByRole('button', { name: /^(上一步|Previous)$/, exact: true }).click()
    current--
  }
  await dialog.locator(`[data-role-step="${step}"]`).waitFor({ state: 'visible' })
}

export const saveRoleEditor = async (page: Page) => {
  await goRoleStep(page, 5)
  const dialog = roleDialog(page)
  await dialog
    .getByRole('button', {
      name: /^(保存角色配置|保存新版本|Save role configuration|Save new version)$/,
      exact: true,
    })
    .click()
  await dialog.locator('.role-health').waitFor()
  await dialog
    .getByRole('button', { name: /^(关闭配置|Close configuration)$/, exact: true })
    .click()
  await dialog.waitFor({ state: 'detached' })
}
