# M2 对象与团队开发记录（未封板）

2026-10-23。两仓 feat/product-teams。当前桌面消费 Agent-Team 0.3.1 / 协议 1 / schema 4，锁定源 a0f90b5bbe76dbeb52ff01e6be835f68bc6bb2af；完整产物和文件摘要在 config/kernel-lock.json。内核新凭据端口在后续开发，尚未由本记录的桌面产物消费。

## 实际接入

- 模型配置、需求和团队追加版本；角色固定模型配置，任务固定需求版本，Run 固定完整快照。保存新版本不改写历史。
- Codex/Claude 角色、真实随机文件挑战试运行、显式启用/停用、失败和日志。新配置必须重新试运行后启用。
- 可编辑团队成员、协调者、子任务目标/验收条件和依赖。内核原子拒绝重复键或依赖环。
- 批量排队、明确等待原因、全局两个执行槽、每角色一个槽、每项目一位写者；其他项目可继续执行，未知进程封锁所属项目。
- 下游等待上游人工验收，再固定确切交付集合、合成每份上游代码贡献并读取交付说明。菱形依赖去重，补丁冲突不启动 CLI，保留隔离目录。Git 行尾转换以各执行目录的实际内容为准，不改写主目录。
- 父子任务、上下游跳转、固定输入、每次执行/交付/人工验收与聚合完成状态。只有全部子任务人工验收后父任务完成。
- 新界面中英文、浅色/深色/跟随系统和窄窗布局，继续复用原创品牌。

## 已执行验证

- 锁定内核：64/64 默认测试通过，包括真实 Git 菱形依赖/冲突、多项目并发和槽位释放、schema 1/2/3→4 一致备份。
- 桌面 typecheck、lint/行数、format、构建、4/4 单测通过；默认真实 Electron E2E 3 通过，3 个真实 CLI opt-in 用例明确跳过。
- 新产品对象 E2E 验证模型旧快照、旧需求引用、循环依赖无部分创建、未就绪守卫及英文新界面。
- 独立 Tester 使用 agent-browser 真实操作 0.3.1/a0f90b5 开发构建：Codex 随机文件挑战通过后显式启用；上游验收前下游 queued/not_started；验收后上游文件真实进入下游目录，真实 CLI 读取并生成下游文件；接受下游后父任务 done。重启后父子状态、启用及历史版本仍正确。
- 独立 Tester 实看英文、浅深色和 700px，无横向溢出与 pageerror。证据只留本机 .tmp/evidence/m2-*，不提交临时数据、模型登录文件或对话转储。
- 本增量 Code Reviewer 尚在独立审查；没有将 Tester 的指定增量通过扩大为 M2 整体通过。

## 复现

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
pnpm dev
```

显式模型回归使用本机已授权 CLI 账户，PowerShell 设置 WEFTPILOT_REAL_CLI=1 后运行 `node --import tsx --test tests/e2e/workflow.test.ts`。该回归现会先真实试运行再启用，业务断言明确区分健康检查与用户任务；失败且进程未确认结束时保留隔离数据。

## 剩余问题与下一步

- 自定义提供方安全凭证桥接及真实提供方认证尚未完成。当前界面只提供 CLI 账户模型配置，不接受假凭证或伪装可运行。
- 最新源探针的 Claude 已实际生成正确挑战文件，但超时仍继续 Grep，停止返回 taskkill 128 并保留 STATE_UNCERTAIN；未按根 PID 消失改成成功。独立界面验收没有覆盖此问题。正在收紧试运行提示范围并追查平台收尾，不能称第二 CLI 完整验收通过。
- 该增量仍需新包运行、故障恢复和整体独立审查；macOS、跨仓 CI Secret 和真实飞书在外部待办，不等待用户确认而停工。
- M3 人工处理/飞书、M4 技能与发行准备尚未完成，不跳过 M2 验收。
