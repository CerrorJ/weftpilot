# M3 飞书接口核验记录（开发中）

2026-10-23，依据飞书官方 Markdown 文档库逐层核对，另对照仓库锁定安装的 @larksuiteoapi/node-sdk 1.71.1。没有登录、创建或连接真实应用，没有修改既有在线服务；真实租户仍需专用开发凭据。

## 可落实的连接方式

[官方长连接回调说明](https://open.feishu.cn/document/event-subscription-guide/callback-subscription/step-1-choose-a-subscription-mode/configure-callback-request-address.md) 明确支持企业自建应用经 SDK WebSocket 接收新式卡片回调；Node SDK 示例版本 1.36.0。消息需在 3 秒内处理，多个客户端接收为集群分配而非广播。旧式消息卡片回传不支持此模式。

因此桌面首选新式 card.action.trigger 与内核单连接宿主；不能让新旧服务同时使用同一应用抢收事件。应用未提供前，只验证契约与本机传输，不能声称真实连通。SDK README 中“仅事件、不支持回调”的旧段落与现行官方文档不一致，需要以现行文档和实际专用应用验证为准。

[官方卡片回调结构](https://open.feishu.cn/document/feishu-cards/card-callback-communication.md) 提供事件 ID、应用/租户、操作者和 action.value/form_value 等字段。实现必须校验绑定应用、租户、允许的所有者和请求版本/摘要；回调 ID 去重不能代替业务决定幂等。回调更新凭证有短有效期及使用次数限制，不将其当作持久业务 ID 或长期通知凭据。

## 权限检查接口

[查询租户授权状态](https://open.feishu.cn/document/application-v6/scope/list.md)：GET /open-apis/application/v6/scopes，以当前应用身份查询各 scope 的授予状态；官方标注无需额外 scope。可用于连接诊断，不能凭拿到 access token 就推断发消息和订阅权限都已具备。尚未实际调用真实应用。

## 自动创建应用的边界

本机 lark-cli application --help 目前提供绑定应用的 slash command 管理，没有创建自建应用命令。[官方应用信息索引](https://open.feishu.cn/llms-docs/zh-CN/llms-app-information.txt) 提供应用信息、授权状态和管理员等接口，本轮没有找到并验证“自动创建企业自建应用”的公开接口及权限。

[官方顶层开发流程](https://open.feishu.cn/llms.txt) 仍引导从开发者后台创建应用。M3 因此实现控制台辅助创建流程、明确权限/事件清单和连接检测；“全自动创建应用”保持未验证，不使用未公开控制台接口、用户登录缓存或自动点击替代官方授权。

## 待真实验证

专用测试应用的凭据与可用范围、bot 发消息/更新卡片权限、新式卡片回调订阅、真实所有者 open_id/tenant_key 绑定、断网重连和重复/过期决定。当前不调用生产应用或以合成接口成功代替租户验证。
