import { useEffect, useRef } from 'react'

/** 顶部临时弹层离开即关闭；设置页常驻字段不参与关闭，也不拦截其Escape。 */
export const useAppearanceDismissal = (expanded: boolean) => {
  const root = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const details = root.current
    if (expanded || !details) return
    const outside = (event: Event) => {
      if (!details.open || !(event.target instanceof Node) || details.contains(event.target)) return
      details.open = false
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !details.open) return
      event.stopPropagation()
      details.open = false
      details.querySelector('summary')?.focus()
    }
    // 捕获外部点击时先收起，再让原点击继续导航，避免新详情被旧弹层遮挡。
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape, true)
    }
  }, [expanded])
  return root
}
