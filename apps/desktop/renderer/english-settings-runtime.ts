export const englishSettingsRuntime: Record<string, string> = {
  通知与后台: 'Notifications & background',
  '在需要你介入时提醒。默认关闭本机通知，任务状态仍由内核维护。':
    'Get reminders when you are needed. Local notifications start disabled; the kernel owns task state.',
  '正在读取本机通知设置…': 'Reading local notification settings…',
  本机通知设置未载入: 'Local notification settings could not be loaded',
  重新载入偏好: 'Reload preferences',
  启用本机系统通知: 'Enable local system notifications',
  提醒内容: 'Notify me about',
  任务需要澄清或审批时通知: 'Clarifications and approvals',
  交付物等待验收时通知: 'Deliveries awaiting review',
  执行失败时通知: 'Failed executions',
  保存通知偏好: 'Save notification preferences',
  '通知偏好已在其他操作中更新，当前输入保留；重新载入会替换当前输入。':
    'Preferences changed elsewhere. Your inputs are preserved; reloading will replace them.',
  正在建立通知基线: 'Preparing notification baseline',
  正在观察内核变化: 'Watching kernel changes',
  通知观察暂不可用: 'Notification monitoring is unavailable',
  已提交系统通知请求: 'Notification requested from the system',
  系统已确认通知: 'The system acknowledged the notification',
  系统通知未能显示: 'The system could not show the notification',
  当前系统支持通知接口: 'This system supports the notification interface',
  当前系统不支持通知接口: 'This system does not support the notification interface',
  发送测试通知: 'Send test notification',
  测试通知: 'Test notification',
  澄清或审批: 'Clarification or approval',
  交付验收: 'Delivery review',
  '同类变化合并提醒，不补发启动前历史待办；系统权限、勿扰和安装状态会影响显示。':
    'Similar changes are grouped. Existing items are not replayed at startup. System permissions, Do Not Disturb, and installation affect display.',
  '通知只含固定提示，不包含任务正文。点击后打开对应任务，不自动批准或验收。':
    'Notifications contain a fixed reminder, without task contents. Clicking opens the task and never approves or accepts it.',
  '关闭窗口后继续运行；从托盘或系统菜单完全退出。':
    'Closing the window keeps work running. Quit completely from the tray or system menu.',
  角色飞书连接: 'Role Feishu connections',
  '配置在角色中按版本保存。展开一位角色后查询实际连接，不将保存当作平台已就绪。':
    'Configuration belongs to a role version. Expand a role to query its connection; a saved binding does not mean the platform is ready.',
  查看连接状态: 'View connection status',
  收起连接状态: 'Hide connection status',
  '旧工作空间渠道（兼容）': 'Legacy workspace channel',
  '仅继承旧渠道的角色使用此配置；独立角色绑定不被覆盖。':
    'This configuration serves roles inheriting the legacy channel. Independent role bindings stay intact.',
  '已保存，连接待查询': 'Saved; connection not queried',
  '已保存，未许可连接': 'Saved; connection not permitted',
  配置角色: 'Configure role',
  '本窗口草稿暂存于内存，重载或退出后无法恢复。':
    'Drafts are held in this window’s memory. Reloading or quitting will discard them.',
}

export const notificationErrors: Record<string, [string, string]> = {
  NOTIFICATION_UNAVAILABLE: [
    '本机通知操作未完成，请重新载入并核对设置',
    'The local notification operation did not complete. Reload and check preferences.',
  ],
  NOTIFICATION_PREFERENCES_UNAVAILABLE: [
    '通知偏好无法读取或保存，尚未确认新设置生效',
    'Notification preferences could not be read or saved. New settings are not confirmed.',
  ],
  NOTIFICATION_PREFERENCES_CONFLICT: [
    '通知偏好已有新版本，输入已保留；请明确重新载入后保存',
    'Preferences changed. Your inputs are preserved; reload explicitly before saving.',
  ],
  NOTIFICATION_UNSUPPORTED: [
    '当前系统不支持本机通知',
    'Local notifications are not supported on this system.',
  ],
  NOTIFICATION_TEST_RATE_LIMITED: [
    '测试通知发送过快，请稍后再试',
    'Test notifications are being sent too quickly. Try again shortly.',
  ],
}
