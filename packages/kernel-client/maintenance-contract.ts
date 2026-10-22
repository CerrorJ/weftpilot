import { z } from 'zod'
import { backupInspectionSchema, backupManifestSchema } from '@weftpilot/agent-team-kernel/protocol'

export const dataSlotSchema = z.union([z.literal('default'), z.string().uuid()])
export const restoreOperationSchema = z
  .object({
    id: z.string().uuid(),
    previousSlot: dataSlotSchema,
    candidateSlot: z.string().uuid(),
    phase: z.enum([
      'preparing',
      'prepared',
      'old_stopped',
      'activated',
      'rolled_back',
      'uncertain',
    ]),
    updatedAt: z.string().datetime(),
  })
  .strict()
export type RestoreOperation = z.infer<typeof restoreOperationSchema>
export const maintenanceStatusSchema = z
  .object({ slot: dataSlotSchema, operation: restoreOperationSchema.nullable() })
  .strict()
export const backupSelectionSchema = backupInspectionSchema
  .extend({ ticket: z.string().uuid(), directory: z.string().min(1) })
  .strict()
export const backupCreationSchema = z
  .object({ directory: z.string().min(1), manifest: backupManifestSchema })
  .strict()
export const cancelledSchema = z.object({ cancelled: z.literal(true) }).strict()
