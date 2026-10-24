import { useState } from 'react'
import type { ModelProfile, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { RoleDraft } from './role-draft'
import { RoleRuntime } from './role-runtime'
import { RoleEnvironment } from './role-environment'

/** 环境结果属于明确CLI；切换引擎卸载旧查询视图，旧响应不能覆盖新引擎。 */
export const RoleRuntimeStep = (props: {
  role: RoleVersion | undefined
  models: ModelProfile[]
  draft: RoleDraft
}) => {
  const [cli, setCli] = useState(props.draft.cli)
  return (
    <>
      <RoleRuntime {...props} onCliChange={setCli} />
      <RoleEnvironment key={cli} cli={cli} />
    </>
  )
}
