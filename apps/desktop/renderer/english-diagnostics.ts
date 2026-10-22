export const diagnosticLabels: Record<string, string> = {
  DATABASE_INTEGRITY: '数据库完整性',
  PROCESS_RECONCILIATION: '待核对进程数量',
  PROJECT_DIRECTORIES: '不可达项目目录数量',
  ROLE_TRIAL_REQUIRED: '历史就绪角色数量',
  SKILL_INTEGRITY: '技能文件完整性',
  SKILL_SCAN_LIMIT: '超出本次技能扫描上限的数量',
  WORKSPACE_DATA_INVALID: '业务数据结构无效，请保留现场并检查备份',
  WORKSPACE_CHECKS_UNAVAILABLE: '依赖业务快照的检查不可用',
}
export const diagnosticStates: Record<string, string> = {
  passed: '通过',
  attention: '需要检查',
  failed: '检查失败',
  unchecked: '未检测',
}
export const englishDiagnostics: Record<string, string> = {
  通过: 'Passed',
  环境检查: 'Environment checks',
  桌面版本: 'Desktop version',
  '只读检查，不启动任务、不读取登录文件，也不会自动修复数据。':
    'Read-only checks. No tasks are started, login files read, or data repaired automatically.',
  检查时间: 'Checked at',
  数据库完整性: 'Database integrity',
  待核对进程数量: 'Uncertain process count',
  不可达项目目录数量: 'Unavailable project directory count',
  历史就绪角色数量: 'Previously ready role count',
  技能文件完整性: 'Skill file integrity',
  超出本次技能扫描上限的数量: 'Skills beyond this scan limit',
  '业务数据结构无效，请保留现场并检查备份':
    'Invalid business data. Preserve the data and check your backups.',
  依赖业务快照的检查不可用: 'Checks that require business data are unavailable',
  需要检查: 'Needs attention',
  检查失败: 'Check failed',
  未检测: 'Unchecked',
  程序可定位: 'Program located',
  未找到受支持入口: 'Supported executable not found',
  'CLI 版本与认证未检测；请在角色页面进行真实试运行。历史就绪数量不代表当前认证有效。':
    'CLI versions and authentication are unchecked. Run a real role trial. Previously ready roles do not prove current authentication.',
  诊断报告预览: 'Diagnostic report preview',
  '仅导出以上版本、检查码、状态、数量和对象编号，不含本机路径、业务正文或凭据。':
    'Exports only the versions, check codes, states, counts, and object IDs shown above. Excludes local paths, business content, and credentials.',
  导出已预览报告: 'Export previewed report',
  '正在导出…': 'Exporting…',
  已导出: 'Exported',
}
export const diagnosticErrors: Record<string, [string, string]> = {
  DIAGNOSTIC_PREVIEW_STALE: [
    '诊断预览已过期，请重新检测后导出',
    'The diagnostic preview expired. Run the checks again before exporting.',
  ],
  DIAGNOSTIC_EXPORT_FAILED: [
    '诊断报告导出失败，原文件未替换，请改选可写位置',
    'The diagnostic report could not be exported. The original file was not replaced. Choose a writable location.',
  ],
}
