import { z } from 'zod'

const taskIdSchema = z.string().uuid()

/** 点击可早于React挂载；仅暂存最新UI导航意图，不持有任务状态或决定。 */
export const createNotificationTaskInbox = () => {
  let pending: string | undefined
  let listener: ((id: string) => void) | undefined
  const dispatch = () => {
    if (!pending || !listener) return
    const id = pending
    pending = undefined
    listener(id)
  }
  return {
    receive: (raw: unknown) => {
      const result = taskIdSchema.safeParse(raw)
      if (!result.success) return
      pending = result.data
      dispatch()
    },
    subscribe: (receive: (id: string) => void) => {
      listener = receive
      queueMicrotask(() => {
        if (listener === receive) dispatch()
      })
      return () => {
        if (listener === receive) listener = undefined
      }
    },
  }
}
