import type { z } from 'zod'

/** IPC输入只返回稳定错误码，不将原始校验结构、字段值或内部通道名作为产品提示。 */
export const parseInput = <T>(schema: z.ZodType<T>, raw: unknown): T => {
  const result = schema.safeParse(raw)
  if (!result.success) throw new Error('INPUT_INVALID')
  return result.data
}
