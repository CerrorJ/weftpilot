/** 界面仅选择最新可编辑版本；历史 Run 的快照始终直接显示内核返回的原版本。 */
export const latestVersions = <T extends { id: string; version: number }>(items: T[]): T[] => {
  const latest = new Map<string, T>()
  for (const item of items) {
    if ((latest.get(item.id)?.version ?? 0) < item.version) latest.set(item.id, item)
  }
  return [...latest.values()]
}
