import type { Page, Locator } from 'playwright'

export const openDeliveryReview = async (page: Page) => {
  await page.getByRole('button', { name: '检查交付与验收', exact: true }).click({ timeout: 90000 })
  return page.getByRole('dialog', { name: '交付与验收', exact: true })
}

export const checkAcceptanceCriteria = async (dialog: Locator) => {
  const checks = dialog.locator('.criteria-checklist input[type="checkbox"]')
  for (const checkbox of await checks.all()) await checkbox.check()
}
