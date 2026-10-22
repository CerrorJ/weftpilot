export const productErrors: Record<string, [string, string]> = {
  MODEL_CONFIG_INVALID: [
    '模型配置与 CLI 或接口地址不兼容',
    'The model profile does not match the CLI or endpoint.',
  ],
  MODEL_CREDENTIAL_REQUIRED: [
    '模型配置尚未提供可用的安全凭据',
    'This model profile needs secure credentials.',
  ],
  CLI_MODEL_MISMATCH: [
    '所选模型配置与角色 CLI 不兼容',
    'The model profile does not match the role CLI.',
  ],
  TEAM_CONFIG_INVALID: [
    '团队成员必须唯一，协调者必须在成员中',
    'Members must be unique and include the coordinator.',
  ],
  CROSS_PROJECT_REFERENCE: [
    '需求或依赖必须属于同一项目',
    'Requirements and dependencies must belong to the same project.',
  ],
  ROLE_NOT_READY: [
    '角色未通过本版本试运行或尚未启用',
    'The role must pass a trial for this version and be enabled.',
  ],
  ROLE_TRIAL_ACTIVE: [
    '该角色已有在途或状态待确认的试运行',
    'This role already has an active or uncertain trial.',
  ],
  ROLE_TRIAL_OUTPUT_INVALID: [
    '试运行没有生成匹配的真实输出',
    'The trial did not produce the expected output.',
  ],
  TASK_NOT_EXECUTABLE: [
    '此记录需要使用对应的试运行或团队入口',
    'Use the trial or team entry point for this record.',
  ],
  TEAM_PLAN_INVALID: [
    '团队计划包含重复或无效的子任务引用',
    'The plan contains duplicate or invalid subtask references.',
  ],
  TEAM_DEPENDENCY_CYCLE: ['子任务不能形成循环依赖', 'Subtasks cannot have circular dependencies.'],
  TEAM_NOT_STARTED: ['请先启动所属团队任务', 'Start the parent team task first.'],
  TASK_NOT_TEAM: ['该任务不是团队任务', 'This is not a team task.'],
  DEPENDENCY_NOT_ACCEPTED: [
    '上游子任务尚未通过人工验收',
    'An upstream subtask is awaiting acceptance.',
  ],
  DEPENDENCY_PROJECT_MISMATCH: [
    '上游交付不属于当前项目',
    'The upstream delivery belongs to another project.',
  ],
  DEPENDENCY_PATCH_CONFLICT: [
    '上游代码贡献存在冲突，执行目录已保留，未启动 CLI',
    'Upstream code contributions conflict. The worktree is preserved and no CLI was started.',
  ],
}
