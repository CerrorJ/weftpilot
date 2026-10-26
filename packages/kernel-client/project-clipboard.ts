import { z } from 'zod'
import { projectInspectionInputSchema } from '@weftpilot/agent-team-kernel/protocol'

/** 只允许复制内核当前返回的项目地址，不暴露通用剪贴板读写能力。 */
export const projectGitCopyInputSchema = projectInspectionInputSchema
  .extend({
    projectVersion: z.number().int().positive(),
    gitUrl: z.string().min(1).max(4096),
  })
  .strict()
export const projectGitCopyReceiptSchema = projectGitCopyInputSchema
  .extend({ copied: z.literal(true) })
  .strict()
export type ProjectGitCopyInput = z.infer<typeof projectGitCopyInputSchema>
export type ProjectGitCopyReceipt = z.infer<typeof projectGitCopyReceiptSchema>

// 这是内核已有的不可用展示标记，不在桌面重新解析Git URL或处理凭据。
export const isCopyableGitAddress = (value: string): boolean =>
  value.length > 0 && value !== '[invalid remote URL]'
