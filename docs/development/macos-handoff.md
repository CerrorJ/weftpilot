# Mac 收尾验证交接

## 获取代码

桌面代码位于 `CerrorJ/weftpilot` 的 `feat/approval-state-validation` 分支；该分支包含此前内核修复和本交接记录，不能以 `main` 或 `product-design` 的状态代替。Mac 上先获取该分支最新提交，检查工作区干净及 `build` 中的内核锁定信息，再以仓库构建脚本装配指定的 Agent-Team 内核提交。内核修复也保存在 `CerrorJ/Agent-Team` 的 `fix/retry-approval-context` 分支（`373cd2f`）。不要把 Windows 的构建目录、临时数据、认证文件或密钥复制进仓库。

额外保留的旧工作区提交：`CerrorJ/weftpilot` 的 `fix/windows-exit-evidence`（`21fad86`）保存 Windows 退出诊断原始改动，最新验收分支已有后续版本；`chore/preserve-cross-page-lockfile`（`3116e76`）保存重复锁文件增量，不能直接覆盖验收分支锁文件。`CerrorJ/Agent-Team` 的 `docs/daily-assistant-example`（`beeb0aa`）保存独立的日报助手示例配置，不属于桌面内核修复；其中目录需按运行设备自行配置。这些是独立分支，不表示已经合入各仓库的 `main`。

```sh
git clone https://github.com/CerrorJ/weftpilot.git
cd weftpilot
git fetch origin feat/approval-state-validation
git switch --track origin/feat/approval-state-validation
git status --short --branch
node --version
```

项目要求 Node 24.18.x 和 pnpm 12.3.4。根据仓库 README 和当前构建脚本安装依赖，运行类型检查、单元测试、装配检查及适用于 Mac 的实际包端到端测试；记录实际命令、提交、系统版本、芯片架构、通过数、跳过数和失败原因。项目没有 `npm run check` 脚本时，应如实记录并运行仓库已有的对应检查，不要将缺失脚本记为通过。

## 当前证据与待办

- Windows 已验证真实智谱模型、飞书通知和批准／拒绝；Agent-Team 与纬舟使用同一飞书应用会竞争长连接。Windows 上用户选择停止 PM2 的 Agent-Team 后，纬舟真实方案卡片单击成功并续跑、交付验收。两服务同时运行时该风险可能复现；不要复制凭据，Mac 上由用户在界面重新配置，测试前确认同应用只有预期接收端。
- 真实非所有者点击与跨渠道同时竞争仍待第二个飞书账号，不能用原所有者或合成测试替代。
- Mac 用户设备尚未验收：开发态和实际包启动、关闭／完全退出、重启恢复、真实 CLI／模型、Keychain 凭据与备份恢复、系统通知授权／横幅／点击、安装与升级、卸载与数据保留、不同架构及签名／更新渠道按实际条件逐项检查。只记录实际执行的架构与签名状态，不将 CI 或 Windows 结果当作用户设备通过。
- 历史 Mac CI 曾出现 `CREDENTIAL_STORAGE_UNAVAILABLE` 和 `SKILL_DOWNLOAD_RATE_LIMITED`；具体现场和根因仍待复核。跳过、环境限制与失败分别记录，勿以重试成功覆盖历史失败。
- Windows 已做隔离安装升级测试；正式签名、发行和 Mac 原生稳定性仍未全部验收。整体状态、跨渠道异常和独立复核也要按实际证据收口。

详细历史和边界见 [外部验证记录](pending-external-validation.md) 与 [当前待办](remaining-work.md)。验收时不要记录密钥、用户标识、消息正文、真实凭据、机器绝对路径或用户数据；仅将可公开的结论、脱敏证据和源码提交到仓库。
