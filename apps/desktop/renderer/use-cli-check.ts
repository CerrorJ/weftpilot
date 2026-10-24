import { useEffect, useRef, useState } from 'react'
import {
  cliCheckResultSchema,
  type CliCheckInput,
  type CliCheckResult,
} from '@weftpilot/agent-team-kernel/protocol'

export const useCliCheck = (cli: CliCheckInput['cli']) => {
  const [results, setResults] = useState<Partial<Record<CliCheckInput['check'], CliCheckResult>>>(
    {},
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mounted = useRef(true)
  const pending = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const check = async (kind: CliCheckInput['check']) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    setResults((current) => ({ ...current, [kind]: undefined }))
    try {
      const result = cliCheckResultSchema.parse(
        await window.weftpilot!.workflow.checkCli({ cli, check: kind }),
      )
      if (result.cli !== cli || result.check !== kind) throw new Error('CLI_CHECK_RESPONSE_INVALID')
      if (mounted.current) setResults((current) => ({ ...current, [kind]: result }))
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof Error && /\bCLI_CHECK_BUSY\b/.test(failure.message)
            ? 'CLI_CHECK_BUSY'
            : 'CLI检查未完成，请稍后重试；若有未确认进程，请保留现场并查看诊断。',
        )
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return { results, busy, error, check }
}
