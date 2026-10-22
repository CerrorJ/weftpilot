<p align="center"><img src="assets/brand/app-icon.svg" width="88" alt="纬舟 WeftPilot"></p>

# 纬舟 WeftPilot

**让 AI 团队，有序抵达。**

面向个人与小团队的 AI 桌面工作台，组织角色、团队、项目、需求和任务，通过 CLI 驱动现有执行能力，并保留飞书入口。

## 当前阶段

架构基线已按用户确认更新为 v0.2。正式开发将在另一台设备的 Codex 中进行。本分支仅提交架构提案、中文开发规范和可复用的品牌资源，尚未初始化正式应用工程，也没有接通执行服务。

**核心方向：Agent-Team 打包作为内核，纬舟作为桌面产品；需要时可同步修改 Agent-Team。当前会话只交付架构与规范，不启动业务实现。**

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
git switch main
```

先阅读已确认决策与两仓边界。当前没有正式应用启动或构建命令；在开发设备收到开发指令后，按交付计划初始化工程。

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
