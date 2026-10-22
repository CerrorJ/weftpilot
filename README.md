<p align="center"><img src="assets/brand/app-icon.svg" width="88" alt="纬舟 WeftPilot"></p>

# 纬舟 WeftPilot

**让 AI 团队，有序抵达。**

面向个人与小团队的 AI 桌面工作台，组织角色、团队、项目、需求和任务，通过 CLI 驱动现有执行能力，并保留飞书入口。

## 当前阶段

架构基线为 v0.2，已按 2026-10-22 用户指令进入正式开发。开发分支已接入 Electron/React、真实 Agent-Team 内核、项目任务与交付验收、对象版本和双 CLI 团队闭环。M3人工处理与飞书本机连接经独立验证，真实租户待专用凭据；M4技能版本管理正在打包验收，整体尚未封板。私有内核跨仓CI凭据、macOS原生等外部待办记录后继续开发，不提前标为通过。阶段进度、关联提交、证据和限制见 [开发交接](docs/development/progress.md)。

**Agent-Team 是唯一内核；纬舟消费固定提交与摘要的产物。项目、角色、Run、调度、Git、CLI 和验收均在内核维护，桌面只消费协议。界面支持中英文、浅色/深色/跟随系统，并保存本机偏好。**

## 分支职责

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
git switch feat/human-workflows
```

先阅读已确认决策与两仓边界。开发环境使用 Node 24.18.0、pnpm 12.3.4：

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm dev
```

`pnpm kernel:assemble` 在隔离缓存中检出锁定内核、冻结安装、构建并校验 tarball 摘要，无需相邻源码目录。`pnpm package` 构建当前系统的应用目录；签名、安装器与更新在 M4 验证。完整检查和打包验收命令见开发交接。

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
