# 任务列表与看板切换

2026-10-29，开发中。独立`feat/task-board`承接技能目录939及测试维护637/0a3，固定Agent-Team `2750d66321d4920745c2f3f2a88428fcc73f78bd / 0.13.0 / protocol1 / schema12`。正规产物142文件、tar SHA-256 `c5efd3cee257afa2e723f64f5a5fd6b4f3fd74dac40f51652c6b3237175e9ecd`，本增量不改内核、协议或业务状态。

## 实际功能

按固定`product-design/c29c2f5`的任务工具栏和四栏看板接回列表/看板切换。两个布局共用TaskGroups筛选、同一快照、最大attempt、负责人/Run快照、子任务验收进度及原详情动作。列为未开始、执行与待处理、待验收、已结束；等待决定和进程未知有明确文本，未知不归已结束，已结束包含执行失败/停止，不能冒充验收通过。

角色试运行仍由既有筛选排除。无自身Run的团队父任务按子任务投影，不创建父Run；全停止/失败不显示正在执行。单项步骤未知用横线，只有明确子任务总数才显示已验收数/总数，不按CLI事件伪造进度。列表与看板复用状态展示，父任务等待子任务、缺少Run的执行状态待确认分别说明；失败/未知用错误色，深色状态色来自主题变量。

切布局保留项目UUID、搜索、状态筛选和当前详情身份；创建真实回执后打开确切任务并保留布局，其他渠道新增不抢选择。显式关闭后，旧触发卡片因布局切换卸载时按确切UUID寻找当前按钮，再退到当前布局控件；筛选或导航卸载不触发抢焦。布局仅是当前页UI状态，不写任务数据库，不支持拖拽改业务状态。宽屏四栏、中间宽度两栏、窄窗单栏补充原型响应行为，沿用纸白/森林绿、原创Logo与中英文/系统明暗。

## 已执行验证

strict/lint/规模及60单元通过，新增两组只读投影回归覆盖旧attempt乱序、unknown、执行/验收分开、无Run父项及原对象不变。开发版真实窗口专项1/1通过：真实UI两任务、布局/筛选/创建回执、键盘详情和窄英文深色；0Run。新Windows实际包按官方Electron42归档SHA装配并核142文件及锁，完整默认73项56通过17明确跳过0失败0取消、exit0（231907ms）。跳过项不算真实模型、技能来源或安装器验收，0a3技能CI另有自己的真来源证据。

独立Tester实际新包限定GUI PASS，无本轮必须修产品项。真实UI创建两个同名项目、一个未启用角色、两Task，按UUID筛选；实际键盘切布局仍是同一drawer，关闭归焦新列表确切UUID；命名IPC另建第三Task模拟其他渠道不抢选择，该前置不冒称UI创建。宽中浅/窄英深双布局、重启和原Task快照不变通过。APP JS `5351d82f2baffa56900d6077053cce38b9a9b82588456b82a092a99c36679bb3`，CSS `ab6e2b4f7dd7e52076a74f0855ae523d6737a4d5082990164a476189ff3e4c5d`；与受测源码和142固定内核逐字节一致。

受控历史另准备6个明确CONTROLLED Task、3个未执行Run、0segment/PID，只证明四栏、失败/未知/等待文本和父项1/2展示，不代表真实CLI。父项启动被内核reconcile为in_review，因此不声称实测纯in_progress父分支。合成uncertain记录使正确退出守卫拒绝退出，原行/截图/PID已保留；经测试所有权核验后，仅按确切ID+原data CAS把该合成processState改confirmed_ended、保留interrupted及其他行，再菜单退出。此周期只算手工夹具清场，不证明真实未知进程停止；其他0Run/截图周期的自然退出与PID缺席独立有效，旧故障未触碰。

首轮测试工具在项目添加中提前动作、用纯图标textContent判断名称均失败；补等真实弹窗关闭、按aria-label实际键盘操作后通过，未改产品或放宽UUID。尝试制造触发器丢失的附加探针因项目筛选已按设计关闭drawer而没有触达目标分支，不算fallback实测通过。真实CLI/live人工请求/中断、全latest竞争与该fallback仍限定未验；独立代码审查、确切提交原生CI待继续，不宣布整体八页或M0—M4完成。

## 复现与下一步

固定Node24/pnpm12.3.4，执行`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:packaging`、`pnpm build`。专项`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/task-board.test.ts`；设置WEFTPILOT_PACKAGED_EXE后运行同一测试或完整`pnpm test:e2e`。

工作台我的项目/独立待处理区、设置逐角色连接总览及通知分类继续实施。真实飞书、有效自定义模型、用户设备安装升级、旧Windows故障与Mac历史加密/下载原因仍单独验收；后续绿色不倒写旧失败。
