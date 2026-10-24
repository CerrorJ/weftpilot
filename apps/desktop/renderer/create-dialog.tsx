import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from './preferences'
import { SubmissionError } from './submission-error'

/** 原生模态框负责键盘焦点与Esc；表单提交仍由调用方等待真实内核回执。 */
export const CreateDialog = ({
  title,
  error,
  children,
  primary = true,
  autoOpen = false,
  onClosed,
}: {
  title: string
  error: string
  children: (close: () => void, resetError: () => void) => ReactNode
  primary?: boolean
  autoOpen?: boolean
  onClosed?: () => void
}) => {
  const { t } = useI18n()
  const dialog = useCreateDialog()
  const dismiss = () => {
    dialog.close()
    onClosed?.()
  }
  useEffect(() => {
    if (autoOpen) dialog.show()
  }, [autoOpen, dialog.show])
  return (
    <>
      <button className={primary ? 'primary' : undefined} onClick={dialog.show}>
        {t(title)}
      </button>
      {dialog.open && (
        <dialog
          ref={dialog.element}
          className="create-dialog"
          aria-label={t(title)}
          onClose={dismiss}
          onSubmitCapture={dialog.submitted}
        >
          <div className="dialog-heading">
            <h2>{t(title)}</h2>
            <button onClick={dismiss}>{t('取消')}</button>
          </div>
          <SubmissionError message={dialog.attempted ? error : ''} />
          {children(dismiss, dialog.resetError)}
        </dialog>
      )}
    </>
  )
}

const useCreateDialog = () => {
  const [open, setOpen] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const element = useRef<HTMLDialogElement>(null)
  const show = useCallback(() => {
    setAttempted(false)
    setOpen(true)
  }, [])
  useEffect(() => {
    if (open) element.current?.showModal()
  }, [open])
  return {
    element,
    open,
    attempted,
    show,
    close: () => setOpen(false),
    submitted: () => setAttempted(true),
    resetError: () => setAttempted(false),
  }
}
