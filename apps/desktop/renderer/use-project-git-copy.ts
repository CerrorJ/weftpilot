import { useEffect, useRef, useState } from 'react'
import { workflow } from './desktop-api'
import {
  projectGitCopyReceiptSchema,
  type ProjectGitCopyInput,
} from '../../../packages/kernel-client/project-clipboard'

type State = 'idle' | 'copying' | 'copied' | 'failed' | 'stale'

const requestCopy = async (input: ProjectGitCopyInput): Promise<void> => {
  const result = projectGitCopyReceiptSchema.safeParse(
    await workflow().copyProjectGitAddress(input),
  )
  if (
    !result.success ||
    result.data.projectId !== input.projectId ||
    result.data.projectVersion !== input.projectVersion ||
    result.data.gitUrl !== input.gitUrl
  )
    throw new Error('COMMAND_RESULT_UNCERTAIN')
}

/** 地址/项目以组件key固定；卸载后的旧回执不能给新项目显示复制成功。 */
export const useProjectGitCopy = (input: ProjectGitCopyInput) => {
  const [state, setState] = useState<State>('idle')
  const active = useRef(false)
  const pending = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const copy = async () => {
    if (pending.current) return
    pending.current = true
    setState('copying')
    try {
      await requestCopy(input)
      if (active.current) setState('copied')
    } catch (error) {
      if (active.current)
        setState(
          error instanceof Error && error.message.includes('PROJECT_GIT_COPY_STALE')
            ? 'stale'
            : 'failed',
        )
    } finally {
      if (active.current) pending.current = false
    }
  }
  return { state, copy }
}
