import type { SkillSource } from '@weftpilot/agent-team-kernel/protocol'

/** 同名来源仍是不同身份；短ID放在前面，避免窄控件截断后看不出所选来源。 */
export const skillSourceLabel = (source: SkillSource, sources: SkillSource[]): string => {
  const others = sources.filter((item) => item.id !== source.id && item.name === source.name)
  if (!others.length) return source.name
  let length = 8
  while (
    length < source.id.length &&
    others.some((item) => item.id.slice(0, length) === source.id.slice(0, length))
  )
    length++
  return `${source.id.slice(0, length)} · ${source.name} · ${source.repository}`
}
