export const englishRoleFeishu: Record<string, string> = {
  新建飞书机器人: 'Create a Feishu bot',
  关联已有应用: 'Link an existing app',
  在这里新建或关联飞书机器人: 'Create or link a Feishu bot here',
  '在飞书开发者后台创建独立应用，再填写本角色绑定。':
    'Create a dedicated app in the Feishu developer console, then configure this role’s binding.',
  '使用自己有权管理的独立应用，不与原在线服务共用连接。':
    'Use a dedicated app you can manage, with a separate connection from existing services.',
  保留旧工作空间渠道: 'Keep the legacy workspace channel',
  '仅保留旧版本兼容行为，不视为角色独立授权。':
    'Preserve legacy compatibility. This does not authorize a separate role channel.',
  本角色应用身份: 'App identity for this role',
  '当前提供控制台辅助创建；不会自动复制现有机器人或读取其密钥。':
    'Use the console setup guide. Existing bots and their secrets are not copied automatically.',
  '不同应用的所有者 Open ID 需分别核验，不能直接复制其他机器人身份。':
    'Verify the owner’s Open ID for each app. An identity from another bot cannot be copied directly.',
  '密钥不存入表单草稿；离开配置窗口后需要重新填写。保存不会自动连接。':
    'Secrets are excluded from drafts and must be entered again after leaving the form. Saving does not connect.',
  '无法打开飞书开发者后台，请稍后重试。':
    'Could not open the Feishu developer console. Try again later.',
  角色飞书渠道: 'Role Feishu channel',
  飞书绑定已配置: 'Feishu binding configured',
  飞书绑定未启用: 'Feishu binding disabled',
  待连接与核验: 'Awaiting connection and verification',
  待同步执行: 'Runs awaiting sync',
  连接角色渠道: 'Connect role channels',
  断开角色渠道: 'Disconnect role channels',
  '保存配置不代表平台已授权；能力、权限、事件、发布和真实回调需分别核验。':
    'Saving does not confirm platform authorization. Verify capabilities, permissions, events, publication and real callbacks separately.',
  '配置已有新版本，请关闭后选择当前版本再连接。':
    'A newer configuration exists. Close this view and choose the current version before connecting.',
  '历史执行保留原绑定；断开不删除任务，也不撤销在途网络请求或平台应用。':
    'Past runs retain their bindings. Disconnecting preserves tasks, in-flight requests and platform apps.',
  '当前提供控制台辅助流程。扫码注册尚未接入，创建后仍需核验权限、发布与回调。':
    'Use the console setup guide. QR registration is not integrated yet. Verify permissions, publication and callbacks after creation.',
}
