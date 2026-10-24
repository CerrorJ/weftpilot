export const englishPreflight: Record<string, string> = {
  关闭: 'Close',
  'Git 地址': 'Git URL',
  技能: 'Skills',
  依赖任务: 'Task dependencies',
  执行前检查: 'Preflight check',
  本次执行配置: 'Configuration for this run',
  执行成员: 'Execution members',
  '通过配置检查后显示本次成员快照。':
    'Member snapshots appear after the configuration check passes.',
  代码基线: 'Code baseline',
  项目当前分支: 'Current project branch',
  当前提交: 'Current commit',
  分离头指针: 'Detached HEAD',
  待检查: 'Not checked',
  本地仓库: 'Local repository',
  工作目录方式: 'Working directory',
  '为本次执行建立独立目录（推荐）': 'Create an isolated directory for this run (recommended)',
  '启动后显示本次 Run 的实际分支与工作目录。':
    'The actual branch and working directory appear after the run is created.',
  '当前需要排队，启动条件满足后由内核调度。':
    'This run needs to queue. The kernel will schedule it when the conditions are met.',
  '确认后固定本次配置和 Git 基线；执行成功后仍需人工验收。':
    'Confirmation fixes this configuration and Git baseline. Successful execution still requires human acceptance.',
  'CLI 登录、版本与模型调用尚未在本次检查中验证；技能目录完整性在执行准备时复核。':
    'This check does not verify CLI sign-in, version compatibility or model calls. Skill directory integrity is checked during execution preparation.',
  '本次操作未确认，请重新检查当前状态。':
    'This operation was not confirmed. Check the current state again.',
  重新检查: 'Check again',
  确认并加入队列: 'Confirm and queue',
  确认并开始: 'Confirm and start',
  只读: 'Read only',
  工作区写入: 'Workspace write',
  并发上限: 'Concurrency limit',
  本次修订依据: 'Feedback for this revision',
  检查结果: 'Check results',
  开始前检查: 'Before starting',
  '正在检查实际配置与仓库…': 'Checking the actual configuration and repository…',
  执行前检查未完成: 'The preflight check did not complete.',
  '角色已启用，任务与技能版本引用可用':
    'Role enabled; task and skill version references are available',
  '仓库与默认分支检查通过，现有工作区干净':
    'Repository and default branch checks passed; the working directory is clean',
  当前有可用执行槽位: 'An execution slot is currently available',
  等待上游任务人工验收: 'Waiting for acceptance of upstream tasks',
  等待同项目执行结束: 'Waiting for the current project execution to end',
  等待角色并发名额: 'Waiting for role capacity',
  等待本机执行槽位: 'Waiting for local execution capacity',
  'CLI 登录状态尚未验证': 'CLI sign-in is not verified',
  'CLI 版本兼容性尚未验证': 'CLI version compatibility is not verified',
  实际模型调用尚未验证: 'An actual model call is not verified',
  '已找到所选 CLI 文件': 'The selected CLI executable was found',
  '未找到所选 CLI，请先安装并重启应用':
    'The selected CLI was not found. Install it and restart the app.',
  通过: 'Passed',
  阻塞: 'Blocked',
  等待: 'Waiting',
  未验证: 'Unverified',
}
