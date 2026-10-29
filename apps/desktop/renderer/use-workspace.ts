import { useCallback, useEffect, useRef, useState } from 'react'
import {
  workspaceSnapshotSchema,
  type BusinessCommand,
  type WorkspaceSnapshot,
} from '@weftpilot/agent-team-kernel/protocol'
import { workflow } from './desktop-api'
import { sendCommand } from './command-sender'
import { secretSubmissions } from './secret-submissions'
import { useSubmission } from './use-submission'
import {
  parseCommandResult,
  parseProjectCreationResult,
} from '../../../packages/kernel-client/command-result'

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
      if (reason instanceof Error && reason.message.includes('MAINTENANCE_BUSY')) return
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
    perform(JSON.stringify(command), async (key) =>
      parseCommandResult(await sendCommand(command, key)),
    )
  const createProject = (
    input: Omit<Extract<BusinessCommand, { type: 'project.create' }>, 'type' | 'repositoryPath'>,
  ) =>
    perform(JSON.stringify({ type: 'project.create', ...input }), (key) =>
      workflow().createProject({ key, input }).then(parseProjectCreationResult),
    )
  const { saveModel, saveFeishu, saveRole } = secretSubmissions(perform)
  return { state, error, busy, refresh, execute, createProject, saveModel, saveFeishu, saveRole }
}

export type WorkspaceActions = ReturnType<typeof useWorkspace>
