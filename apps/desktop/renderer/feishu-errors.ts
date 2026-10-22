export const feishuErrors: Record<string, [string, string]> = {
  FEISHU_APP_SECRET_REQUIRED: [
    '更换 App ID 后请填写新应用的 App Secret，不能复用原应用密钥',
    'Enter the new app’s App Secret after changing App ID. The previous app’s secret cannot be reused.',
  ],
  FEISHU_NOT_CONFIGURED: [
    '请先填写并启用专用开发飞书应用绑定',
    'Configure and enable a dedicated development app binding first.',
  ],
  FEISHU_IDENTITY_MISMATCH: [
    '飞书应用、租户、所有者、会话或绑定版本不匹配',
    'The Feishu app, tenant, owner, chat, or binding version does not match.',
  ],
  FEISHU_NETWORK_FAILED: [
    '飞书连接或消息请求未完成，业务状态已保留',
    'The Feishu connection or message request did not complete. Business state is preserved.',
  ],
  FEISHU_DELIVERY_UNCERTAIN: [
    '消息首次发送结果待确认，已停止超过去重期限的自动重发',
    'The initial message result is uncertain. Automatic retries beyond the deduplication window are blocked.',
  ],
}
