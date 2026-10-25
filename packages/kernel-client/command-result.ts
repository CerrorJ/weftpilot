import { z } from 'zod'

const resultSchema = z.object({ id: z.string().uuid() }).strict()
const cancelledSchema = z.object({ cancelled: z.literal(true) }).strict()

/** 系统选择器明确取消才视为取消；畸形回执仍保持结果待确认。 */
export const parseProjectCreationResult = (raw: unknown): { id: string } | { cancelled: true } =>
  cancelledSchema.safeParse(raw).success ? { cancelled: true } : parseCommandResult(raw)

/** 仅核对命令回执；结果不明时由调用方保留幂等键，不猜测新对象或重发副作用。 */
export const parseCommandResult = (raw: unknown): { id: string } => {
  const parsed = resultSchema.safeParse(raw)
  if (!parsed.success) throw new Error('COMMAND_RESULT_UNCERTAIN')
  return parsed.data
}
