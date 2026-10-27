# 团队目录与版本编辑

2026-10-27，按固定product-design/c29c2f5团队页接入真实卡片、说明、负责人、成员/CLI/Skills、项目数、创建弹窗及历史版本。原品牌、八页和两列/窄屏单列保持，不合并模拟代码。团队固定成员ID/负责人/说明；角色资料显示当前配置，每次Run另存执行快照。

## 业务与固定产物

唯一内核扩展description：省略继承、空字符串清除、旧缺省不回填，保存追加版本。当前名称按trim/NFKC/小写比较唯一，显示名不改；旧重名团队不迁移，原名可继续编辑，新建/改名受约束。CAS、团队、事件、outbox和幂等回执同事务；桌面不另建权威状态。

表单固定打开时的版本和成员选项，poll不清草稿；负责人自动加入、最多12人，换负责人不静默删旧成员，超限须明确移除。UUID原值交内核严格校验，缺失角色保留引用不回退。编辑须匹配确切ID，旧表单的迟到回执不关新弹窗/抢导航；历史只读，后台改版后取消旧编辑归焦历史选择器。协作流程展示已有真实DAG/隔离执行/逐项验收，不新增可配置流程模板或团队并发覆盖。

内核已先正常提交推送`feat/team-catalog/2ab44ac861b065d306237cb8929a0d5e03daad6c`，0.12.0/protocol1/schema11/135文件。`weftpilot-agent-team-kernel-0.12.0.tgz` SHA-256 `b2da7ff131b32c16d082836c4c67452614c521d99389a5ebd790ca256476a93d`，两干净检出重建一致，实际包精确集合/逐SHA/内外锁一致，旧0110等保留。v11只提高读取门禁，v8—10原语句不改；先备份，旧Team/Task/Run/事件不补写，备份7—11可读，旧0110拒读11，恢复不改源归档。

此前正常Git TLS EOF及连接工具create_blob的404均保留，没有API提交/分支或证书绕过；随后正常Git恢复，2ab及前一项目配置两个docs分支已补推，不依赖邻仓WIP。

## 实际验证与限制

内核175/175、类型/测试类型、lint/规模/格式、原独立飞书服务和嵌入构建通过。独立Tester真实IPC验证同名/CAS竞争各一成功、22表回滚/重放、固定计划/受控Run、实际0110旧10→11/备份/拒回退/只读恢复及7自有进程结束；Reviewer12相关用例及最终源码/文档限定APPROVE，无开放P0—P3。

桌面strict/lint/规模/格式、51单元、8装配通过。两个新增真实窗口用例覆盖13角色连续勾选、12/13上限、实际保存确切12成员、严格UUID、名称冲突、说明版本/CAS保稿、历史只读、旧计划不变、重启及双语主题/窄屏；旧product-catalog和project-settings三项也通过。

独立GUI限定PASS：真实旧0110升级11/备份10，原parent/child两个完整任务及teamSnapshot不变；三坏UUID、CAS保稿/取消焦点、真实saveTeam已提交后只扣回执的迟到保护、精确12成员/超限/减员、重名及清空版本、1124两列/700一列、zh-light/en-dark/system、重启和Git28摘要不变。6自有周期均菜单exit0、signal null、PID/创建时间树空，6started/6stopped，最终0Run/审批。初包做迁移/CAS/迟到，final包补边界，releasecheck只补英文单数/资源/退出，各自归属不倒写。

初包及final曾观察11/12并暂疑产品问题；纯观测事件显示裁切边缘“边界角色6”无click/change，其他10次有，故更正为agent-browser未命中，撤回产品归因并保留原计数/事件。显式滚入视口逐项真实点击后12/13及保存集合通过。checkbox先捕获布尔再更新是稳健性处理，不冒称修好了该观察。早期受控select未发change、uncheck等待已移除missing节点、全局同名按钮定位失败也分别保留；按真实事件/生命周期/弹窗作用域修驱动，不放宽产品校验。opt-in双CLI提交按钮同步限定弹窗，真实交接断言未删。

独立Reviewer最终源码/GUI限定APPROVE，无开放P0—P3：13源/5包SHA、135文件/双锁/tar、实际资源、12相邻单元及静态检查通过，独立GUI报告/图和root各轮日志已核。初轮定位P2/文档P3保留并关闭，少选归因按事件证据撤回；该批准不冒称本地整套或尚未运行的原生CI已绿。

最新实际包真实Codex/Claude团队文件挑战、上游人工验收门控、贡献交接、父任务及重启专项1/1通过（134434ms），标准套件model skip不算执行成功。GUI Tester没跑模型，不冒称双重模型证明。

本机整套明确用`--test-concurrency=1`：首轮66项46通过/1失败/19跳过/0取消、exit1。唯一失败为保存回执先于既有快照轮询收敛时立即读select=3实得2；仅修测试等待确切v3 option/native value，再保留原assert和旧快照断言，实际包专项2/2通过。没有重跑本机整套，不用专项覆盖红轮。19跳过含本机两项剪贴板条件跳过，不指定原因或永久恢复。当前候选的原生CI仍须完整验证。

前一0110两个停止工作/CrashSender窗口仍保留，未强杀或以新正常退出关闭，WeType/CrashRpt共存不证明因果。用户设备、签名发行、真实飞书、可配置协作模板/并发、八页整体及M0—M4不据此封板。

## 复现与后续

固定pnpm12.3.4/Node24：`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm build`，`pnpm dev`启动。检查`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`。定向`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/team-catalog.test.ts tests/e2e/product-catalog.test.ts tests/e2e/project-settings.test.ts`。`pnpm package`装配后以WEFTPILOT_PACKAGED_EXE指定本次实际文件运行`pnpm test:e2e`；本机串行参数如上记录，不改CI标准门禁。

已有双CLI登录时，WEFTPILOT_REAL_TEAM=1显式运行`tests/e2e/dual-cli-team.test.ts`，不复制凭据。下一步补确切候选CI和独立证据，再推进角色飞书绑定/路由与整体设计；不自动合并或公开发布。
