# 人工处理跨页一致性与外观弹层

2026-10-31，从桌面`78449e45c2ff8fe653dd0baeb5ec6b7b06867ed5`继续，以固定`product-design/c29c2f5`任务流程为准。只修顶部外观弹层的收起交互，补真实CLI跨页核验，不改布局、品牌、业务状态机、协议、数据库或内核。当前仍固定Agent-Team `73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件`，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

## 真实发现与修复

Root为原真实Codex/Claude人工等待测试补工作台、列表、看板及请求历史的只读核对。初轮0P2F/exit1，150174ms：两种CLI均已真实执行成功、进程confirmed_ended、任务in_review，但顶部语言/主题details仍展开，其label拦截任务详情Close details，两个用例各30秒点击超时；不属于CLI或内核执行失败。原始失败日志、合成快照保留，自有应用正常退出，不改旧不确定现场。

无CLI最小用例又复现1F：打开外观并切英文深色，外部导航后进入同一任务，弹层仍open；旧截图实际显示它盖住任务关闭位置。产品修复仅补临时details的外部pointerdown、焦点移出收起，以及Escape收起并把焦点交回summary；事件监听随组件清理。设置页expanded常驻字段不收起、不拦截Escape；原点击继续导航，不强制重放或测试端force-click，不改变CSS层级。

## 当前实际验证

严格TS、lint/规模、构建通过；全新Windows实际包使用已核官方Electron42归档，来自本工作树自己装配的固定内核，不依赖相邻未提交内核源码。主进程`19860127e3bac2fa4b0367a18fe3122152a84e5987869c13070598dca660aa73`、preload `968e1aab87abc69341d9c2d142c22ffa6e7f2aa8f269a1c5c23b2e83561a5946`、CSS `d496dc067a88f5b0c1d571eac0b24be56ba20f3dca173ca67d7710a2e180659d`未变；renderer为`e5a43f06866a5a034433b6b574a39b88443152fe27b011d665863613130df74e`。

Root最小实际包用例宽窗口1P，再补中文浅色1124/英文深色700的最终用例1P/exit0，4075ms：外部导航后Task关闭可点、Escape还焦、Tab移出收起、设置页常驻及浏览前后快照相等，0Run。独立Tester/Reviewer与最终回归继续，未提前封板。

首轮默认完整80项实际包回归为60P0F2取消18S/exit1，118441ms，两项均60秒超时取消（Git地址复制首例、项目设置首例），不是80项成功；原日志保留，未放宽超时或删除断言。相同包仅这两个文件串行补验5P0F0S/exit0，40718ms，并强制真实系统剪贴板成功。此差异不证明唯一原因已查清。原完整轮77主进程均有quit记录；一次PID命中是原日志结束后新用例复用，按CreationDate区分，不据PID强杀。新的默认`test:e2e`显式按文件串行：系统剪贴板、原生窗口焦点及系统凭据不能只靠独立userData视为隔离；业务团队并发仍由实际调度专项验证。该执行政策不改用例、断言或时限，最终完整轮按新明确政策另记。

最终包仅package.json测试脚本元数据不同，四份运行资源与上述真实CLI/GUI包逐字节相同。新默认完整80项实际包回归**62P0F0取消18明确跳过/exit0，286275ms**，强制真实剪贴板成功；不是80项全通过，也不关闭首并行轮两个超时的未知根因。默认不调用真实模型，真实双CLI结果仍按下段专项单独归属。

修后真实CLI两项**2P0F0S/exit0，126917ms**，Codex49440ms、Claude76867ms；自己的四次应用周期均原生退出0。等待澄清、交付待验收、显式验收通过三个稳定阶段逐一核同UUID：工作台待我处理、任务列表/看板状态及分栏、请求待处理/已回答历史均一致；浏览前后整个业务快照深等，不产生新Run、决定或自动验收。看板没有步骤总数时仍无百分比。已回答历史按同一权威请求的实际版本显示，不再可操作；验收后退出待处理。原等待态重启、空回答不决定、唯一OWNER回答、同Run/attempt1、角色快照不变、answer.txt逐内容核对和逐项确认验收均保留。

两种CLI的成功是本轮Windows实际包证据，不继承为Mac真实CLI、飞书、方案/单次操作审批或状态未知进程恢复。当前范围也不含需求/团队全部非空状态、系统横幅点击或正式发行；M0—M4整体未封板。

独立Tester限定PASS九项：自有agent-browser命名会话以UI建立项目/角色/任务0Run；双语明暗宽窄、跨页收起/关闭详情、Escape只关弹层且保留抽屉、Tab移出及设置常驻均通过，完整快照cursor4浏览前后深等。三张必要图实际查看，143内核/三锁与最终四资源摘要吻合。第一自有记录器在正常quit返回后再次读取已关闭application.process而异常，原日志保留；不是产品退出失败，不冒认第一轮完整PID清单。修正ignored记录器后另一个空fixture完整生命周期退出0、登记PID+CreationDate终态缺席，未处理未知进程。独立GUI来源是首cross-page-app，最终cross-page-final-app四资源另核相同；真实CLI仍为Root两项专项。随后独立Reviewer对两源、测试/执行策略、实际包四资源及143锁核验APPROVE，自己严格TS/lint/格式通过，并读取最终62P18S与真实2P原日志。只修改交接补记后提交；新确切提交的原生CI仍待执行，不继承78449绿色。

本分支承接已审桌面交接`e2dbb011ab2269d431d52c6d0900d8357ad994ea`的四份进度入口；此前78449的双平台结果与本轮e5a4 renderer分开。内核仓关联文档为`050fedd0432935e184693cf85388dc3c6723876f`，不变的运行内核仍73/0.13.1/p1/schema12/143/d9。

## 复现

Node24.18/pnpm12.3.4，`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm build`，使用自己的全新实际包和测试目录。默认`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/appearance-dismissal.test.ts`不执行CLI；显式`WEFTPILOT_REAL_HUMAN=1`后运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test --test-concurrency=1 tests/e2e/human-workflow.test.ts`验证两种CLI。实际包通过`WEFTPILOT_PACKAGED_EXE`指定；需要本机已授权的CLI登录，不复制认证文件、不连接生产飞书。失败保留原日志与未确认结束的自有数据，不用重跑改写旧结果。

## 02f确切原生CI结果

[Desktop41191641941](https://github.com/CerrorJ/weftpilot/actions/runs/41191641941) attempt1、head02f614fa2db91884b6455a61bb0262391d2157c4，整轮**FAIL**。Windows job124509460549成功：核心189P、单元69P、装配9P，开发及实际包各80项62P18明确跳过0失败0取消，公共来源3项1P2真实CLI跳过。新增外观/原项目归焦/备份/identity均在两组日志实际成功，80份launcher记录exit0/null。CI没有执行真实模型，前述Root真实双CLI单独归属。

Mac job124509460313在核心179P10平台跳过、单元69P、装配8P1平台跳过及ad-hoc strict通过后，must-shown实际failed，后续80项、来源及新MacGUI均未执行；无默认native JSON或签名sidecar，不继承784的图/157aggregate，也不将此CI当Mac界面通过。原因未定，后续有限诊断为[e9f独立增量](notification-ci-diagnostics.md)，不能倒填02f结果。

独立Tester核官方元数据、完整日志和四ZIP的大小/SHA/CRC/安全白名单、实际32张Win PNG（28主图+4剪贴板）及两有限JSON；实际看六张Win代表图。随后Reviewer独立复核并另看两张外观图，**APPROVE_VERIFIED_FAILURE_ONLY**只批准失败事实准确，应用Mac验收仍不通过。中文CI外观图实际1008×681、英文700×820，不把Root本机1124尺寸硬套到runner。原始Win日志180471字节/SHA `15a2805da49dfc5d6e83d68574bd03dd10e87691976af3f8e818227d90546c7d`，Mac98730字节/SHA `2b471ef2f3db50db362b99c67eba21824c77122b2b58bc2b1824dc85c266871f`；连接器正文正规化对齐，不冒称独立二进制下载。
