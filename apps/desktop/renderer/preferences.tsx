import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { english } from './english'
import { translateError } from './error-messages'

export type Language = 'zh-CN' | 'en'
export type Theme = 'system' | 'light' | 'dark'
interface Preferences {
  language: Language
  theme: Theme
}
const defaults: Preferences = { language: 'zh-CN', theme: 'system' }
const readPreferences = (): Preferences => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('weftpilot.preferences') ?? '{}')
    if (typeof value !== 'object' || value === null) return defaults
    const language = 'language' in value && value.language === 'en' ? 'en' : 'zh-CN'
    const theme =
      'theme' in value && (value.theme === 'light' || value.theme === 'dark')
        ? value.theme
        : 'system'
    return { language, theme }
  } catch {
    return defaults
  }
}

interface PreferenceContext extends Preferences {
  setLanguage(value: Language): void
  setTheme(value: Theme): void
  t(text: string): string
}
const Context = createContext<PreferenceContext | null>(null)

/** 只持久化界面偏好，不持有任何任务或执行状态。系统主题通过媒体查询持续跟随。 */
export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState(readPreferences)
  useEffect(() => {
    document.documentElement.lang = preferences.language
    document.documentElement.dataset.theme = preferences.theme
    void window.weftpilot?.appearance(preferences).catch(() => undefined)
    try {
      localStorage.setItem('weftpilot.preferences', JSON.stringify(preferences))
    } catch {
      /* 存储不可用时本次会话仍可切换。 */
    }
  }, [preferences])
  return (
    <Context
      value={{
        ...preferences,
        setLanguage: (language) => setPreferences((current) => ({ ...current, language })),
        setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
        t: (text) =>
          translateError(text, preferences.language === 'en') ??
          (preferences.language === 'en' ? (english[text] ?? text) : text),
      }}
    >
      {children}
    </Context>
  )
}

export const useI18n = () => {
  const context = useContext(Context)
  if (!context) throw new Error('PreferencesProvider is required')
  return context
}

export const AppearanceSettings = ({ expanded = false }: { expanded?: boolean }) => {
  const { language, theme, setLanguage, setTheme, t } = useI18n()
  return (
    <details className="appearance-settings" open={expanded || undefined}>
      <summary>{t('设置')}</summary>
      <label>
        {t('语言')}
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value === 'en' ? 'en' : 'zh-CN')}
        >
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <label>
        {t('外观')}
        <select
          value={theme}
          onChange={(event) => {
            const value = event.target.value
            setTheme(value === 'light' || value === 'dark' ? value : 'system')
          }}
        >
          <option value="system">{t('跟随系统')}</option>
          <option value="light">{t('浅色')}</option>
          <option value="dark">{t('深色')}</option>
        </select>
      </label>
    </details>
  )
}
