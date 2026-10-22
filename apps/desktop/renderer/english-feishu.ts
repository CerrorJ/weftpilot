export const englishFeishu: Record<string, string> = {
  'App ID 以 cli_ 开头，后面为 16 位十六进制字符；Open ID 和 Chat ID 分别以 ou_、oc_ 开头。':
    'App ID starts with cli_ followed by 16 hexadecimal characters. Open ID and Chat ID start with ou_ and oc_ respectively.',
  飞书连接: 'Feishu connection',
  绑定专用应用: 'Bind a dedicated app',
  '请使用独立开发应用，避免与原服务同时消费同一应用事件。密钥由系统加密，不进入业务快照。':
    'Use a dedicated development app to avoid sharing events with an existing service. Secrets are encrypted by the operating system and excluded from business snapshots.',
  '租户 Tenant Key': 'Tenant Key',
  '所有者 Open ID': 'Owner Open ID',
  '通知会话 Chat ID': 'Notification Chat ID',
  '留空沿用本应用密钥；更换 App ID 时必须填写新密钥。保存不会自动连接。':
    'Leave blank to keep this app’s secret. A new App ID requires a new secret. Saving does not connect automatically.',
  允许此绑定连接飞书: 'Allow this binding to connect to Feishu',
  保存飞书绑定: 'Save Feishu binding',
  '桌面与飞书处理同一请求，决定只提交一次。':
    'Desktop and Feishu resolve the same request with one committed decision.',
  连接状态: 'Connection status',
  未连接: 'Disconnected',
  正在连接: 'Connecting',
  长连接已建立: 'WebSocket connected',
  正在重连: 'Reconnecting',
  连接失败: 'Connection failed',
  正在查询: 'Checking',
  待同步任务: 'Tasks awaiting sync',
  绑定版本: 'Binding version',
  '长连接建立不代表卡片权限和所有者身份已验证；请用专用应用完成真实回调核验。':
    'A connection does not verify card permissions or the owner’s identity. Complete a real callback check with your dedicated app.',
  连接专用应用: 'Connect dedicated app',
  断开连接: 'Disconnect',
  控制台辅助创建: 'Console setup guide',
  '在开发者后台创建企业自建应用并启用机器人。':
    'Create an internal app in the developer console and enable its bot.',
  '为机器人开通发消息及更新消息卡片所需权限，配置可用范围并发布测试版本。':
    'Grant the bot permissions to send messages and update cards, configure its availability, and publish a test version.',
  '事件与回调选择长连接，订阅新版卡片回调 card.action.trigger。':
    'Choose a persistent connection under Events & callbacks and subscribe to card.action.trigger.',
  '将机器人加入通知会话，核对 App ID、Tenant Key、所有者 Open ID 和 Chat ID 后填写绑定。':
    'Add the bot to the notification chat. Verify the App ID, Tenant Key, owner Open ID, and Chat ID before entering the binding.',
  '连接后在独立测试任务发起人工请求，分别验证飞书决定、桌面状态与旧卡片拒绝。':
    'After connecting, create a human request in a separate test task. Verify Feishu decisions, desktop state, and rejection of old cards.',
  打开飞书开发者后台: 'Open Feishu developer console',
  '自动创建应用的官方接口尚未核验。当前提供控制台辅助流程，不代表已创建或验证应用。':
    'An official API for automatic app creation has not been verified. This guide does not mean an app has been created or verified.',
}
