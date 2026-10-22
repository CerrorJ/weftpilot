# 数据、执行状态与通信协议 v0.2

状态：v0.2 协议设计草案，按已确认的 Agent-Team 打包内核方向修订；细节由 M0 技术验证。所有业务对象、状态机、数据库和权威事件在 Agent-Team 内核实现并统一维护，纬舟只消费协议和投影，不创建第二份业务持久化。本文不表示接口已经实现。

## 1. 领域对象

| 对象                             | 核心字段与约束                                                                |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Workspace                        | 内部 ID、名称、所有者、数据版本；首版单所有者                                 |
| Project                          | workspaceId、名称、仓库地址、本机路径、默认分支、团队；路径属于设备绑定信息   |
| Requirement / RequirementVersion | 项目、原始需求、澄清结果、计划、验收条件、版本                                |
| Task                             | 必填 projectId，可选 requirementVersionId、执行角色、依赖、优先级、状态、版本 |
| Role / RoleVersion               | 职责、CLI、模型引用、Skill 引用、权限版本、并发、启用状态；版本不可变         |
| Team / TeamRole                  | 角色成员、协调者、派发规则、依赖拓扑和修订版本                                |
| ModelProfile                     | 提供方、模型标识、兼容 CLI、参数、凭据引用；不保存密钥明文                    |
| Skill / InstalledSkillVersion    | 来源、可展示元数据、固定 ref/提交、内容摘要、兼容性、安装位置                 |
| Run                              | taskId、projectId、尝试序号、配置快照、状态、版本、retryOfRunId、时间         |
| ExecutionSegment                 | runId、片段序号、CLI 会话、进程身份、启动/终止证据；审批续接可生成新片段      |
| HumanRequest                     | runId、类型、内容/操作摘要、状态、到期时间、决定者和版本                      |
| Artifact / Delivery              | runId、需求版本、文件/提交/Diff/测试证据、内容摘要、交付版本                  |
| Acceptance                       | deliveryId、验收条目、结论、原因、操作者；保留历史                            |
| ChannelBinding                   | 内部对象与飞书租户、应用、会话、话题的关联；不是业务主键                      |
| Event / CommandReceipt           | 持久事件、游标；命令幂等键、请求摘要和处理结果                                |

所有业务 ID 独立生成，飞书 ID 仅作为映射。所有跨对象操作校验 workspace、project、task、run 的归属一致性，不能只凭一个 runId 执行。

一个任务可以有多次 Run。首版建议每个任务同一时间最多一个非终态 Run；团队派发产生有依赖关系的子任务，各自拥有独立 Run，通过父任务聚合进度。

Project 的仓库地址与本机 checkout 分开：换设备后重新关联本机目录，不复用另一台机器的绝对路径。分支和工作区状态从 Git 实时读取并标记采集时间，数据库中的缓存不作为真相。

## 2. 不可变配置快照

创建 Run 时固定：

- 项目、任务、需求/计划版本、验收条件及团队修订版本。
- 角色版本、CLI 类型与版本、模型配置 ID 与有效非敏感参数。
- Skill 来源、固定提交与内容摘要，权限策略版本与实际可落实的权限。
- 仓库身份、基准提交、目标分支、隔离目录策略和环境配置引用。

执行目录、实际进程版本、开始时的仓库证据等延迟产生的信息，进入追加的执行准备记录或 ExecutionSegment，不能回写替换创建时的意图快照。排队期间基准发生变化，必须重新预检；需要改变既定基准时取消原 Run 并创建新 Run，不能悄悄改写快照。

密钥、令牌和 CLI 登录文件不进入快照。凭据轮换不改写历史；每个片段记录采用的凭据引用/修订标识，不记录值。

## 3. 状态划分

### Task：业务交付状态

`draft → ready → in_progress → in_review → done`，以及显式 `cancelled`。

- Run 开始后进入 `in_progress`；执行失败时仍保留任务，界面叠加最新 Run 的失败状态和可执行动作。
- Run 成功且有合格交付版本后进入 `in_review`；验收通过进入 `done`。
- 验收退回保存原因，任务回到 `ready`，修改时创建新 Run。
- `done` 需要显式重新打开才能再执行；需求实质改变优先创建新任务。

### Run：一次尝试的执行状态

| 当前状态                                 | 允许的主要后继                                               | 依据                                   |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| queued                                   | preparing、cancelled、failed                                 | 获取调度资源、用户取消、无法继续排队   |
| preparing                                | running、stopping、failed                                    | 工作目录和执行准备完成；准备失败       |
| running                                  | waiting_input、waiting_approval、stopping、succeeded、failed | 归一化 CLI 事件与内核判断              |
| waiting_input                            | running、stopping、failed                                    | 有效回答、停止、到期策略               |
| waiting_approval                         | running、stopping、failed                                    | 有效决定；拒绝或到期不能继续被拒操作   |
| stopping                                 | stopped、failed                                              | 进程树终止已确认；终止失败进入故障处理 |
| interrupted                              | 无                                                           | 对账后确认本次执行已无法可靠续接       |
| succeeded / failed / cancelled / stopped | 无                                                           | 终态，不重置到 running                 |

重启对账可以把已无存活执行且缺少可靠结束证据的非终态 Run 标记为 `interrupted`；这是恢复路径，不是只凭心跳超时触发的普通转换。若进程身份仍未知，保持状态待确认并阻止自动重跑。

停止与正常结束竞争时以内核的串行裁决和已提交版本为准：已进入终态则停止返回“已结束”；停止命令先提交则后续退出收敛到停止结果，同时保留进程退出证据，禁止两种终态互相覆盖。

`waiting_approval` 表示逻辑等待，不承诺 CLI 仍在运行。停止型审批记录当前片段结束，批准后同一个非终态 Run 创建新的续接片段；重新尝试已结束的 Run 则必须创建全新的 Run。

拒绝、到期和撤销必须写明原因。首版建议审批到期拒绝相关操作，Run 进入失败并保留证据，不自动放行。具体策略在实现时形成显式策略表并测试。

### 人工请求与验收

- HumanRequest：`pending → approved / answered / rejected / expired / cancelled`，按请求类型限制有效决定。
- 审批绑定 runId、请求版本、操作摘要和有效期；旧卡片不能批准新请求，重复点击不重复执行。
- 验收关联确切交付版本，结论不覆盖旧记录。需求和验收条件发生变化需生成新版本。
- Run 进度、Task 完成状态、交付验收结论分别展示，不共用一个布尔值。

## 4. 持久化方案

建议 SQLite 业务表作为查询和事务主存储，同时保存可恢复事件；不采用必须重放全部事件才能启动的完整 Event Sourcing。

建议表组：工作空间/项目；需求版本/任务/依赖；角色版本/团队；模型引用/技能版本；Run/片段/工作区锁；人工请求/决定；交付/验收；事件/渠道 outbox/命令回执。

约束包括外键、对象版本、任务尝试序号唯一、每个任务一个活动 Run、每个操作幂等键唯一、目录写入锁唯一。角色与模型删除采用归档，已有 Run 引用仍可解释。

内核业务操作在同一事务中完成：版本与归属校验 → 状态写入 → 事件写入 → 命令回执写入。事务提交后才通知界面和飞书。通知失败不回滚已完成的业务动作，由 outbox 重试并记录投递状态。

WAL 可支持读取与写入并发，但仍需管理写事务、checkpoint 与数据库占用；不能放在网络共享文件系统中。[SQLite WAL 官方说明](https://www.sqlite.org/wal.html)。

日志、产物、技能缓存与 worktree 存在独立目录，数据库保存索引和摘要。清理需要引用检查：未验收交付、运行中目录和仍被角色/Run 引用的技能版本不能直接清除。

数据库迁移编号递增且已发布迁移不可修改；升级前使用一致性备份，验证迁移和恢复。不在数据库打开写入时只复制主文件冒充完整备份，具体采用驱动支持的一致性备份方式。[SQLite 备份 API](https://www.sqlite.org/backup.html)。

## 5. 命令合同

共享契约由 Agent-Team 发布，纬舟锁定版本使用。桌面宿主只进行传输、身份注入与系统能力桥接，不在桥接层实现业务裁决；初始化握手协商 kernelVersion、protocolVersion、capabilities 和数据兼容范围，具体打包与兼容规则见 [内核集成方案](kernel-integration.md)。

桌面桥接只暴露命名方法，例如 `projects.list`、`roles.saveDraft`、`roles.test`、`tasks.create`、`runs.start`、`runs.stop`、`runs.retry`、`humanRequests.resolve`、`deliveries.accept`。

这是逻辑命令目录，不是已经存在的 HTTP 路由或可调用 SDK。

```ts
interface CommandEnvelope<T> {
  protocolVersion: 1;
  requestId: string;
  idempotencyKey: string;
  workspaceId: string;
  expectedVersion?: number; // 修改已有对象时必须指定
  payload: T;
}
```

操作者身份由可信连接和认证上下文注入，不能相信渲染层自报的 actorId。飞书操作者需映射到允许操作的本地所有者/授权身份。连接身份与项目归属校验同时成立才执行。

受理结果区分：`accepted`（已持久化受理，可追踪后续事件）、`completed`（同步操作已完成）、`rejected`（带稳定错误码）。不能把 accepted 显示为任务执行成功。

相同幂等键和相同请求内容返回先前回执；相同键配不同内容返回冲突。对象更新使用 expectedVersion 做比较交换，桌面和飞书同时审批时仅一个决定提交成功。

错误结构包含 code、中文 message、retryable、correlationId 和脱敏 details。建议错误码包括 VALIDATION_FAILED、VERSION_CONFLICT、PERMISSION_DENIED、CAPABILITY_UNSUPPORTED、GIT_DIRTY、GIT_CONFLICT、CREDENTIAL_UNAVAILABLE、CLI_UNAVAILABLE、STATE_UNCERTAIN。

## 6. 事件、订阅与恢复

事件信封包含 protocolVersion、eventId、workspaceId、workspaceSequence、aggregateId、aggregateVersion、taskId/runId（如适用）、occurredAt、type、payloadVersion、payload、correlationId。workspaceSequence 为同一工作空间内提交的递增游标。

首次连接：在一致性读取中取得状态快照和 cursor → 从 cursor 之后订阅 → 重放缓冲事件 → 接入实时事件。快照与订阅之间的事件必须能补齐。

传输至少一次，客户端按 eventId 去重，按游标处理；按任务筛选时游标跳号可能属于其他任务，不得据此推断丢失。游标过期或快照不兼容时返回明确 resync_required 并重新取快照。

日志与状态事件分流、限流并有背压；断线不能只靠内存队列补齐。外部通知不是业务提交的证明。

进程恢复记录：实例标识、启动令牌、PID 与启动时间、CLI 会话 ID、执行目录、最后心跳和退出证据。PID 单独使用不可靠，也不得对不明身份的进程执行终止。

“数据库提交”和“外部进程启动”不能通过一个本机事务获得 exactly-once 保证。使用持久启动意图、握手与进程对账缩小不确定窗口；无法确认是否执行过的操作禁止自动重跑，交给用户判断。

## 7. 权限与敏感数据

- 新输入的凭据只在保存动作中短暂经过表单/桥接，不进入通用状态、日志、事件和浏览器存储；已保存凭据不提供读取回显接口。
- 主进程凭据代理限制调用来源与用途。凭据存储不可用时明确阻塞，不静默降级为明文；平台差异需验证。[Electron safeStorage 官方文档](https://www.electronjs.org/docs/latest/api/safe-storage)。
- CLI 使用参数数组和 `shell: false`，校验可执行文件、工作目录和路径边界；不同平台的进程树终止分别测试。
- Skill 锁定具体版本；安装只准备内容，不默认运行第三方安装脚本。版本升级、权限扩大和能力不兼容需要明确可见。
- 权限策略必须映射到真实执行能力。CLI 不支持可靠约束时展示降级/不支持，不能仅靠过滤界面按钮宣称已隔离。
