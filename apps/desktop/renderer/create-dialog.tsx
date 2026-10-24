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
  trigger,
  disabled = false,
  closeIcon = false,
}: {
  title: string
  error: string
  children: (close: () => void, resetError: () => void) => ReactNode
  primary?: boolean
  autoOpen?: boolean
  onClosed?: () => void
  trigger?: string
  disabled?: boolean
  closeIcon?: boolean
}) => {
  const { t } = useI18n()
  const dialog = useCreateDialog()
  const dismiss = () => {
    if (dialog.close()) onClosed?.()
  }
  useEffect(() => {
    if (autoOpen) dialog.show()
  }, [autoOpen, dialog.show])
  return (
    <>
      <button className={primary ? 'primary' : undefined} onClick={dialog.show} disabled={disabled}>
        {t(trigger ?? title)}
      </button>
      {dialog.open && (
        <CreateDialogSurface
          dialog={dialog}
          dismiss={dismiss}
          title={title}
          error={error}
          closeIcon={closeIcon}
        >
          {children(dismiss, dialog.resetError)}
        </CreateDialogSurface>
      )}
    </>
  )
}

interface DialogSurfaceProps {
  dialog: ReturnType<typeof useCreateDialog>
  dismiss: () => void
  title: string
  error: string
  closeIcon: boolean
  children: ReactNode
}

const CreateDialogSurface = ({
  dialog,
  dismiss,
  title,
  error,
  closeIcon,
  children,
}: DialogSurfaceProps) => {
  const { t } = useI18n()
  return (
    <dialog
      ref={dialog.element}
      className="create-dialog"
      aria-label={t(title)}
      onClose={(event) => {
        // React会沿组件树传递close；关闭交付子弹窗不能顺带关闭历史快照。
        event.stopPropagation()
        dismiss()
      }}
      onSubmitCapture={dialog.submitted}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation()
      }}
    >
      <div className="dialog-heading">
        <h2>{t(title)}</h2>
        <button onClick={dismiss} aria-label={t(closeIcon ? '关闭' : '取消')}>
          {closeIcon ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            t('取消')
          )}
        </button>
      </div>
      <SubmissionError message={dialog.attempted ? error : ''} />
      {children}
    </dialog>
  )
}

const useCreateDialog = () => {
  const [open, setOpen] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const element = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const closing = useRef(false)
  const show = useCallback(() => {
    closing.current = false
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
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
    close: () => {
      if (closing.current) return false
      closing.current = true
      // 先退出原生模态状态再归还焦点；仅卸载dialog会让点击关闭后的焦点落到body。
      element.current?.close()
      setOpen(false)
      if (trigger.current?.isConnected) trigger.current.focus()
      return true
    },
    submitted: () => setAttempted(true),
    resetError: () => setAttempted(false),
  }
}
