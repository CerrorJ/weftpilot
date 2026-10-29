import { englishProduct } from './english-product'
import { englishHuman } from './english-human'
import { englishFeishu } from './english-feishu'
import { englishRoleFeishu } from './english-role-feishu'
import { englishSkills } from './english-skills'
import { englishBackup } from './english-backup'
import { englishDiagnostics } from './english-diagnostics'
import { englishShell } from './english-shell'
import { englishRoleWizard } from './english-role-wizard'
import { englishPreflight } from './english-preflight'
import { englishReview } from './english-review'
import { englishRoleCards } from './english-role-cards'
import { englishCliChecks } from './english-cli-checks'
import { englishRoleCopy } from './english-role-copy'
import { englishRoleDrafts } from './english-role-drafts'
import { englishProjects } from './english-projects'
import { englishTeams } from './english-teams'
import { englishTaskBoard } from './english-task-board'
export const english: Record<string, string> = {
  ...englishShell,
  ...englishRoleWizard,
  ...englishPreflight,
  ...englishReview,
  ...englishRoleCards,
  ...englishCliChecks,
  ...englishRoleCopy,
  ...englishRoleDrafts,
  ...englishProjects,
  ...englishTeams,
  ...englishTaskBoard,
  ...englishProduct,
  ...englishHuman,
  ...englishFeishu,
  ...englishRoleFeishu,
  ...englishSkills,
  ...englishBackup,
  ...englishDiagnostics,
  纬舟: 'WeftPilot',
  任务与交付: 'Tasks & deliveries',
  项目与角色: 'Projects & roles',
  内核信息: 'Kernel',
  '让 AI 团队，有序抵达。': 'Bring your AI team to delivery.',
  '关闭窗口后继续运行；从应用菜单完全退出。':
    'Closing the window keeps tasks running. Quit from the app menu.',
  设置: 'Settings',
  语言: 'Language',
  主导航: 'Main navigation',
  '内核连接已中断，状态待确认': 'Kernel disconnected. Execution state is uncertain.',
  '内核连接已中断，请重启纬舟后重新检测': 'Kernel disconnected. Restart WeftPilot and check again.',
  '内核响应超时，执行状态待确认': 'Kernel response timed out. Execution state is uncertain.',
  外观: 'Appearance',
  跟随系统: 'System',
  浅色: 'Light',
  深色: 'Dark',
  '连接本机 Git 仓库，为真实执行配置职责与权限。':
    'Connect a local Git repository and configure responsibilities and permissions.',
  '从明确目标出发，执行结果由你验收。': 'Start with a clear goal. Review the result yourself.',
  刷新状态: 'Refresh',
  '正在读取内核状态…': 'Reading kernel state…',
  项目仓库: 'Project repositories',
  '选择已有 Git 仓库；每次执行使用独立分支与工作目录，主目录有未提交改动时阻止启动。':
    'Choose a Git repository. Each run uses its own branch and worktree. Uncommitted changes block execution.',
  项目名称: 'Project name',
  默认分支: 'Default branch',
  '默认分支：': 'Default branch: ',
  选择仓库并添加: 'Choose repository & add',
  '本地仓库（未配置 origin）': 'Local repository (no origin)',
  执行角色: 'Execution roles',
  '配置变更生成新版本，已有 Run 保留原快照。当前使用 Codex 本机账户；模型认证会在真实执行中验证。':
    'Changes create a new version. Existing runs keep their snapshots. Codex uses the local account; authentication is checked during execution.',
  编辑角色: 'Edit role',
  新建角色: 'New role',
  角色名称: 'Role name',
  职责: 'Responsibilities',
  '模型（可选）': 'Model (optional)',
  '留空使用 CLI 默认模型': 'Leave blank for CLI default',
  工具权限: 'Tool permissions',
  只读建议: 'Read-only',
  隔离工作目录内写入: 'Write within isolated worktree',
  '不会绕过 CLI 沙箱；Windows 使用 MXC，不支持时执行会明确失败。M1 不加载用户 CLI 配置或项目自定义扩展。':
    'CLI sandboxing remains enabled. Windows uses MXC and fails explicitly if unsupported. M1 ignores user CLI configuration and custom project extensions.',
  保存新版本: 'Save new version',
  创建角色: 'Create role',
  创建任务: 'Create task',
  所属项目: 'Project',
  请先添加项目: 'Add a project first',
  请先创建角色: 'Create a role first',
  任务名称: 'Task name',
  任务目标: 'Goal',
  验收条件: 'Acceptance criteria',
  创建待执行任务: 'Create task',
  待执行: 'Ready',
  执行中: 'Running',
  待验收: 'Awaiting review',
  已验收: 'Accepted',
  状态待确认: 'State uncertain',
  排队中: 'Queued',
  准备目录: 'Preparing worktree',
  停止中: 'Stopping',
  已停止: 'Stopped',
  执行成功: 'Execution succeeded',
  执行失败: 'Execution failed',
  已取消: 'Cancelled',
  已中断: 'Interrupted',
  还没有任务: 'No tasks yet',
  '先在“项目与角色”中完成配置，再创建一个目标明确、可验收的任务。':
    'Configure a project and role, then create a task with a clear goal and acceptance criteria.',
  任务列表: 'Task list',
  执行历史: 'Run history',
  第: 'Run',
  '次执行 ·': ' ·',
  '次 ·': ' ·',
  开始真实执行: 'Start execution',
  请求停止: 'Request stop',
  '创建新 Run 重试': 'Retry in a new run',
  '内核无法确认原进程是否结束，已阻止重试与继续写入。请保留现场并查看诊断。':
    'The kernel cannot confirm that the previous process ended. Retries and further writes are blocked. Preserve the workspace and inspect diagnostics.',
  '停止请求已记录，正在确认进程树结束。':
    'Stop requested. Waiting for confirmation that the process tree ended.',
  '失败原因：': 'Failure: ',
  角色快照: 'Role snapshot',
  'CLI 默认模型': 'CLI default model',
  执行分支: 'Execution branch',
  工作目录: 'Work directory',
  基准提交: 'Baseline commit',
  进程状态: 'Process state',
  执行日志: 'Activity log',
  '显示本次 Run 最近 100 条工具与事件类型；等待模型时不显示虚构进度。':
    'The latest 100 tool and event types for this run. No estimated progress is shown while waiting for the model.',
  '日志读取失败，请刷新重试': 'Unable to load activity. Refresh and try again.',
  '仅保留工具与事件类型；等待模型时不显示虚构进度。':
    'Logs retain tool and event types. No estimated progress is shown while waiting for the model.',
  '交付 v': 'Delivery v',
  'CLI 已成功结束，交付仍需人工验收。':
    'CLI execution succeeded. The delivery still needs your review.',
  '保留本次执行已有的结果，未视为成功交付。':
    'Partial results are retained. This run is not marked successful.',
  执行结果: 'Result',
  '本次执行没有文本结果。': 'No text result.',
  代码变更: 'Code changes',
  '没有代码差异。': 'No code changes.',
  '交付提交：': 'Delivery commit: ',
  验收通过: 'Accept delivery',
  验收退回: 'Returned',
  未填写备注: 'No note',
  '验收备注 / 退回原因': 'Review note / return reason',
  退回并保留原因: 'Return with reason',
  本机工作台: 'Local workspace',
  '查看执行内核的连接与运行环境。': 'Inspect the kernel connection and runtime.',
  '正在连接…': 'Connecting…',
  重新检测: 'Check again',
  '连接中断 · 状态待确认': 'Disconnected · state uncertain',
  'Agent-Team 内核已连接': 'Agent-Team kernel connected',
  '正在连接内核…': 'Connecting to kernel…',
  开始前: 'About this workspace',
  '项目、角色和任务由同一内核管理。这里展示实际运行的版本及产物摘要。':
    'Projects, roles and tasks share one kernel. These are the running version and artifact digest.',
  '关闭窗口后，纬舟保留在系统托盘。使用菜单中的“完全退出”结束内核。':
    'Closing the window keeps WeftPilot in the system tray. Use Quit in the app menu to stop the kernel.',
  内核运行信息: 'Kernel runtime',
  内核版本: 'Kernel version',
  '协议 / 数据版本': 'Protocol / data version',
  源提交: 'Source commit',
  产物摘要: 'Artifact digest',
  运行环境: 'Runtime',
  系统凭据存储: 'System credential storage',
  可用: 'Available',
  '不可用 · 凭据写入已阻止': 'Unavailable · credential writes blocked',
  '收到的诊断信息无效，请重新连接': 'Invalid diagnostics received. Reconnect to the app.',
  '桌面桥接不可用，请从纬舟应用打开': 'Desktop bridge unavailable. Open WeftPilot.',
  连接失败: 'Connection failed',
  操作未完成: 'Operation did not complete',
}
