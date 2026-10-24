import type { Page } from 'playwright'

export const roleDialog = (page: Page) =>
  page.getByRole('dialog', {
    name: /^(创建角色|编辑角色配置|Create role|Edit role configuration)$/,
  })

export const openRoleManagement = async (page: Page, id?: string) => {
  const card = id ? page.locator(`[data-role-id="${id}"]`) : page.locator('.role-card').first()
  await card
    .getByRole('button', { name: /^(试运行与启停|Trial & activation)$/, exact: true })
    .click()
  return page.getByRole('dialog', { name: /^(角色运行设置|Role execution settings)$/, exact: true })
}

export const closeRoleManagement = async (page: Page) => {
  const dialog = page.getByRole('dialog', {
    name: /^(角色运行设置|Role execution settings)$/,
    exact: true,
  })
  await dialog
    .getByRole('button', { name: /^(关闭|Close)$/, exact: true })
    .last()
    .click()
  await dialog.waitFor({ state: 'hidden' })
}

/** 从卡片的真实运行设置试运行并显式启用，不重新保存角色或增加配置版本。 */
export const activateSavedRole = async (page: Page, id?: string) => {
  const dialog = await openRoleManagement(page, id)
  await dialog.getByRole('button', { name: /^(真实试运行|Run real trial)$/, exact: true }).click()
  await dialog
    .getByRole('button', { name: /^(启用角色|Enable role)$/, exact: true })
    .and(page.locator(':enabled'))
    .click({ timeout: 120000 })
  await dialog.getByRole('button', { name: /^(停用角色|Disable role)$/, exact: true }).waitFor()
  await closeRoleManagement(page)
}

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
