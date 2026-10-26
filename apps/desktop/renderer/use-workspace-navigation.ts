import { useState } from 'react'
import type { NavigationId, TaskEntry } from './navigation'

/** 页面入口只携带交互意图；项目筛选和详情选择不修改内核中的任务。 */
export const useWorkspaceNavigation = () => {
  const [page, setPage] = useState<NavigationId>('home')
  const [taskEntry, setTaskEntry] = useState<TaskEntry>({ taskId: '', projectId: '', visit: 0 })
  // 显式页面入口重建列表交互；轮询或其他渠道更新不会改变visit或抢走当前详情。
  const enter = (entry: Pick<TaskEntry, 'taskId' | 'projectId'>, next: NavigationId) => {
    setTaskEntry((current) => ({ ...entry, visit: current.visit + 1 }))
    setPage(next)
  }
  const navigate = (next: NavigationId) => enter({ taskId: '', projectId: '' }, next)
  const openTask = (taskId: string) => enter({ taskId, projectId: '' }, 'tasks')
  const openProjectTasks = (projectId: string) => enter({ taskId: '', projectId }, 'tasks')
  return { page, taskEntry, navigate, openTask, openProjectTasks }
}
