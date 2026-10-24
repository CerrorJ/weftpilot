export const navigation = [
  { id: 'home', label: '工作台' },
  { id: 'projects', label: '项目管理' },
  { id: 'tasks', label: '任务管理' },
  { id: 'requirements', label: '需求管理' },
  { id: 'roles', label: '角色管理' },
  { id: 'teams', label: '团队管理' },
  { id: 'skills', label: '技能中心' },
  { id: 'settings', label: '设置' },
] as const

export type NavigationId = (typeof navigation)[number]['id']
