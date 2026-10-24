export const englishCliChecks: Record<string, string> = {
  CLI分项检查: 'Separate CLI checks',
  CLI版本: 'CLI version',
  CLI登录状态: 'CLI sign-in status',
  模型连接: 'Model connection',
  尚未检查: 'Not checked',
  读取版本: 'Read version',
  检查登录状态: 'Check sign-in status',
  '检查中，正在等待CLI返回。': 'Checking. Waiting for the CLI to return.',
  '尚未验证；保存后在最后一步真实试运行':
    'Unverified. Save, then run a real trial in the final step.',
  '登录状态仅针对CLI默认环境，不证明凭据仍有效，也不代表当前模型配置已连通。':
    'Sign-in status applies to the default CLI environment. It does not verify credential validity or connectivity for this model configuration.',
  '检查不会保存角色或创建Run；关闭表单不等于停止检查，完全退出由内核确认进程结束。':
    'Checks do not save roles or create runs. Closing the form does not stop a check. The kernel confirms process termination before the app quits.',
  '已读取版本（未确认功能兼容性）': 'Version read; feature compatibility unverified',
  'CLI报告已登录（未验证服务调用）': 'CLI reports signed in; service requests unverified',
  CLI报告未登录: 'CLI reports signed out',
  检查失败: 'Check failed',
  'CLI输出无法识别，请核对版本': 'CLI output not recognized. Check its version.',
  '输出超限，检查进程已结束': 'Output limit exceeded. Check process ended.',
  '检查超时，进程已结束': 'Check timed out. Process ended.',
  '状态待确认，禁止重复检查': 'Process state uncertain. Repeating the check is blocked.',
  'CLI检查未完成，请稍后重试；若有未确认进程，请保留现场并查看诊断。':
    'The CLI check did not complete. Retry later. Preserve the state and inspect diagnostics if a process is uncertain.',
}
