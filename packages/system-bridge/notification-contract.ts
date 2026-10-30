import { z } from 'zod'

export const notificationOptionsSchema = z
  .object({
    enabled: z.boolean(),
    human: z.boolean(),
    review: z.boolean(),
    failure: z.boolean(),
  })
  .strict()
export const notificationPreferencesSchema = notificationOptionsSchema
  .extend({
    version: z.number().int().nonnegative(),
  })
  .strict()
export const notificationUpdateSchema = notificationOptionsSchema
  .extend({
    expectedVersion: z.number().int().nonnegative(),
  })
  .strict()
export const notificationStatusSchema = z
  .object({
    supported: z.boolean(),
    observation: z.enum(['starting', 'watching', 'unavailable']),
    preferences: notificationPreferencesSchema,
    last: z
      .object({
        kind: z.enum(['human', 'review', 'failure', 'test']),
        state: z.enum(['requested', 'shown', 'failed']),
        at: z.string().datetime(),
      })
      .strict()
      .optional(),
  })
  .strict()

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
export type NotificationUpdate = z.infer<typeof notificationUpdateSchema>
export type NotificationStatus = z.infer<typeof notificationStatusSchema>
export type NotificationKind = NonNullable<NotificationStatus['last']>['kind']
export const defaultNotificationPreferences: NotificationPreferences = {
  version: 0,
  enabled: false,
  human: true,
  review: true,
  failure: true,
}
