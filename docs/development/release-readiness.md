# Windows本地候选与后续验收入口

2026-10-25。按用户授权连续推进M0—M4；凭据相关信息记录后继续处理独立工作。本记录区分已验收的Windows能力与尚待外部条件的完整发行，不能用局部结果宣称M3/M4全部完成。

## 当前能力与验证范围

2026-10-27最新已验证实现为桌面6a7340b/内核0100-969b548/protocol1/schema9/132文件，固定摘要见[元数据交接](requirement-metadata.md)。[CI40435856697](https://github.com/CerrorJ/weftpilot/actions/runs/40435856697)两平台开发/实际包各45通过16明确跳过、51单元及未签名NSIS/ARM64 DMG/ZIP/blockmap装配通过；独立Tester/Reviewer核对原生日志、12图和官方摘要后限定增量PASS/APPROVE。修复前214的P2保留，修复本机仅重跑相关1+4专项，不借CI重写本地结果。真实旧094→0100升级和schema9归档创建/检查已Windows验证；用户设备安装升级、真实Mac CLI、旧故障根因及正式发行条件仍保留，不能据此宣布M4发行完成。

2026-10-26当前已验证实现提交为`16eabd7156d214a4d6def8ae7d6876383a108bcb`，固定094/51f/protocol1/schema8/131文件/原tar摘要。[CI40272620242](https://github.com/CerrorJ/weftpilot/actions/runs/40272620242)双平台成功，各51单元、开发及实际包44通过16明确跳过、未签名NSIS/ARM64 DMG/ZIP装配通过。Git地址复制、需求目录及创建关联任务按各自确切提交验收，见[进度](progress.md)。当前docs分支只更新报告，不作为新的已打包源码身份；本机系统限制、旧故障、飞书/模型成功路径、用户设备/安装升级/真实Mac CLI、许可/签名和整体设计仍按[待办](remaining-work.md)保持真实状态。

2026-10-26当前稳定提交`44d4df6`/固定094的[CI40269550640](https://github.com/CerrorJ/weftpilot/actions/runs/40269550640)两平台成功：51单元，装配Win8/Mac7通过1平台跳过；开发及实际包各42通过16明确跳过；未签名NSIS与ARM64 DMG/ZIP装配成功。正常HTTPS推送已恢复，旧092网络/CI阻塞不再是当前状态。下文保留各版本原时点；本机剪贴板权限、旧Windows访问冲突/Keychain根因、用户设备/真实Mac CLI/签名和飞书等限制不因绿色CI自动关闭。需求目录后续WIP不继承44d验收，见[需求记录](requirement-catalog.md)。

最新本地项目页增量固定092/3910834/p1/schema8/131文件，内核157全量及独立Tester/Reviewer通过；桌面44单元/7装配、功能修复包38通过16跳过，最终仅字典补正的i18n包独立定向确认P3关闭。项目页独立Tester19断言PASS、Reviewer APPROVE，两实例菜单退出0/内核停止/自有树空；受控历史和门控回执与真实CLI分别记录。当前两仓网络推送、标准Electron下载及备用连接器上传权限仍阻塞，离线归档官方SHA核验后仅本机装配验证，没有新CI/Mac/正式身份安装器或发行结论。见[项目页交接](project-overview.md)，下方091为此前版本时点。

当前接入固定内核091/`aaeeeb4`/p1/schema8/128文件，两份干净重建tar摘要一致；内核153项及独立Tester/Reviewer通过，桌面43单元/7装配和strict/lint/格式、实际Windows包36通过16跳过、真实Codex文件闭环及独立Claude试运行通过，桌面独立Tester/Reviewer最终PASS/APPROVE。本增量无远端CI或新正式身份安装器，不继承前版结果，见[接入记录](cli-input-lifecycle.md)。此前测试维护`26f2f309`[CI](https://github.com/CerrorJ/weftpilot/actions/runs/40174133079)双平台成功，各43单元/6装配、开发与实际包36通过16跳过及未签名原生安装包装配通过。下方为各版本当时记录，未验收事项不自动关闭。

后续仅测试维护已Windows独立验收/审查：退出菜单响应丢失必须等待实际exit0/close并保留恢复后置证明，人工处理两CLI实际同Run与英文逐项验收有独立证据。43单元/6装配、实际包36通过16跳过；产品仍是c303/固定090产物，无新正式身份本地安装器或修正后Mac CI结论。具体真实/受控范围见[退出记录](native-quit-response.md)及[人工补验](human-review-regression.md)。

最新草稿提交`c3030fb`的[CI 40172942235](https://github.com/CerrorJ/weftpilot/actions/runs/40172942235)Windows成功（37单元/6装配、开发及实际包36通过16跳过、未签名NSIS装配），macOS开发应用因恢复期间退出evaluate上下文销毁失败（35通过1失败16跳过），未走实际包/安装器。当前不是双平台通过；[测试退出响应修正](native-quit-response.md)本机及独立验证中，不能将仅有传输错误当作正常退出或产品异常已排除。以下c303待提交为此前验收时点。

草稿入口与空白创建现已完成Windows限定范围独立Tester/Reviewer；37单元/6装配、实际修复包36通过16跳过。它沿用固定090内核，但当前未提交、无本增量远端CI或新正式身份安装器，不能继承下述4fdd CI。草稿范围、问题关闭与限制见[交接](role-draft-entry.md)。

最新提交`4fdd9fe`的[090双平台CI 40171628155](https://github.com/CerrorJ/weftpilot/actions/runs/40171628155)成功：各36单元/6装配、开发及实际包34通过16跳过，未签名原生安装包装配通过。没有新正式身份本地候选或用户Mac安装升级/真实CLI证明；Keychain历史未关闭。下一草稿入口的未提交源码和本机验证不继承此CI。

## 历史增量与当时结论

以下按原提交保留验证范围；当时“无CI结论”等状态不覆盖上方最新结果，也不关闭正式发行待办。

090复制客户端修复包已通过Windows独立Tester，34项通过16跳过，另真实Codex专项确认来源和副本分别trial；独立Reviewer最终APPROVE，无新增P0—P3。未产生新正式身份安装器或090远端CI结论，不能继承080及更早结果；详见[复制验证](role-copy.md)。

080角色入口`7420a2d`[CI 40104044202](https://github.com/CerrorJ/weftpilot/actions/runs/40104044202)双平台成功，各36单元/6装配、开发及实际包32通过15跳过和未签名安装包装配均过。090复制接入尚未提交或CI验收，不继承080结果；没有新的正式身份本地安装器，Keychain历史根因与Mac用户设备/旧密文升级待办仍保留。

080客户端`fa30eb8f43514b80eb289acd30d7a20d895469ed`的[CI 40102151584](https://github.com/CerrorJ/weftpilot/actions/runs/40102151584)双平台成功，各36单元/6装配，开发及实际包31通过15跳过，NSIS及ARM64未签名DMG/ZIP装配通过。本次Keychain未复现，不是修复根因或正式旧密文升级验证；b2d隔离试验失败仍保留。没有新的干净正式身份本地安装器或Mac用户设备结论，当前未提交角色入口也不继承本CI。

下一CLI客户端已固定080/`3b1c8b65fb93cb20e14a2b290f485ae91fecd3a2`/p1/schema8/126文件，两份干净重建tar为`12aa27705a8c114ceda7cd4e346711ce537c73fa6d50a3275ec64aec438b6d61`。Windows实际包31通过15跳过及只读四查询专项通过，独立UI Tester通过，独立Reviewer最终APPROVE；本增量无远端CI或新正式身份安装器结果，见[CLI范围](cli-checks.md)。

角色卡片已提交`2cb75c12326ba740b50d943372e2b3c38500b487`；其[CI 40099809043](https://github.com/CerrorJ/weftpilot/actions/runs/40099809043)Windows全通过、macOS实际包备份密钥保存失败`CREDENTIAL_STORAGE_UNAVAILABLE`，其余开发与安装包装配通过。两平台当前未全通过，以下18465全绿是此前版本。CLI分项下一锁080/3b1/126文件已从两份干净检出重建相同，桌面尚开发中，不继承任何前序CI。

角色卡片增量本机独立Tester/Reviewer已通过，35单元/6装配、实际Windows包29通过14跳过；一个真实Codex用例实际两次trial确认版本隔离，另一个为受控展示用例。当前070/e6c/122文件与摘要一致；未产生新正式身份本地安装器、本增量CI或Mac用户设备结论，整体角色流程尚未封板，见[角色卡片范围](role-cards.md)。

Run历史增量已推送`18465bdeb7d29c92caeed6d014613a0e2e5c7e63`，其[双平台CI 40096365165](https://github.com/CerrorJ/weftpilot/actions/runs/40096365165)已全部成功：各31单元/6装配，开发和实际包均28通过13跳过，NSIS及ARM64未签名DMG/ZIP装配通过。没有新正式身份本地安装器或用户Mac安装升级结论；历史Keychain根因未定位。以下“本增量尚无远端CI”保留为提交前记录；当前未提交角色卡片增量不继承本CI。

后续Run历史/验收弹窗已本机独立Tester/Reviewer通过，31单元/6装配，实际Windows新包41项28通过13跳过；真实Codex专项两轮有明确证据，未扩写为代码任务/停止竞争/双CLI旧失败已修复。锁定内核仍070/e6c/122文件，未新建权威任务状态。本增量尚无远端CI和新正式身份安装器结论；见[交接及验证边界](task-review.md)。

最新已提交且核对CI的预检源码为`9b53992762e29bfab5842bef39ccd51afaa51112`，内核070/`e6c33e9`。[双平台桌面CI](https://github.com/CerrorJ/weftpilot/actions/runs/40092321957)均通过：各28单元/6装配，开发和实际包均26通过12跳过，NSIS及ARM64未签名DMG/ZIP装配通过。Keychain错误本次未复现，历史根因未定位；未验收用户设备安装/升级、真实Mac CLI或签名。此后未提交的验收界面改动不继承该CI结论；以下此前“070无CI结论”保留为提交前时点记录。

最新任务预检已更新到070/`e6c33e97e18859453b441fccaff63442cda07333`/p1/schema8，122文件及tar从两份干净检出重建一致，锁定摘要见[预检交接](task-preflight.md)。Windows实际新目录应用包默认38项26通过12跳过、真实Codex预检专项3/3；28单元和6装配通过，独立窗口/视觉和Reviewer最终通过。070尚无远端CI核对结论或新干净提交安装器；060的macOS Keychain失败仍是未解决的发行阻塞。以下060及058安装器保留原版本归属。

后续角色六步首增量已独立Tester/Reviewer通过，含模型历史引用与新建后编辑身份的两项P2修复。27项单元、6项装配检查通过，最新Windows新目录包完整35项为24通过/11显式跳过/0失败；一次主体真实Codex trial及显式启用、真实Skill来源草稿/绑定专项分别有证据，未将补审UI用例称作重新执行CLI。当前仍060/c736/p1/schema8，角色卡片/CLI分项检测/角色飞书路由和任务检查/完整验收布局未封板；本增量尚未生成干净提交安装器。详见[角色交接](role-wizard.md)。

开发入口为`feat/prototype-alignment`。任务页`520130b`固定059/193，后续锁定接入增量更新为内核0.6.0/`c7366baff2ef9de2fbeefb4e4c07fb625c2e861c`，协议1/schema8；两份干净重建及116文件、tar摘要一致。最新060 Windows新目录包默认27项为16通过/11显式跳过/0失败，独立包边界2/2、文件摘要、真实握手及退出通过。首次词典文件清理EBUSY和有限清理重试后的复验分别保留。当前增量未生成新的干净提交安装器，完整八页设计也未验收。下方058旧安装器来源与摘要保留原归属，详见[设计记录](prototype-alignment.md)、[新增真实集成失败](expanded-native-integration.md)及[角色接入](role-wizard.md)。

最近已通过CI的确切源码为原型首增量`6d3d288`，锁定059/193；[Windows/macOS CI](https://github.com/CerrorJ/weftpilot/actions/runs/40077244639)含两平台实际开发/打包Electron各14通过11跳过、23单元、6装配检查及NSIS/DMG/ZIP装配。后续任务筛选工作区不冒充该CI已验收的范围。此前原生pnpm与跨仓权限修复记录仍见[CI修复记录](ci-native-pnpm.md)。macOS用户设备、真实CLI、实际安装升级与公开发行未据此标为完成。

任务页`520130b`的后续CI已结束：Windows通过；macOS实际包的备份合成密钥保存出现Keychain不可用，其他开发/密文检查和安装装配通过。此失败发生于059，不是060迁移失败；未确认唯一根因，下一CI将串行隔离实际macOS包测试，保持真实safeStorage与原失败断言，不使用模拟钥匙串或签名凭据。060及该隔离措施尚未有远端结论。

| 阶段 | 已实现并实际验证                                                                                                                                  | 尚未验收                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| M0   | Electron/React/严格TS、真实打包内核、版本握手、窗口隐藏继续、菜单完全退出确认停止、干净源码与逐文件摘要装配                                       | macOS用户设备安装升级、真实CLI及系统凭据                                |
| M1   | 项目/角色/真实CLI任务、日志、停止/新Run重试、版本交付、人工验收及重启恢复                                                                         | 历史taskkill128不确定现场根因仍保留                                     |
| M2   | 需求/模型/角色/团队不可变版本、角色真实试运行、Codex与Claude真实依赖团队交付和父任务验收                                                          | 有效自定义模型服务的成功路径；macOS原生                                 |
| M3   | 澄清/方案/单次操作、同Run续接与新Run重试区分、旧版本/幂等决定守卫、共享飞书用例/状态卡片、系统加密连接向导及官方控制台辅助                        | 专用真实飞书租户连接、事件/卡片与桌面跨渠道决定；Claude普通提问偶发限制 |
| M4   | GitHub固定提交技能预览/许可/安装/升级/卸载与真实双CLI技能交付；备份检查/恢复与失败保护；只读诊断导出；Windows验证身份NSIS安装/升级/卸载与数据保留 | macOS原生安装/Keychain/退出/升级；签名、公证、公开更新渠道和公开发行    |

所有当前界面沿用中英文及浅色/深色/跟随系统偏好；重启与Windows验证安装器升级后仍保持。用户输入、任务和交付原文不自动翻译。
本轮既有Agent-Team脏改动、旧失败进程/数据、生成OpenWiki和在线飞书服务均未接管。未合并main、未公开发布、未使用签名凭据。

## 固定来源与本地候选

- 两仓均在`feat/skills-release`分别提交推送。内核源提交`2d347d11bf5b0f1cb61cc26366cb65643d5678d1`，版本`0.5.8`，协议`1`，数据库schema`7`。
- 内核tarball SHA-256：`1fe70425927e9d25369358c01dce9afd89f07feb2e504e08eadb8febc6a94f7f`；完整115文件锁定在`config/kernel-lock.json`。
- 桌面备份增量`b9ad0e9`，诊断`1b5b845`，安装器完整性/源树隔离`6561a41`、`c954fc4`，发行清单校验与真实测试`bf85620`。
- 后续仅测试保护`53b7e9f`和交接文档变化，不将其提交号冒充候选包来源；产品运行代码仍与下述固定候选一致。
- 正式产品身份本地候选来源为干净提交`bf856209b9a4cdbf28ae92fc8805fad9454c262c`；版本`0.2.0`，Windows x64，未签名。EXE SHA-256：`05a9c3487e0f972bd29da81f5337ac6c365cf01077d9539817fa0518306d0fb4`。
- 本机输出在忽略目录`.tmp/installer-production-bf85620`；真实清单、EXE、blockmap和未安装应用目录均已生成。此正式身份候选只做本地构建、摘要和隔离测试数据运行，未覆盖安装任何正式环境。
- 实际安装/升级/卸载独立验收使用干净`c954fc4`生成的独立validation身份0.0.1→0.0.2，详见[安装器记录](m4-installers.md)。它不等于正式appId现有用户安装迁移已验收。

不要手改清单的`pending`冒充原生通过。完整性校验只证明本地材料匹配，不证明签名、发布来源或可信自动更新。

## 可复现检查

新设备须获得正常私有内核Git读取权限；不复制其他设备登录文件。已知依赖使用Node24.18.0、pnpm12.3.4，Electron42.0.0内嵌Node24.15.0。

```powershell
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:packaging
pnpm build
pnpm test:e2e
pnpm dev
```

构建安装器必须是干净提交且使用新输出目录；`pnpm package:installer`不发布、不签名。随后执行`pnpm release:verify <输出目录>`。已有失败目录不能覆盖。
验证实际打包程序时，将`WEFTPILOT_PACKAGED_EXE`设为该新输出中`win-unpacked/WeftPilot.exe`再运行`pnpm test:e2e`；各默认用例创建独立测试数据，不使用正式用户数据。

本轮内核109/109、桌面20/20、装配策略3/3通过；strict/lint/format及构建通过。开发与正式身份本地候选的默认原生E2E均为9通过/11显式跳过；有调用成本或需特定条件的CLI/来源/安装器测试另按各阶段记录真实运行，未将跳过项计为通过。独立NSIS1/1加已安装应用agent-browser实看通过。

Windows安装器与本地发行材料独立Reviewer最终APPROVE，无待修复P0/P1/P2；测试保护提交后独立NSIS复验1/1通过。Reviewer另核对三个候选应用目录的115个内核文件集合/SHA和真实发行材料，不将其源码检查当成自己执行过安装流程。详细归属及限制见[安装器记录](m4-installers.md)。

## 外部条件到位后的顺序

1. 仅在GitHub Actions Secret配置只读`AGENT_TEAM_READ_TOKEN`，再重跑桌面Windows/macOS CI；不要在聊天、Git或公开日志提供令牌。
2. 在专用开发飞书应用与本机连接表单中完成权限/事件/卡片核对，验证重复、过期、跨渠道决定；不切换既有在线服务。
3. 用专用有效自定义模型凭据验证成功执行；合成401拒绝不算成功。
4. 在macOS实际设备执行原生启动、Keychain、双CLI、进程停止、备份恢复、安装与升级，逐项记录硬件/架构/系统与结果。
5. 所有者决定发行许可证，另行授权签名、公证、正式更新地址与公开发布；未获授权前不发布或接触签名材料。

细项见[外部待办](pending-external-validation.md)。M4完整退出条件仍要求两平台原生与旧入口回归；本机可独立完成的工作不会等待这些凭据，但这些验收不能伪造或省略。
