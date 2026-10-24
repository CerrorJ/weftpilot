import { z } from 'zod'

const resultSchema = z.object({ id: z.string().uuid() }).strict()

/** 仅核对命令回执；结果不明时由调用方保留幂等键，不猜测新对象或重发副作用。 */
export const parseCommandResult = (raw: unknown): { id: string } => {
  const parsed = resultSchema.safeParse(raw)
  if (!parsed.success) throw new Error('COMMAND_RESULT_UNCERTAIN')
  return parsed.data
}
