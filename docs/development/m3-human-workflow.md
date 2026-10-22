# M3 人工处理增量（Windows，开发中）

桌面分支 `feat/human-workflows`，锁定 Agent-Team `af9896a7a35bb85875ccaff44860121954118627`，内核 `0.4.2`、协议 `1`、数据 schema `5`。此记录只覆盖人工处理增量，不表示飞书或 M3 整体通过。

## 已实现

- Codex 使用内核生成的受信 stdio MCP 请求澄清、方案确认及单次操作审批；Claude 保留 restricted/safe-mode 和文件工具限制，通过原生结构化输出发起同样的请求，不伪造 MCP 调用。
- CLI 当前段确认结束后持久化等待请求、会话与摘要。等待时退出应用，重启仍等待，不自动回答或重放 CLI。
- 桌面“待处理”和任务详情显示同一内核对象；回答/确认绑定请求版本与摘要，续接同一 Run 的新执行段。停止等待撤销请求；重试另外创建 Run。
- 自由回答优先于选项，没有自动选中推荐项。拒绝必须说明原因并结束本次执行。过期/撤销/旧请求不能放行新执行。
- 执行完成仍等待独立交付验收。界面提供中英文、浅色、深色、跟随系统，偏好可重启保留。

## 复现

需要本机已经正常可用的 Codex、Claude CLI；不复制登录文件。先执行：

```powershell
pnpm install --frozen-lockfile
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

真实 CLI 用例显式开启，可能消耗当前 CLI 账户额度：

```powershell
$env:WEFTPILOT_REAL_HUMAN='1'
node --import tsx --test tests/e2e/human-workflow.test.ts
```

实际打包运行时，再设置 `WEFTPILOT_PACKAGED_EXE` 为 `pnpm package` 生成的本机 EXE。测试创建自己的 Git 仓库和数据目录，等待重启后通过界面提交随机答案，检查同 Run、配置快照、真实 answer.txt 和人工验收；失败证据仅保存在忽略的 `.tmp/evidence/`。状态待确认的测试数据保留，不改写数据库伪造停止。

## 实际验证与限制

- 内核 strict、lint、构建及 77/77 默认测试通过；覆盖状态事务、迁移备份、过期、重启、停止等待、旧请求和同 Run 多段。
- 桌面 strict、lint、构建、7/7 单元测试通过；默认 E2E 3 通过，付费 CLI 用例默认显式跳过。
- 父代理开发构建真实 Codex 48.1 秒、Claude 50.9 秒通过。实际 EXE Codex 49.6 秒通过；Claude 两轮未在 90 秒内进入等待，没有作为通过记录。
- 独立 Tester 在实际 EXE 两项均通过：Codex 47.3 秒、Claude 46.7 秒，总 94.5 秒，exit 0。另外通过 agent-browser 实际操作三类请求、英文自由答案覆盖选项、方案确认、带原因拒绝、700px、明暗/系统主题；复核同 Run/attempt1、不可变快照、进程段及文件逐字节证据。
- 父代理失败快照显示 Claude 返回 `kind=result` 的普通提问文本，没有结构化人工请求；内核记录执行结束且交付待验收，没有自动审批或任务验收通过。后续内核源码已补明确结构示例并真实复验通过，尚未进入本次锁定产物，不能据此抹除 0.4.2 的失败。
- 独立 Reviewer 对本次0.4.2人工处理增量 APPROVE，无必须修复项；独立内核专项15/15、桌面单测7/7通过。Claude上述限制保留P2，未扩大为M3整体封板。飞书渠道、真实租户跨渠道竞争、macOS原生及M4尚未通过；历史Windows偶发taskkill128的不确定状态仍保留。

下一增量为同内核飞书绑定、身份校验、幂等决定、持久卡片投递和控制台辅助连接；凭据相关条件见[外部待办](pending-external-validation.md)。
