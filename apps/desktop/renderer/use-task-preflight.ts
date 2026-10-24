import { useCallback, useEffect, useRef, useState } from 'react'
import {
  taskPreflightSchema,
  type PreflightInput,
  type TaskPreflight,
} from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'
import type { WorkspaceActions } from './use-workspace'
import { confirmedPreflightCommand } from './preflight-command'

/** 打开时固定意图；旧异步查询及已关闭弹窗不能覆盖新的检查结果。 */
export const useTaskPreflight = (initial: PreflightInput, actions: WorkspaceActions) => {
  const [intent] = useState(initial)
  const query = usePreflightQuery(intent)
  const confirming = useRef(false)
  const confirm = async (close: () => void) => {
    const { result, querying, needsRefresh } = query
    if (
      !result?.canStart ||
      !result.configurationFingerprint ||
      querying ||
      needsRefresh ||
      actions.busy ||
      confirming.current
    )
      return
    confirming.current = true
    try {
      const receipt = await actions.execute(
        confirmedPreflightCommand(intent, result.configurationFingerprint),
      )
      if (receipt) close()
      else query.requireRefresh()
    } finally {
      confirming.current = false
    }
  }
  return { ...query, confirm }
}

const usePreflightQuery = (intent: PreflightInput) => {
  const [result, setResult] = useState<TaskPreflight>()
  const [error, setError] = useState('')
  const [querying, setQuerying] = useState(false)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const generation = useRef(0)
  const refresh = useCallback(async () => {
    const request = ++generation.current
    setQuerying(true)
    setResult(undefined)
    setError('')
    setNeedsRefresh(false)
    try {
      const incoming = taskPreflightSchema.parse(await workflow().preflight(intent))
      if (request === generation.current) setResult(incoming)
    } catch (reason) {
      if (request === generation.current)
        setError(reason instanceof Error ? reason.message : '执行前检查未完成')
    } finally {
      if (request === generation.current) setQuerying(false)
    }
  }, [intent])
  useEffect(() => {
    void refresh()
    return () => {
      generation.current++
    }
  }, [refresh])
  return {
    result,
    error,
    querying,
    needsRefresh,
    refresh,
    requireRefresh: () => setNeedsRefresh(true),
  }
}
