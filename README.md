<p align="center"><img src="assets/brand/app-icon.svg" width="88" alt="纬舟 WeftPilot"></p>

# 纬舟 WeftPilot

**让 AI 团队，有序抵达。**

面向个人与小团队的 AI 桌面工作台，组织角色、团队、项目、需求和任务，通过 CLI 驱动现有执行能力，并保留飞书入口。

## 当前阶段

架构基线为 v0.2，已按 2026-10-22 用户指令进入正式开发。开发分支已接入 Electron/React、真实 Agent-Team 内核、项目任务与交付验收、对象版本和双 CLI 团队闭环。M3人工处理与飞书本机连接经独立验证，真实租户待专用凭据；M4技能、备份恢复、诊断及Windows验证安装器的真实闭环已验证，整体尚未封板。私有内核CI读取已解决，原型首增量`6d3d288`的[Windows/macOS CI](https://github.com/CerrorJ/weftpilot/actions/runs/40077244639)全绿，含真实开发/打包Electron运行及本机安装包装配；macOS用户设备、真实CLI、实际安装升级等仍待验收。阶段进度、关联提交、证据和限制见 [开发交接](docs/development/progress.md)。

**Agent-Team 是唯一内核；纬舟消费固定提交与摘要的产物。项目、角色、Run、调度、Git、CLI 和验收均在内核维护，桌面只消费协议。界面支持中英文、浅色/深色/跟随系统，并保存本机偏好。**

在界面“设置 / Settings”中切换“语言 / Language”和“外观 / Appearance”，立即生效并在重启后保留。当前本地候选、验证范围及后续入口见[发行交接](docs/development/release-readiness.md)。

最终界面以`product-design`交互原型为验收基准。[原型对齐分支](https://github.com/CerrorJ/weftpilot/tree/feat/prototype-alignment)已接回八页导航、任务列表/创建弹窗/详情抽屉、设置、角色六步/卡片与独立运行设置。[执行前检查](docs/development/task-preflight.md)、[Run历史与交付验收](docs/development/task-review.md)及080固定内核的[CLI分项检查](docs/development/cli-checks.md)已按各自限定范围通过Windows独立Tester/Reviewer。版本读取、默认CLI登录报告与真实模型试运行分开，不把查询结果当作角色就绪。飞书角色路由及[其余原型差异](docs/development/prototype-alignment.md)继续推进，整体设计尚未封板。

角色复制`4fdd9fe`[CI](https://github.com/CerrorJ/weftpilot/actions/runs/40171628155)双平台通过，各36单元/6装配、开发及实际包34通过16跳过，未签名NSIS与ARM64 DMG/ZIP装配通过；固定090内核和[角色复制](docs/development/role-copy.md)已完成Windows独立验收/审查。[草稿入口](docs/development/role-draft-entry.md)后续已提交c303；用户设备、正式旧密文升级和签名等仍见[外部清单](docs/development/pending-external-validation.md)，Keychain历史及隔离试验失败保留在[调查](docs/development/macos-keychain-investigation.md)。

后续测试维护`26f2f309`的[CI](https://github.com/CerrorJ/weftpilot/actions/runs/40174133079)双平台成功：各43单元/6装配，开发与实际包36通过16跳过，未签名原生安装包装配通过；c303退出响应失败与历史Keychain/旧停止根因分别保留。随后固定内核0.9.1接入已通过Windows独立Tester/Reviewer、实际包36通过16跳过、真实Codex文件闭环和独立Claude试运行；内核153项及桌面43单元/7装配通过，见[接入记录](docs/development/cli-input-lifecycle.md)。

`feat/project-overview/de97647`已推送并接入[项目卡片与真实仓库详情](docs/development/project-overview.md)。后续8076500固定内核0.9.4/51f0b18，其CI两平台路径回归通过、macOS实际包38通过16跳过，Windows实际包退出异常仍见[调查](docs/development/windows-exit-investigation.md)。`feat/project-task-navigation`进一步接回原型[项目任务筛选跳转](docs/development/project-task-navigation.md)，独立Tester/Reviewer通过；测试退出层35d411d另经真实CLI停止/完全退出验证。最终Windows实际包39通过16跳过、44单元/8装配通过，新CI待核验，M0—M4与整体原型尚未封板。

## 分支职责

后续[角色卡片与运行设置](docs/development/role-cards.md)已完成Windows限定范围的独立验收：编辑、试运行历史、固定版本启停及草稿往返；角色飞书路由和整体设计差异仍按原型继续推进。

| 分支                                                                         | 维护内容                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `main`                                                                       | 正式项目源码的主线，以及架构、开发规范；当前仅完成评审资料准备  |
| [`product-design`](https://github.com/CerrorJ/weftpilot/tree/product-design) | 产品方案、八页交互原型、流程、Logo 展示、Superdesign 画布上下文 |

分支名称不使用 `codex/` 前缀。设计原型独立维护，功能实现按业务模块迁移，不把模拟执行代码整体合并进正式应用。此次整理没有改写已有 Git 历史。

## 架构与开发交接

1. [架构设计 v0.2](docs/architecture/README.md)：技术选型、进程、模块和核心流程。
2. [内核打包与两仓协作](docs/architecture/kernel-integration.md)：唯一源码、进程宿主、版本锁定与升级。
3. [数据与协议](docs/architecture/data-and-protocol.md)：对象、状态机、持久化、幂等和恢复。
4. [迁移与交付计划](docs/architecture/migration-and-delivery.md)：现有能力迁移、阶段验收和跨设备交接。
5. [开发规范 v0.2](docs/development/standards.md)：目录、依赖、编码、测试、提交与发布。
6. [评审确认表](docs/architecture/review.md)：已确认需求、建议决策和待验证问题。
7. [中文 AGENTS.md](AGENTS.md)：另一台设备的 Codex 必须先读的执行约束。

## 在另一台设备开始

```sh
git clone https://github.com/CerrorJ/weftpilot.git
cd weftpilot
git switch feat/prototype-alignment
```

先阅读已确认决策与两仓边界。开发环境使用 Node 24.18.0、pnpm 12.3.4。应直接安装官方`pnpm@12.3.4`；旧pnpm 11启动器自动切到12时仍可能改写工具链锁。不要仅以仓库内`pnpm --version`判断启动器版本。CI相关说明见[原生pnpm修复记录](docs/development/ci-native-pnpm.md)。

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm dev
```

开发态使用`weftpilot-development`应用名称与独立默认数据目录，已打包应用仍使用`weftpilot`；旧数据保留原位，不自动迁移，显式`WEFTPILOT_TEST_DATA`优先。macOS本机应用目录包补齐无证书的开发ad-hoc签名，正式安装器/公证仍另行验证；详见[开发包与系统凭据边界](docs/development/macos-development-packaging.md)。

`pnpm kernel:assemble` 在隔离缓存中检出锁定内核、冻结安装、构建并校验 tarball 摘要，无需相邻源码目录。`pnpm package` 构建当前系统的全新应用目录；`pnpm package:installer`从干净提交装配本机未签名安装器，`pnpm release:verify <输出目录>`校验实际摘要。签名、公证和公开发布未授权。完整检查和打包验收命令见开发交接与[安装器记录](docs/development/m4-installers.md)。

当前 Agent-Team 为私有仓库，新设备须单独获得正常 Git 读取授权。CI 使用专用 `AGENT_TEAM_READ_TOKEN` Secret，不继承开发设备登录状态。

查看原型可在另一个工作目录克隆设计分支，避免切换主线时中断开发：

```sh
git clone --branch product-design --single-branch https://github.com/CerrorJ/weftpilot.git weftpilot-design
cd weftpilot-design
npm run dev
```

原型中的运行、授权、Git 和技能安装均为模拟。原型的浏览器存储和执行记录不作为正式数据库或迁移来源。

[Agent-Team](https://github.com/CerrorJ/Agent-Team) 作为内核源码仓库持续维护，纬舟消费其锁定版本的打包产物，不复制内核业务源码。开发设备应同时取得两仓；需要时允许同步修改 Agent-Team，并记录内核提交、协议与产物版本。

## 公开范围

仓库已按要求公开。凭据、会话、运行数据和本机配置不入库。开源许可证和商标可用性尚待决定；公开可见不代表已授予特定开源许可。
