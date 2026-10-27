# 项目目标、描述与默认团队

2026-10-27，按固定原型product-design/c29c2f5接入真实项目上下文及项目团队。桌面消费唯一内核，不直接读业务数据库。项目创建可同时保存目标/描述/默认团队，仍由系统目录选择器提供仓库；设置只编辑名称与业务上下文，不切换仓库、Git地址或默认分支。

当前为开发候选：最终包追加完整回归出现Windows崩溃弹窗，尚未正常结束，不能验收整轮。此前完整通过与新增真实CLI/快照通过分别记录，继续独立诊断和新提交原生CI，不降低退出门禁。

## 业务与交互

项目配置CAS版本加一、事件/通知/幂等回执原子提交。文本允许清空；默认团队是稳定身份ID或明确null，不trim非法UUID/空白。弹窗固定打开时的配置与选项，后台轮询不清草稿；保存冲突保留输入，关闭重开后加载新基准。成功须收到严格确切回执，已关闭表单的迟到回执不关新弹窗或抢导航。

列表展示真实目标/描述和默认团队，详情展示用户原文及并排的仓库/项目团队；980px以下堆叠，700px独立验证。成员、协调者、CLI和模型来自真实当前团队/角色。团队计划固定打开时的项目/团队版本，expectedProjectVersion与expectedTeamVersion分别校验；不自动启动，不改已有teamSnapshot。默认团队解除后，已打开的计划宿主仍存活，保留草稿并拒绝过期保存；关闭后焦点回团队区域。

新Run在创建事务固定projectContextSnapshot；正常CLI提示使用该快照，角色试运行不注入。项目修改不改历史执行，重试新Run才使用新配置。执行记录显示固定上下文，旧记录缺省明确未记录，不拿当前项目冒充历史依据。执行成功仍待人工验收。

## 内核与产物

- Agent-Team源码`c960f484c706101410863e12349ba8341abe1f6b`，开发分支feat/project-settings，已先提交推送。
- 内核0.11.0 / protocol1 / schema10 / 134文件；新增project-settings能力。升级前一致性备份，v10只提升门禁，已发布v8/v9原语句不改，旧Project/Task/Run/事件不补写。备份7/8/9/10可读，旧0100拒读10且DB摘要不变。
- `weftpilot-agent-team-kernel-0.11.0.tgz` SHA-256 `b47da834a73b4e85b1bf3318cccad06184e2180f09450f04e04204f50e0979c9`；原检出与桌面隔离检出两份干净源码重建一致。旧0100与094保留。
- 实际Windows应用内外manifest/lock、精确134文件集合与逐文件SHA核验一致；发行不依赖邻仓未提交源码。文档HEAD不替代c960，后续不能重建覆盖同版本产物。

## 实际验证与当前边界

内核170/170、原独立飞书服务构建、类型/规模/lint/格式通过。独立Tester真实Git/SQLite/构建后IPC、22表回滚/重放、旧预检拒绝、schema9升级/备份恢复/旧核拒读、7自有进程结束通过；Reviewer18个不同相关用例及原Git复现修后通过，正式APPROVE。

桌面strict/lint/规模/格式、51单元、8装配通过；新增只读展示之前，开发模式和实际Windows包完整64项均47通过、17条件跳过、0失败/取消。新增2项覆盖实际配置创建、非法/不存在团队、项目/团队双CAS、poll保稿、解除默认团队时保留计划、焦点、确切计划、重启、用户原文、双语/明暗/窄屏。新增Run只读展示后另验实际模型/历史弹窗及全套；后者出现两项Windows进程崩溃弹窗、未退出的现场，本轮不能记作完整通过，不倒写此前完整轮结果。受影响worker分别是prototype-navigation与role-wizard-version-regressions；已保留日志、所属PID/创建时间和数据目录，不强杀或以调试器断开换绿。故障原因尚未确定，旧Windows退出问题不据此指定或关闭根因。

Windows实际包真实CLI专项首次1/1通过：项目goal/description中的两个随机UUID不在任务内，CLI在隔离目录实际写文件并逐字匹配；Run succeeded/confirmed_ended、Task in_review、无acceptance，项目改版不改旧Run。新增只读展示后，在新实际包再次1/1通过，并真实打开历史快照，确认仍显示两个旧UUID而不含后续目标。两轮各自覆盖自己的包和断言，不将首次结果倒写。常规CI模型专项明确opt-in，不把skip算模型成功。

首轮内核创建误spread baselineCommit被strict拒绝的P1，已显式只取允许字段并加真实Git回归。UI首轮默认团队条件卸载计划的P2，修后真实解除关联/保稿/CAS/Esc回归通过。初两E2E的select标签超时已修aria-labelledby；原失败日志均保留。独立UI、最终审查及当前双平台原生CI仍在进行，不用局部静态或旧CI替代。

## 复现

固定pnpm12.3.4/Node24，按README执行`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm build`，`pnpm dev`启动。检查：`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`、`pnpm test:e2e`；定向运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/project-settings.test.ts`。`pnpm package`正常装配，WEFTPILOT_PACKAGED_EXE指定本次实际可执行文件后运行同样E2E。

本机已有CLI登录条件下，以WEFTPILOT_REAL_PROJECT_CONTEXT=1显式运行`tests/e2e/project-context-cli.test.ts`，不复制登录文件。未设置时模型专项跳过。本机实际包来自官方Electron42原始归档，经SHA核验和固定装配器构建到新目录，不覆盖旧测试包。

剩余：独立UI/双平台CI、团队列表/编辑页、角色飞书路由、八页整体设计、用户macOS设备安装/升级/真实CLI、签名与许可/更新渠道。未创建或连接飞书测试应用，未切换现有服务，未自动合并或公开发布；M0—M4整体不据此封板。
