import { useCallback, useEffect, useRef, useState } from 'react'
import {
  projectInspectionSchema,
  type Project,
  type ProjectInspection,
} from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'

type State =
  | { status: 'loading' }
  | { status: 'ready'; report: ProjectInspection }
  | { status: 'error'; message: string }

/** 查询只在打开/显式刷新时发生；卸载或更换项目后不采用迟到结果，也不跟随语言切换重查。 */
export const useProjectInspection = (project: Project) => {
  const [state, setState] = useState<State>({ status: 'loading' })
  const generation = useRef(0)
  const pending = useRef(false)
  const refresh = useCallback(async () => {
    if (pending.current) return
    pending.current = true
    const sequence = ++generation.current
    setState({ status: 'loading' })
    try {
      const parsed = projectInspectionSchema.safeParse(
        await workflow().inspectProject({ projectId: project.id }),
      )
      if (!parsed.success) throw new Error('COMMAND_RESULT_UNCERTAIN')
      const report = parsed.data
      if (report.projectId !== project.id || report.projectVersion !== project.version)
        throw new Error('COMMAND_RESULT_UNCERTAIN')
      if (generation.current === sequence) setState({ status: 'ready', report })
    } catch (error) {
      if (generation.current === sequence)
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'GIT_INSPECTION_FAILED',
        })
    } finally {
      if (generation.current === sequence) pending.current = false
    }
  }, [project.id, project.version])
  useEffect(() => {
    void refresh()
    return () => {
      generation.current++
      pending.current = false
    }
  }, [refresh])
  return { state, refresh }
}
