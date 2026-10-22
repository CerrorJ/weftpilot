import { useEffect, useState } from 'react'
import { feishuStatusSchema } from '@weftpilot/agent-team-kernel/protocol'
import type { z } from 'zod'
import { workflow } from './desktop-api'

/** 渠道状态也是内核查询结果；页面不自行推断连接成功或权限已齐备。 */
export const useFeishu = () => {
  const [status, setStatus] = useState<z.infer<typeof feishuStatusSchema>>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const result = feishuStatusSchema.parse(await workflow().feishuStatus())
        if (active) setStatus(result)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : '操作未完成')
      }
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 2000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])
  const perform = async (operation: 'connect' | 'disconnect' | 'console') => {
    setBusy(true)
    setError('')
    try {
      if (operation === 'console') await workflow().openFeishuConsole()
      else {
        const result =
          operation === 'connect'
            ? await workflow().connectFeishu()
            : await workflow().disconnectFeishu()
        setStatus(feishuStatusSchema.parse(result))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '操作未完成')
    } finally {
      setBusy(false)
    }
  }
  return { status, error, busy, perform }
}
