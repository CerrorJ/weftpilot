import { useEffect, useRef, useState, type RefObject } from 'react'
import { roleFeishuStatusSchema } from '@weftpilot/agent-team-kernel/protocol'
import type { z } from 'zod'
import { workflow } from './desktop-api'

type Status = z.infer<typeof roleFeishuStatusSchema>
interface PollingContext {
  role: { id: string; version: number }
  generation: RefObject<number>
  epoch: RefObject<number>
  operating: RefObject<boolean>
  setStatus: (status: Status) => void
  setError: (message: string) => void
}

/** 查询与控制只读内核状态；卸载/版本变化或新操作后丢弃迟到查询。 */
export const useRoleFeishu = (role: { id: string; version: number }) => {
  const [status, setStatus] = useState<Status>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const epoch = useRef(0)
  const operating = useRef(false)
  useRoleChannelPolling({ role, generation, epoch, operating, setStatus, setError })
  const perform = async (operation: 'connect' | 'disconnect') => {
    if (operating.current) return
    operating.current = true
    epoch.current++
    setBusy(true)
    setError('')
    const version = generation.current
    try {
      const result =
        operation === 'connect'
          ? await workflow().connectRoleFeishu({
              roleId: role.id,
              expectedRoleVersion: role.version,
            })
          : await workflow().disconnectRoleFeishu({ roleId: role.id })
      if (generation.current === version) setStatus(roleFeishuStatusSchema.parse(result))
    } catch (reason) {
      if (generation.current === version) setError(message(reason))
    } finally {
      operating.current = false
      if (generation.current === version) setBusy(false)
    }
  }
  return { status, error, busy, perform }
}

/** 控制操作会废弃此前查询，即使旧查询在操作完成后返回也不能覆盖新状态。 */
const useRoleChannelPolling = (context: PollingContext) => {
  const { role, generation, epoch, operating, setStatus, setError } = context
  useEffect(() => {
    const version = ++generation.current
    let querying = false
    const refresh = async () => {
      if (querying || operating.current) return
      querying = true
      const operation = epoch.current
      try {
        const result = roleFeishuStatusSchema.parse(
          await workflow().roleFeishuStatus({ roleId: role.id }),
        )
        if (generation.current === version && operation === epoch.current) setStatus(result)
      } catch (reason) {
        if (generation.current === version && operation === epoch.current) setError(message(reason))
      } finally {
        querying = false
      }
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 2000)
    return () => {
      generation.current++
      clearInterval(timer)
    }
  }, [role.id, role.version, generation, epoch, operating, setStatus, setError])
}

const message = (reason: unknown) => (reason instanceof Error ? reason.message : '操作未完成')
