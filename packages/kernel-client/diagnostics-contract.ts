import { z } from 'zod'
import {
  handshakeSchema,
  environmentDiagnosticsSchema,
} from '@weftpilot/agent-team-kernel/protocol'

export const diagnosticReportSchema = z
  .object({
    handshake: handshakeSchema,
    artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
    credentialsAvailable: z.boolean(),
    desktop: z
      .object({
        version: z.string().min(1).max(100),
        electron: z.string().min(1).max(100),
        chromium: z.string().min(1).max(100),
      })
      .strict(),
    environment: environmentDiagnosticsSchema,
  })
  .strict()
export const diagnosticPreviewSchema = diagnosticReportSchema.extend({ ticket: z.string().uuid() })
export const diagnosticExportInputSchema = z
  .object({
    ticket: z.string().uuid(),
    language: z.enum(['zh-CN', 'en']),
  })
  .strict()
export const diagnosticExportResultSchema = z.discriminatedUnion('canceled', [
  z.object({ canceled: z.literal(true) }).strict(),
  z.object({ canceled: z.literal(false), fileName: z.string().min(1) }).strict(),
])
export type DiagnosticReport = z.infer<typeof diagnosticReportSchema>
