import { useCallback, useEffect, useRef, useState } from 'react'
import {
  workspaceSnapshotSchema,
  type BusinessCommand,
  type WorkspaceSnapshot,
} from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'
import { sendCommand } from './command-sender'

export const useWorkspace = () => {
  const [state, setState] = useState<WorkspaceSnapshot>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const querying = useRef(false)
  const keys = useRef(new Map<string, string>())
  const refresh = useCallback(async () => {
    if (querying.current) return
    querying.current = true
    try {
      const incoming = workspaceSnapshotSchema.parse(await workflow().snapshot())
      setState((current) => (current && current.cursor > incoming.cursor ? current : incoming))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '连接中断，状态待确认')
    } finally {
      querying.current = false
    }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => {
      void refresh()
    }, 1500)
    return () => clearInterval(timer)
  }, [refresh])
  const perform = async (fingerprint: string, action: (key: string) => Promise<unknown>) => {
    setBusy(true)
    setError('')
    const key = keys.current.get(fingerprint) ?? crypto.randomUUID()
    keys.current.set(fingerprint, key)
    try {
      const result = await action(key)
      keys.current.delete(fingerprint)
      await refresh()
      return result
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '操作未完成')
      return undefined
    } finally {
      setBusy(false)
    }
  }
  const execute = (command: BusinessCommand) =>
    perform(JSON.stringify(command), (key) => sendCommand(command, key))
  const createProject = (input: { name: string; defaultBranch: string }) =>
    perform(JSON.stringify({ type: 'project.create', ...input }), (key) =>
      workflow().createProject({ key, input }),
    )
  return { state, error, busy, refresh, execute, createProject }
}

export type WorkspaceActions = ReturnType<typeof useWorkspace>
