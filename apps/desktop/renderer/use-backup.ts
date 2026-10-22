import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import {
  backupCreationSchema,
  backupSelectionSchema,
  cancelledSchema,
  maintenanceStatusSchema,
} from '../../../packages/kernel-client/maintenance-contract'
import { useI18n } from './preferences'
import { workflow } from './desktop-api'

export const useBackup = () => {
  const { language } = useI18n()
  const [preview, setPreview] = useState<z.infer<typeof backupSelectionSchema>>()
  const [created, setCreated] = useState<z.infer<typeof backupCreationSchema>>()
  const { busy, error, setError, perform } = useMaintenanceAction()
  const backupKey = useRef<string | undefined>(undefined)
  const status = useMaintenanceStatus(setError)
  const create = (chooseAnother = false) =>
    perform(async () => {
      if (chooseAnother) backupKey.current = undefined
      backupKey.current ??= crypto.randomUUID()
      const response = await workflow().createBackup({ key: backupKey.current, language })
      if (cancelledSchema.safeParse(response).success) {
        backupKey.current = undefined
        return
      }
      setCreated(backupCreationSchema.parse(response))
      backupKey.current = undefined
    })
  const select = () =>
    perform(async () => {
      setPreview(undefined)
      const response = await workflow().selectBackup(language)
      if (!cancelledSchema.safeParse(response).success)
        setPreview(backupSelectionSchema.parse(response))
    })
  const restore = () =>
    perform(async () => {
      if (!preview) return
      const ticket = preview.ticket
      setPreview(undefined)
      await restoreSelectedBackup(ticket)
    })
  return {
    preview,
    created,
    status,
    busy,
    error,
    create,
    select,
    restore,
    canChooseAgain: backupKey.current !== undefined,
  }
}

const useMaintenanceStatus = (setError: (error: string) => void) => {
  const [status, setStatus] = useState<z.infer<typeof maintenanceStatusSchema>>()
  useEffect(() => {
    void workflow()
      .maintenanceStatus()
      .then((value) => setStatus(maintenanceStatusSchema.parse(value)))
      .catch((reason) => setError(String(reason)))
  }, [setError])
  return status
}

const restoreSelectedBackup = async (ticket: string): Promise<void> => {
  const result = await workflow().restoreBackup(ticket)
  z.object({ restored: z.literal(true) })
    .strict()
    .parse(result)
  window.location.reload()
}

const useMaintenanceAction = () => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const perform = async (operation: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await operation()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, perform }
}
