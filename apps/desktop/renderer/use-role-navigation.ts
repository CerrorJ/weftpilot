import { useState } from 'react'
import type { NavigationId } from './navigation'
import { rememberSelectedRole } from './role-draft'

/** 设置、目录和技能市场使用同一角色表单，只记UI选择，不写角色版本。 */
export const useRoleNavigation = (enter: (id: NavigationId) => void) => {
  const [roleReturn, setRoleReturn] = useState(false)
  const [resume, setResume] = useState(false)
  const [initialRoleId, setInitialRoleId] = useState<string>()
  const navigate = (id: NavigationId) => {
    enter(id)
    setResume(false)
    setInitialRoleId(undefined)
  }
  const returnRole = () => {
    setRoleReturn(false)
    enter('roles')
    setResume(true)
  }
  const configureRole = (id: string) => {
    setInitialRoleId(id)
    rememberSelectedRole(id)
    setRoleReturn(false)
    enter('roles')
    setResume(true)
  }
  return {
    navigate,
    roleReturn,
    returnRole,
    configureRole,
    roleNavigation: {
      ...(initialRoleId ? { initialRoleId } : {}),
      resume,
      resumed: () => setResume(false),
      visitSkills: (id?: string) => {
        navigate('skills')
        setInitialRoleId(id)
        setRoleReturn(true)
      },
    },
  }
}
