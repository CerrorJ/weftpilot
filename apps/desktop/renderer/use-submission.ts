import { useRef, useState } from 'react'

/** 网络或跨进程结果不明时保留命令键，由内核回执决定是否已经提交。 */
export const useSubmission = (options: {
  refresh: () => Promise<void>
  setError: (message: string) => void
}) => {
  const [busy, setBusy] = useState(false)
  const keys = useRef(new Map<string, string>())
  const perform = async (fingerprint: string, action: (key: string) => Promise<unknown>) => {
    setBusy(true)
    options.setError('')
    const key = keys.current.get(fingerprint) ?? crypto.randomUUID()
    keys.current.set(fingerprint, key)
    try {
      const result = await action(key)
      keys.current.delete(fingerprint)
      await options.refresh()
      return result
    } catch (reason) {
      options.setError(reason instanceof Error ? reason.message : '操作未完成')
      return undefined
    } finally {
      setBusy(false)
    }
  }
  return { perform, busy }
}
