import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from './preferences'
import { SubmissionError } from './submission-error'

/** 原生模态框负责键盘焦点与Esc；表单提交仍由调用方等待真实内核回执。 */
export const CreateDialog = ({
  title,
  error,
  children,
}: {
  title: string
  error: string
  children: (close: () => void) => ReactNode
}) => {
  const { t } = useI18n()
  const dialog = useCreateDialog()
  return (
    <>
      <button className="primary" onClick={dialog.show}>
        {t(title)}
      </button>
      {dialog.open && (
        <dialog
          ref={dialog.element}
          className="create-dialog"
          aria-label={t(title)}
          onClose={dialog.close}
          onSubmitCapture={dialog.submitted}
        >
          <div className="dialog-heading">
            <h2>{t(title)}</h2>
            <button onClick={dialog.close}>{t('取消')}</button>
          </div>
          <SubmissionError message={dialog.attempted ? error : ''} />
          {children(dialog.close)}
        </dialog>
      )}
    </>
  )
}

const useCreateDialog = () => {
  const [open, setOpen] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const element = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) element.current?.showModal()
  }, [open])
  return {
    element,
    open,
    attempted,
    show: () => {
      setAttempted(false)
      setOpen(true)
    },
    close: () => setOpen(false),
    submitted: () => setAttempted(true),
  }
}
