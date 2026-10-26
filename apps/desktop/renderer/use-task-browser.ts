import { useState } from 'react'
import type { TaskView } from './task-views'
import type { TaskEntry } from './navigation'

interface BrowserState {
  view: TaskView
  project: string
  search: string
  selected: string
}
/** 只保存列表交互状态；创建选择来自已校验回执，不因其他渠道的新任务或轮询跳转详情。 */
export const useTaskBrowser = (entry: TaskEntry) => {
  const [state, setState] = useState<BrowserState>({
    view: 'all',
    project: entry.projectId,
    search: '',
    selected: entry.taskId,
  })
  const filter = (patch: Partial<Pick<BrowserState, 'view' | 'project' | 'search'>>) =>
    setState((current) => ({ ...current, ...patch, selected: '' }))
  return {
    ...state,
    setView: (view: TaskView) => filter({ view }),
    setProject: (project: string) => filter({ project }),
    setSearch: (search: string) => filter({ search }),
    selectTask: (selected: string) => setState((current) => ({ ...current, selected })),
    created: (id: string) => setState({ view: 'all', project: '', search: '', selected: id }),
  }
}
export type TaskBrowser = ReturnType<typeof useTaskBrowser>
