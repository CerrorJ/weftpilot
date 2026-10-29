/** 卸载会从已安装视图移除触发卡片；原生归焦无有效目标时才返回当前视图。 */
export const restoreSkillCatalogFocus = (): void => {
  const toolbar = document.querySelector('.skill-catalog-toolbar')
  if (!toolbar) return
  requestAnimationFrame(() => {
    // 等待详情卸载；若已导航、另开弹窗或用户已有有效焦点，不抢夺键盘位置。
    if (!toolbar.isConnected || document.querySelector('dialog[open]')) return
    const active = document.activeElement
    if (
      active &&
      active !== document.body &&
      active !== document.documentElement &&
      active.isConnected
    )
      return
    toolbar
      .querySelector<HTMLButtonElement>('.skill-catalog-tabs button[aria-pressed="true"]')
      ?.focus()
  })
}
