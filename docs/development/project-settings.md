# 项目目标、描述与默认团队

2026-10-27，按固定原型product-design/c29c2f5接入真实项目上下文及项目团队。桌面消费唯一内核，不直接读业务数据库。项目创建可同时保存目标/描述/默认团队，仍由系统目录选择器提供仓库；设置只编辑名称与业务上下文，不切换仓库、Git地址或默认分支。

当前功能与确切提交的双平台原生CI通过；本机最终包追加完整回归出现两个停止工作/CrashSender错误窗口，尚未正常结束，Windows本机完整轮及发行稳定性保持PENDING。此前完整通过、新增真实CLI/快照和CI各自记录，不降低退出门禁或以CI关闭本机现场。

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

首轮内核创建误spread baselineCommit被strict拒绝的P1，已显式只取允许字段并加真实Git回归。UI首轮默认团队条件卸载计划的P2，修后真实解除关联/保稿/CAS/Esc回归通过并由独立Tester/Reviewer关闭。初两E2E的select标签超时已修aria-labelledby；原失败日志保留。独立GUI/CI Tester限定PASS，Reviewer最终限定APPROVE：核13源、5包与dist字节、134文件/双锁、两官方全日志、ZIP和16PNG逐条SHA并实看。未关闭源码P0—P3为零，本机退出兼容性另为PENDING，不把源码审核扩展成整体发行验收。

## 确切提交的原生CI

桌面`7b2954b52d2d0ad219e8575cdee26e93a40a73ac`、固定内核c960的[CI40442209173](https://github.com/CerrorJ/weftpilot/actions/runs/40442209173)双平台SUCCESS。Windows job121984943648：内核170/170、51单元、8装配、开发与实际包各64项47通过17条件跳过0失败0取消，未签名NSIS/blockmap装配通过。macOS job121984943394：内核160通过10平台跳过、51单元、7装配1平台跳过、开发及实际包各64项47通过17条件跳过0失败0取消，未签名ARM64 DMG/ZIP/blockmap通过。两个项目设置/默认团队容器在四种原生模式均实际运行通过；模型专项17跳过中的一项不被算真实CLI成功，真实模型依据上面两轮本机实际包证据。

界面证据各8PNG（项目设置2+需求6），下载ZIP后按官方大小和摘要核验，限制文件名集合再解压：Windows artifact12706274911，381302字节，SHA-256 `b9fa6d2ecc57be1162bf070b28a3af73e13cfc91abea66b77ad9489c13a76287`；macOS artifact12707491195，551663字节，SHA-256 `cd1b34e06fa863dc34cab6ead754c1b484f20cd7147fe3df3ce361c4c564b66d`。图片均对应7b；Mac项目中文图显示真实Git检查中，只作为布局/团队/原文证明，不冒称该图仓库已verified。

本机两个错误窗口另行只读取证：各业务库schema10、quick_check正常、无Run/执行片段、末条kernel.stopped，读前后DB SHA不变，但主进程仍在，不能当应用exit0。UIA正文是Error launching CrashSender.exe；模块中有WeType提供的CrashRpt1500.dll，仅共存不能证明因果，尚无对应Application1000/1001记录，不能据窗口标题确定Windows WER机制或故障模块。遮挡截图明确不是错误正文的视觉证据。未强杀、关闭现场、改输入法或系统设置；详细PID/创建时间/自有树/只读DB/原日志保留在ignored证据。该问题与旧停止/退出故障分别保留，完整M4仍不封板。

独立Tester自己的6个周期均菜单退出/真实exit0、自有树空，56个Git文件摘要与输入保护核对保持，0Run/审批，实际延迟两个真实回执不关新表单或抢导航。旧0100→0110的项目/角色/团队及备份9保留已验；早期旧计划seed漏expectedTeamVersion实际拒绝，因此不声称旧Task升级已由该场景证明。Run有记录展示依据root真实CLI第二轮与Reviewer源码核对，Tester不重复冒称亲跑模型。各辅助失败和现场均保持原归属。

## 复现

固定pnpm12.3.4/Node24，按README执行`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm build`，`pnpm dev`启动。检查：`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`、`pnpm test:e2e`；定向运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/project-settings.test.ts`。`pnpm package`正常装配，WEFTPILOT_PACKAGED_EXE指定本次实际可执行文件后运行同样E2E。

本机已有CLI登录条件下，以WEFTPILOT_REAL_PROJECT_CONTEXT=1显式运行`tests/e2e/project-context-cli.test.ts`，不复制登录文件。未设置时模型专项跳过。本机实际包来自官方Electron42原始归档，经SHA核验和固定装配器构建到新目录，不覆盖旧测试包。

两仓代码已推送，功能关联为桌面feat/project-settings/7b2954b、内核feat/project-settings/c960。后续docs分支只汇总验收，不改变应用/产物身份；内核文档91fed09首次正常HTTPS推送遭临时TLS握手失败，已保留本地提交，未关闭证书校验或修改全局网络/远程配置，待通路恢复补推，不影响已推代码与该CI的固定源码。

剩余：本机Windows退出现场、团队列表/编辑页、角色飞书路由、八页整体设计、用户macOS设备安装/升级/真实CLI、签名与许可/更新渠道。未创建或连接飞书测试应用，未切换现有服务，未自动合并或公开发布；M0—M4整体不据此封板。下一项已建立独立feat/team-catalog工作树，复用0110团队用例，不覆盖本次证据或故障现场。
