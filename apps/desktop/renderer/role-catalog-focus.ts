/** 草稿选择项会卸载、最后一个Continue会消失；仅在原生归焦无有效目标时补回页头。 */
export const restoreRoleCatalogFocus = (): void => {
  const actions = document.querySelector('.role-catalog-actions')
  if (!actions) return
  requestAnimationFrame(() => {
    // 市场导航或另开模态框后不夺焦点；等待React移除刚关闭的向导再判断。
    if (!actions.isConnected || document.querySelector('dialog[open]')) return
    const active = document.activeElement
    if (active !== document.body && active?.isConnected) return
    const continuing = actions.querySelector<HTMLElement>(
      'button:not(.role-create-action):not(:disabled)',
    )
    const creating = actions.querySelector<HTMLElement>('.role-create-action:not(:disabled)')
    ;(continuing ?? creating)?.focus()
  })
}
