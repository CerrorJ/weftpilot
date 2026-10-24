import assert from 'node:assert/strict'
import type { Page, Locator } from 'playwright'

/** 显式确认真实预检；不会绕过阻塞项或把超时当作已经启动。 */
export const confirmPreflight = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: '执行前检查', exact: true })
  await dialog
    .getByRole('button', { name: /^确认并(开始|加入队列)$/ })
    .and(page.locator(':enabled'))
    .click()
  await dialog.waitFor({ state: 'hidden' })
}

/** 点击关闭与取消也须离开原生模态状态并归还焦点，不能只覆盖Esc。 */
export const assertPreflightClickCloseFocus = async (options: {
  trigger: Locator
  dialog: Locator
  language: 'zh-CN' | 'en'
}) => {
  const captions = options.language === 'en' ? ['Close', 'Cancel'] : ['关闭', '取消']
  for (const caption of captions) {
    await options.trigger.click()
    await options.dialog.getByRole('alert').filter({ hasText: 'ROLE_NOT_READY' }).waitFor()
    await options.dialog.getByRole('button', { name: caption, exact: true }).click()
    await options.dialog.waitFor({ state: 'hidden' })
    assert.equal(
      await options.trigger.evaluate((element) => element === document.activeElement),
      true,
    )
  }
}
