import type { ReactNode } from 'react'
import { useI18n } from './preferences'

export const PageHeading = ({
  title,
  description,
  children,
  eyebrow,
}: {
  title: string
  description: string
  children?: ReactNode
  eyebrow?: string
}) => {
  const { t } = useI18n()
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {children}
    </header>
  )
}
