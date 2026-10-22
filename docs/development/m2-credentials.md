# M2 模型凭据增量（验收中）

2026-10-23。两仓 feat/product-teams；桌面锁定 Agent-Team 0.3.2 / 协议 1 / schema 4 / 3df108231a4d8c8f590674b024a7da4f30c72198，产物摘要见 config/kernel-lock.json。原服务与真实运行数据未切换。

## 已实现

- 模型可选择 CLI 账户或自定义接口，支持 Codex/OpenAI-compatible 与 Claude/Anthropic-compatible。地址仅允许 HTTPS，明确的本机回环接口允许 HTTP；拒绝 URL 用户密码、查询和片段。
- 主进程使用 Electron safeStorage 加密，系统加密不可用则拒绝。密钥从命名保存操作进入主进程，业务命令、内核数据库和查询只持有引用；没有向页面开放读取密钥的 IPC。
- 每次轮换产生新引用，旧引用不可覆盖，并绑定提供方与规范化地址。临时文件写入后用同目录硬链接原子发布，冲突核对同内容，失败不覆盖；密钥与业务数据库不是跨进程事务。业务拒绝或超时会保留未引用密文供幂等重试，后续维护回收不能删除历史 Run 引用。
- 内核仅在实际执行前经私有 UtilityProcess 端口请求密钥，UUID 关联、并发和超时有界。CLI 自定义环境隔离继承的其他账户变量；密钥不进入参数，Codex 的工具环境显式排除密钥。
- 角色保存确切 modelProfileRef；编辑旧角色时保留其历史模型选项，与最新版本并列。该修复来自独立测试实际发现的缺陷，不能因为列表只投影最新版本而静默丢掉旧绑定。
- UI 中英文，密码框不回填，保存成功清空；修改目标地址必须重新填写密钥。

## 实际验证

- 内核 67/67 默认测试、类型、lint、构建通过；旧 ID 字段协议兼容，新增精确版本引用验证旧表单不会捕获新版。
- 桌面类型、lint/函数规模、构建、7/7 单测通过；默认 Electron E2E 3 通过、真实模型 opt-in 明确跳过。
- 新增 opt-in 真实 Electron 凭据验收通过：safeStorage 密文文件不含合成密钥，轮换不覆盖旧值，旧角色直接保存仍固定旧模型/旧密钥，改地址不填写新密钥被拒绝且不增加模型版本，重启后真实 Codex 请求本机 401 拒绝接口，所有请求使用旧角色的旧密钥，失败执行确认结束、角色未启用、无交付。**401 只证明认证路由与失败处理，不是模型执行成功。**
- 发现 Playwright 1.58.2 的 waitForFunction 不等待异步 predicate 再判真，已用 Node 侧 waitForSnapshot 显式等待 IPC。修正后的真实 CLI 在途工具停止和完全退出用例通过。仍保留此前偶发 taskkill 128 的 STATE_UNCERTAIN 现场；一次通过不代表根因关闭。
- 单独打包 UtilityProcess 探针中，Codex/Claude 均真实完成挑战并启用；Codex 写入随机上游文件，人工验收后 Claude 读取并复制到下游，文件核对、父任务 done 和内核 shutdown 成功。探针最终退出码 1 尚需查明，因此不宣称整个打包探针通过。
- 独立 Tester 用 agent-browser 验证中文/英文、password 不回填、加密存储、旧密钥路由、轮换、改址拒绝；发现并复验历史模型选项缺陷修复，直接保存与重启仍固定原版本，所有指定断言通过。独立 Reviewer 对本凭据增量 APPROVE，无必修项；独立内核目标 7/7、桌面 7/7 及限流/超时/隔离环境探针通过。不扩大为 M2 整体通过。

## 复现

完成 [开发记录](m2-product-teams.md) 的装配与构建后，在 PowerShell 中运行：

```powershell
$env:WEFTPILOT_CREDENTIAL_PROBE = '1'
node --import tsx --test tests/e2e/model-credentials.test.ts
Remove-Item Env:WEFTPILOT_CREDENTIAL_PROBE
```

该用例只访问自建回环 HTTP 拒绝接口，使用合成密钥；需要本机真实 Codex CLI，不消耗真实模型服务。未声明其可代替有效提供方凭据的执行验收。

## 未关闭事项

真实自定义提供方成功执行缺少开发凭据，记录等待用户后续提供，不停止其他开发。Windows 偶发进程树终止失败、打包探针收尾、macOS 原生验证和跨仓 CI Secret 尚未关闭。M3、M4 不因本增量而视为完成。
