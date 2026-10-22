import { useCallback, useEffect, useRef, useState } from 'react'
import {
  workspaceSnapshotSchema,
  type BusinessCommand,
  type WorkspaceSnapshot,
} from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'
import { sendCommand } from './command-sender'
import type { ModelSubmission } from '../../../packages/kernel-client/bridge-contract'
import { useSubmission } from './use-submission'

export const useWorkspace = () => {
  const [state, setState] = useState<WorkspaceSnapshot>()
  const [error, setError] = useState('')
  const querying = useRef(false)
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
  const { perform, busy } = useSubmission({ refresh, setError })
  const execute = (command: BusinessCommand) =>
    perform(JSON.stringify(command), (key) => sendCommand(command, key))
  const createProject = (input: { name: string; defaultBranch: string }) =>
    perform(JSON.stringify({ type: 'project.create', ...input }), (key) =>
      workflow().createProject({ key, input }),
    )
  const saveModel = async (input: ModelSubmission) => {
    return perform(await modelFingerprint(input), (key) => workflow().saveModel({ key, input }))
  }
  return { state, error, busy, refresh, execute, createProject, saveModel }
}

export type WorkspaceActions = ReturnType<typeof useWorkspace>

const modelFingerprint = async (input: ModelSubmission): Promise<string> => {
  // 幂等缓存只保留摘要，不延长明文密钥的生命周期。
  const encoded = new TextEncoder().encode(JSON.stringify(input))
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return `model:${Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, '0')).join('')}`
}
