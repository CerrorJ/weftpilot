import type { ReactNode } from 'react'
import { useI18n } from './preferences'

export const PageHeading = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) => {
  const { t } = useI18n()
  return (
    <header className="page-heading">
      <div>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {children}
    </header>
  )
}
