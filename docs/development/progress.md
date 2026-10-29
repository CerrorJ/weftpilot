# 开发进度与跨设备交接

更新：2026-10-29。用户已授权 M0—M4 连续开发，两仓开发分支分别提交并推送，不合并、不公开发布。

当前未完成项及外部条件集中在[待办入口](remaining-work.md)，下方保留每次增量实际证据和历史时点。

后续授权更新：凭据由用户后续提供，继续推进可独立完成的 M1—M4 开发。本文先前“凭据到位再推进 M1”的顺序被本条取代；飞书真实租户、签名和macOS用户设备验收保留待办，跨仓CI读取权限已解决。

## 当前状态

任务看板源码`e4a64bc666cf17e0e18177c8721159f0b8e8262a`独立GUI限定PASS/Reviewer APPROVE；[CI40868460148](https://github.com/CerrorJ/weftpilot/actions/runs/40868460148)整轮FAIL，新看板用例两平台开发及实际包四处通过。Win核心185/单元60/装配8，开发及实际包各73项56通过17跳过，真实公共来源1通过2CLI跳过，NSIS装配成功。Mac核心175通过10跳过/单元60/装配7通过1跳过，开发同绿、实际包55通过1失败17跳过，唯一失败是备份模型密钥`CREDENTIAL_STORAGE_UNAVAILABLE`；来源专项未执行，ARM64 DMG/ZIP已装配。独立CI Tester核34图/官方摘要/完整日志，Reviewer另核官方run/jobs及日志批准限定事实。Mac窄图卡片在截图范围外，不能据图宣称完整视觉覆盖；历史存储根因未关闭，详见[看板](task-board.md)。当前docs分支仅汇总确切e4证据，不重新构建或改变固定2750/0.13.0/p1/schema12/142文件产物，也不合并发布。下段保留提交前时点。

继续[任务列表/看板](task-board.md)：同一快照/筛选与四栏、列表切换保留详情UUID、确切创建回执及归焦已实现，固定2750/013/142不变。60单元/strict/lint/规模、开发专项1P，新Windows实际包完整73项56P17S0F0cancel通过；独立GUI限定PASS，受控历史unknown退出拒绝及精确人工夹具清场单列，不算真实停止证明。独立审查和本提交原生CI继续，工作台与设置差距仍未实施。

技能目录0a3的[CI40864862490](https://github.com/CerrorJ/weftpilot/actions/runs/40864862490)双平台SUCCESS：各58单元、开发及实际默认72项55P17S、实际公共来源专项各1P2CLI-S、未签名安装装配通过；独立Tester已核官方32图/摘要/完整日志。Windows另有完整真实来源独立GUI PASS。源码和CI补审分开记录，a629/939/637三轮FAIL及历史Mac根因保留，不能继承为本看板提交的CI。

技能候选a629的[首CI40858103506](https://github.com/CerrorJ/weftpilot/actions/runs/40858103506)失败：Win真实公共来源在两次安装前置后卡片即时计数1!=2，Mac实际包备份加密不可用、来源专项未执行。官方29图/两日志/失败后公开诊断已独立核验，不能写成通过。驱动现等实际安装卡片更新，Reviewer新增卸载归焦P2已修并经受控历史实际窗口定向PASS，2相关容器通过；新提交CI及代码补审继续。历史无资源、不是下载安装证据，固定内核2750不变。

继续[技能目录与原型交互](skill-catalog.md)：固定2750/013/142文件不变，新界面市场/已安装、真实目录搜索/来源筛选、卡片详情与来源弹窗已接入；同名身份区分及英文漏项两P2一次补包关闭。58单元/8装配/strict/lint/格式通过，首包完整71为54P17S，修正包相关4P及新目录1P分别保留，独立GUI限定PASS。成功网络下载/安装等尚待新CI与独立补验，本机一次tree HTTP403额度0、产品真实下载失败原样记录，不用模拟替代；其他八页差距继续。

角色渠道3af最终独立CI Tester已核官方24图/完整日志/摘要，Reviewer CI补审APPROVE；下方“独立收口中”保留提交时点。桌面证据文档72a1812、内核关联文档9d3644d已分别推送，不改变2750固定产物，不自动合并或公开发布。

角色渠道桌面3af（许可修复c5ab）已推，独立GUI限定PASS/源码Reviewer补审APPROVE，两项P2关闭。[修正CI40854594227](https://github.com/CerrorJ/weftpilot/actions/runs/40854594227)两平台SUCCESS：Win核心185/54单元/8装配，Mac核心175通过10平台跳过/54单元/7装配1平台跳过；开发及实际包各70项53通过17跳过，未签名安装装配通过，官方24图独立收口中。本轮Mac未复现加密失败，旧f3 FAIL和根因保留。八页独立诊断仍未整体对齐：技能目录、任务看板、工作台项目/待处理区、设置逐角色连接与通知分类；当前独立feat/skill-catalog继续真实技能目录交互，未把后续WIP当已验收。

角色渠道候选f3的[CI40850060710](https://github.com/CerrorJ/weftpilot/actions/runs/40850060710)Windows成功、macOS实际包备份用例因CREDENTIAL_STORAGE_UNAVAILABLE失败，独立核官方日志/24图/摘要后仍FAIL。Reviewer第二P2为普通编辑静默放行未启用绑定，当前已保留许可并增加显式选项、固定旧草稿版本补缺省；54单元及新Windows实际包13专项通过，独立GUI/审查与修后新CI继续。加密仅新增失败后元数据，不回退明文、不掩盖失败，内核2750/0.13.0/142文件与摘要不变。详细证据见[角色渠道记录](role-feishu-routing.md)，下方候选未运行CI等表述保留历史时点。

继续[角色飞书绑定与固定路由](role-feishu-routing.md)：唯一内核2750/0.13.0/p1/schema12已先提交推送，185核心与独立Tester/Reviewer通过，历史归属/大小写P2修后关闭。两干净重建同SHA、142正规产物/额外宿主锁分别核验，固定装配真实IPC/关机通过。桌面已接角色第5步三入口/宿主密文/版本与null/历史路由状态、53单元/8装配/开发相关9项及实际包新增3项通过，完整包与独立GUI正在验收，候选原生CI未运行。QR注册尚未接入、测试应用未创建/连接，不复制凭据或切换在线服务；下方保留旧增量时点。

团队目录代码aae及测试关闭等待2f已推，固定内核2ab/0.12.0/p1/schema11/135文件不变。[修正CI40452246829](https://github.com/CerrorJ/weftpilot/actions/runs/40452246829)双平台SUCCESS：Win核心175、51单元、8装配；Mac165核心通过10平台跳过、51单元、7装配1平台跳过；各开发/实际包66项49通过17跳过0失败0取消，未签名NSIS/ARM64 DMG/ZIP装配通过。本轮官方20图/逐条摘要/完整日志已由独立Tester及Reviewer核验，最终限定PASS/APPROVE，详情见[团队记录](team-catalog.md)。下方aae首轮失败、本地串行红轮和旧Windows故障仍保留原归属，后续成功不覆盖根因或整体M0—M4验收。

团队候选aae已推，[首CI40449807913](https://github.com/CerrorJ/weftpilot/actions/runs/40449807913)Windows完整49P17S/66通过，Mac开发48P1F17S（解除默认团队后的焦点断言），整体FAIL，Mac实际包/安装未执行；独立核20图/摘要/日志后原样保留。相关测试现补CSS真实DOM卸载等待并保留焦点断言/失败诊断，本机实际4P；应用代码与0120/2ab产物未改，新确切提交原生CI待重验。详见[团队记录](team-catalog.md)，不把此前源码/GUI批准或Win通过覆盖Mac失败。

继续[团队目录/版本编辑](team-catalog.md)：唯一内核0120/2ab/p1/schema11/135文件已先推送并两干净重建一致，175核心及独立后端Tester/Reviewer通过；桌面卡片/说明/负责人/历史编辑、13角色12/13边界接入。strict/lint/格式、51单元/8装配、独立GUI限定PASS，最新实际双CLI团队1/1通过。首完整串行66为46P1F19S，保存后版本即时读断言已修为等确切v3、实际包专项2P，不倒写全套；当前候选CI继续验。成员少选经事件证据确认为驱动未点中，撤回产品归因；旧0110两错误窗口仍PENDING。前一项目配置docs分支已随正常Git恢复补推，下方保留过程时点。

项目配置增量代码7b2954b/内核c960-0110的[CI40442209173](https://github.com/CerrorJ/weftpilot/actions/runs/40442209173)双平台SUCCESS：Win170核心/51单元/8装配，Mac160核心+10平台跳过/51单元/7装配+1平台跳过，各开发/实际包64项47通过17明确跳过；未签名NSIS及ARM64 DMG/ZIP装配通过。独立GUI/CI Tester与Reviewer核16图/官方摘要/日志后限定PASS/APPROVE，P2关闭；本机两个停止工作窗口与未结束整轮仍PENDING，不被CI绿覆盖。详见[完整关联和限制](project-settings.md)。代码分支不合并不发布，docs仅汇总证据。下一项已在独立feat/team-catalog工作树开始，以0110现有内核补齐团队目录/编辑/版本交互；下方保留本增量过程时点。

0110最终包追加回归出现两项Windows崩溃弹窗/未退出现场，所属测试为prototype-navigation与role-wizard-version-regressions，根因未定，保留进程/数据/日志，不将此轮写作通过。新增项目只读历史展示的真实CLI专项再次1/1通过；此前完整47通过17跳过仅适用于各自包。当前按[项目配置记录](project-settings.md)继续独立诊断、UI验证及新提交原生CI，不强杀换绿或停等用户。

当前推进[项目目标/描述/默认团队](project-settings.md)：唯一内核c960/0.11.0/p1/schema10/134文件已先推送并两份干净重建一致；内核170回归及独立Tester/Reviewer通过。桌面真实接入创建/配置、项目团队、双版本CAS和固定Run上下文；开发/实际Windows完整64均47通过17明确跳过，真实CLI上下文文件1/1通过。首轮内核创建P1、UI清除团队卸载草稿P2和select名称已修，保留失败历史。Run只读展示追加、独立UI/最终审查及当前双平台CI继续验收，尚不关闭此增量或整体M0—M4；下方0100内容保留历史时点。

当前完成[需求优先级/业务阶段](requirement-metadata.md)增量：桌面214实现及6a7340b修复、内核0.10.0/969b548/p1/schema9/132文件已分别推送。修复[CI40435856697](https://github.com/CerrorJ/weftpilot/actions/runs/40435856697)双平台SUCCESS，各51单元、开发/实际包45通过16明确跳过、未签名原生安装包装配通过；固定内核Win164/164、Mac154通过10平台跳过。独立Tester/Reviewer验证真实094→0100升级、版本/冲突/清除/归档、P2四空白边界和6a原生CI日志/12图/官方摘要后限定增量PASS/APPROVE。214的trim P2及初轮REQUEST_CHANGES保留，未将214绿色当修复证据。本地修复只重跑1+4专项，完整修复61由确切6a CI覆盖；不倒写本地结果。下一项为项目目标/描述/默认团队，整体原型和M0—M4未封板。

两仓关联：桌面代码`feat/requirement-metadata/6a7340b`；Agent-Team源码`feat/requirement-metadata/969b548`，关联文档205e81e。后者不改变固定内核版本或摘要；桌面`docs/requirement-metadata-validation`仅汇总证据，未合并分支或公开发布。

需求优先级/阶段进入[0100接入](requirement-metadata.md)：唯一内核969b548已先提交推送，0.10.0/p1/schema9/132文件与新tar摘要从两份干净检出重建一致；内核164及原服务/嵌入构建、独立Tester/Reviewer通过。桌面已锁定产物，strict/lint/格式、51单元/8装配及实际Windows包完整61项45通过16明确跳过；独立旧094→新0100实际界面验收进行中，新分支CI尚待，未将局部通过当完整M2/M4。今日真实剪贴板成功/迟到用例也实际通过，旧error5本轮未复现，历史根因不因此关闭。

后续21401f候选真实界面/升级/schema9归档已独立通过，其[CI40434671475](https://github.com/CerrorJ/weftpilot/actions/runs/40434671475)两平台SUCCESS；但Reviewer发现枚举trim导致异常空白变清除/合法值的P2，故候选不验收。现已保留原值、仅严格空串清除，新增四项实际异常选项断言，新Windows修复包4相关回归通过；独立P2补验与修复后CI继续，不用214绿色覆盖缺口。

P2修复已单独提交推送6a7340b，独立Tester真实四负例/合法清除和枚举保存通过，正常exit0/自有树空；Reviewer定向APPROVE并保留原REQUEST_CHANGES。源0.10.0/969/132文件/摘要未变，[修复CI40435856697](https://github.com/CerrorJ/weftpilot/actions/runs/40435856697)后续双平台通过且已独立补验。`docs/requirement-metadata-validation`仅汇总报告，不改变或重新装配运行产物；完整M0—M4仍未封板。

需求创建关联任务实现`16eabd7156d214a4d6def8ae7d6876383a108bcb`已提交推送，独立Windows Tester PASS/Reviewer APPROVE；[CI40272620242](https://github.com/CerrorJ/weftpilot/actions/runs/40272620242)双平台成功，各51单元、开发/实际包44通过16明确跳过、未签名原生安装包装配通过。独立Tester/Reviewer各自补验确切日志、8图与官方摘要一致，限定增量PASS/APPROVE；固定项目/来源版本、输入保护、唯一任务/零Run、重启及两次正常退出证明齐全。本次没有模型执行或飞书联调。当前`docs/requirement-workflow-validation`仅汇总确切实现提交的验收，不改变或重建应用/内核；后续仍按[待办](remaining-work.md)推进，不宣布整体M0—M4或原型封板。

两仓已分别推送：桌面实现16e/`feat/requirement-task-create`，Agent-Team关联文档885bb40/`fix/native-path-identities`；运行内核来源仍51f/094/p1/schema8/131文件，tar摘要不变。文档提交不漂移锁定产物；未合并开发分支或公开发布。

需求目录`ca46ce248ab4abbc7b80ff09836321734af7c4d4`已推送，独立Windows Tester/Reviewer通过，[CI40271482336](https://github.com/CerrorJ/weftpilot/actions/runs/40271482336)双平台成功，各开发/实际包43通过16跳过、51单元与未签名安装包装配成功；独立Tester/Reviewer补验4图/摘要及确切日志后限定CI范围PASS/APPROVE。已接着实现[创建关联任务](requirement-task-create.md)：需求版本和项目固定、文本预填/失败保留/成功打开确切任务、后台新版本不改绑；新实际Windows包60项42通过18明确跳过、51单元/8装配/strict/lint/格式通过，独立验收和新CI待完成。内核094/51f/131文件/原摘要保持不变。

Git地址复制`44d4df6`的[CI40269550640](https://github.com/CerrorJ/weftpilot/actions/runs/40269550640)双平台成功，各开发/实际包42通过16明确跳过、51单元及未签名安装包装配通过，真实复制/读回/Unicode/迟到回执两项在强制原生模式实际跑过；独立Tester/Reviewer补验日志、8图和摘要后限定CI范围PASS/APPROVE，本机受限保留。继续[需求目录](requirement-catalog.md)：列表/详情/新建与编辑弹窗、CAS输入保护及历史引用；实际Windows包59项41通过18明确跳过，51单元/8装配/strict/lint/格式通过，独立验收和新分支CI待完成。整体原型与M0—M4仍未封板。

已核验`35d411d`测试层及`5f28898`项目导航的[CI40264396158](https://github.com/CerrorJ/weftpilot/actions/runs/40264396158)双平台成功：各44单元，装配Win8/Mac7通过1平台跳过；锁定内核Win160/160、Mac150通过10平台跳过；开发及实际应用各39通过16明确跳过，未签名NSIS/ARM64 DMG/ZIP装配成功。旧0xC0000005本轮未复现，具体历史根因及用户设备/真实Mac CLI/安装升级/签名限制保持原归属。

继续`feat/project-git-copy`接回原型[Git地址复制](project-git-copy.md)：只消费内核脱敏元数据，主进程命名桥接核对后串行写入并私有比较。51单元/严格检查通过；本机实际包58项40通过18跳过，其中新增两个真实成功路径被系统剪贴板不可访问阻塞，负路径已验证。独立验证及强制原生成功的CI待完成，当前是开发候选，不能记作功能验收通过；不改系统权限或等待用户而继续CI验证和其他工作。

8076500的[双平台CI40256239326](https://github.com/CerrorJ/weftpilot/actions/runs/40256239326)已核验：路径回归Win160/160、Mac150通过10平台跳过；44单元、装配及两平台开发应用均过，Mac实际包38通过16跳过、DMG/ZIP装配过，Win实际包备份最后退出0xC0000005失败（37通过1失败16跳过），非双平台全绿。[退出调查](windows-exit-investigation.md)保留故障与本机调试连接证据。后续`35d411d`独立提交测试层维护：仅will-quit释放Windows测试调试器、所有特殊启动也接入、M0加强严格exit0，原负例不弱化。独立真实CLI停止/完全退出1/1（1trial+2业务Run全部confirmed_ended/PID消失）、实际窗口及6负例通过，Reviewer最终APPROVE；PS5 BOM/UTC/白名单边界定向关闭，新CI仍待核验。

项目详情按原型新增[项目任务管理跳转](project-task-navigation.md)：精确UUID筛选同名项目、空列表、显式全局入口重置/轮询保留、原详情入口。独立实际窗口及P2定向补验通过，Reviewer限定UI增量APPROVE；最终fixed包55项39通过16跳过/0失败/0取消、44单元/8装配/strict/lint/摘要通过。功能在feat/project-task-navigation单独提交；新CI待推送后核验，不把旧CI当新功能通过。固定内核仍094/51f0b18，131文件/摘要未变。

内核`fix/native-path-identities/51f0b18`已提交推送；桌面固定0.9.4/p1/schema8/131文件，远程隔离重建及实际包摘要一致。内核真实8.3临时目录160/160、原服务/内核构建、独立Tester/Reviewer通过；中文长/短父TEMP下两仓定向验收零跳过，审查发现的COM编码P2已关闭。桌面44单元/8装配、strict/lint/格式、新锁定内核160项及新实际Windows包完整54项38通过/16跳过。094独立实际窗口PASS（两周期正常退出、短DATA/仓库、偏好重启），随后Reviewer最终APPROVE。新双平台CI待提交后核验，详见[原生路径记录](native-path-identities.md)。

原093实际包首次37通过/1取消/16跳过，保留已停止内核但主进程残留现场；其后只读生命周期诊断完整轮38通过/16跳过、094原始全量同样通过，都不能关闭原间歇性原因。旧停止不确定/Keychain/恢复负例及损坏缓存现场分别保留。

网络正常HTTPS推送已恢复：内核`feat/project-inspection`与桌面`feat/project-overview/de97647`已推送；其[CI 40191016267](https://github.com/CerrorJ/weftpilot/actions/runs/40191016267)两平台停在锁定092内核回归（Win117P40F0S，Mac139P9F9S），未运行桌面。下文推送阻塞是此前时点，不能覆盖此恢复事实；备用连接器写403仍保留。

项目页`feat/project-overview`已完成[Windows限定验收](project-overview.md)：固定092/3910834/p1/schema8/131文件，两份干净重建摘要一致，最终锁定内核157回归及独立Tester/Reviewer通过；桌面44单元/7装配、strict/lint/格式及Windows功能修复包38通过16跳过，项目专项2项为完整54项子集。其后P3表头字典修复在最终i18n包独立定向关闭，不冒称该包全量重跑。独立Tester19断言PASS、Reviewer APPROVE，两实例正常退出/自有树为空；受控历史及迟到时序均准确区分。官方Electron缓存与发行digest一致后离线装配，标准下载和两仓推送的网络失败仍保留，无新CI/其他平台或完整原型封板结论。

091桌面实现已本地提交`b75660ba6043de96812442ba200ed8cd9dd3e833`，固定内核aaee已先前推送；本次桌面推送遇真实网络阻塞（Git HTTPS/SSH未连通，系统代理未解决），备用GitHub连接器上传403无写权限。只读确认远端仍26f，未创建新分支或改变远端；091 CI未触发。保留本地提交与验收证据，不等待凭据而继续本地后续开发，具体见[接入记录](cli-input-lifecycle.md)。下段“待提交”为提交前验收时点。

当前接入091：内核`aaeeeb41990920f3223f32a94b2c6e86ef7719a4`已推送，153项、原服务/内核构建及独立Tester/Reviewer通过；桌面已锁定0.9.1/p1/schema8/128文件并独立重建相同tar摘要，补充输入失败双语提示、装配Git根目录保护和锁定内核CI回归。桌面strict/lint/格式、43单元/7装配、实际Windows包36通过16跳过及真实Codex文件闭环1/1通过；独立Tester9断言及唯一真实Claude trial通过，正常退出且自有树为空，独立Reviewer最终APPROVE。当前待提交，尚无091远端CI，不继承26f结果。见[输入生命周期接入](cli-input-lifecycle.md)。

此前测试维护`26f2f309bbc11eed74b45e18db7b99a561c08d5c`[CI 40174133079](https://github.com/CerrorJ/weftpilot/actions/runs/40174133079)双平台成功，各43单元/6装配、开发及实际包36通过16跳过及NSIS/ARM64未签名DMG/ZIP装配通过；c303恢复退出原失败仍保留，Keychain/旧停止根因未关闭。

此前090真实人工处理与退出响应测试维护已完成独立Tester/Reviewer并提交26f：真实Codex人工1/1、真实文件M1退回新Run1/1，独立Claude完整同Run续接及英文显式验收PASS/13断言；退出实际备份2/2、受控防误报6/6和原生菜单丢响应探针1/1通过。strict/lint/格式、43单元/6装配、实际包36通过16跳过。仅测试/文档变化，产品与固定090/fb313df未变；其CI结论见上段，不追溯关闭c303失败或旧停止/Keychain根因。详见[人工补验](human-review-regression.md)和[退出响应](native-quit-response.md)。

草稿入口已提交推送`c3030fb98ab40f5719f26fc06e0988845bb0f7b9`，Windows独立Tester/Reviewer通过；[CI 40172942235](https://github.com/CerrorJ/weftpilot/actions/runs/40172942235)Windows全部成功，macOS开发35通过1失败16跳过，在恢复退出菜单evaluate上下文销毁，实际包/安装器未执行。当前不宣称双平台成功。后续仅测试维护：严格核对真实exit0与恢复证据的[退出helper](native-quit-response.md)，以及真实人工处理显式核对交付的[回归补验](human-review-regression.md)；Windows定向备份2/2、真实Codex人工1/1和真实文件M1退回新Run1/1通过，独立Claude与退出边界验证继续中。内核不变090/fb313df/p1/schema8，未改产品状态机或原未知停止现场。

下面两段是c303提交前的本机验收及4fdd提交的CI原范围，当前源码/CI状态以上段为准。

“继续角色草稿”和空白新建增量已完成Windows独立Tester/Reviewer，17证据断言、37单元/6装配，修复实际包36通过16跳过，归焦P2与新增按钮分组已关闭。内核不变090/fb313df/p1/schema8/127文件，草稿仅本窗口sessionStorage；当前待提交，完整角色飞书路由、其余页面原型及真实平台/停止历史问题继续推进。复现和准确验证范围见[草稿入口](role-draft-entry.md)。

角色复制已提交推送`4fdd9fe607e2943fd9360f110e0bef9e050ae1b5`，关联固定090/fb313df。[CI 40171628155](https://github.com/CerrorJ/weftpilot/actions/runs/40171628155)两平台均成功，各36单元/6装配、开发与实际包34通过16跳过和未签名原生安装包装配通过。Mac本次未复现Keychain，历史根因/用户设备/真实CLI限制继续保留。下一草稿入口与空白新建正在实际独立验收，37单元/6装配、Windows包36通过16跳过；真实公共技能来源预览/安装/升级/卸载与显式Continue往返1通过、2个CLI用例明确跳过，不冒认本轮模型执行，见[草稿入口](role-draft-entry.md)。

## 历史增量与当时结论

以下保留各提交/验收时点；其中“尚未提交/正在运行”不覆盖上方当前状态，完整M0—M4与原型仍未封板。

090角色复制客户端已通过Windows独立Tester，长源名P2定向关闭；修复包完整50项34通过16跳过，36单元/6装配通过。真实Codex专项3/3中一个用例包含来源/副本各一次独立trial，原配置与历史不变。独立Reviewer最终APPROVE，无新增P0—P3；当前待提交，不继承前序CI。固定内核`fb313df324527426197e293831f61278860ef1e8`/0.9.0/p1/schema8/127文件，具体中断归属、真实/受控证据及复现见[角色复制](role-copy.md)。后续继续独立草稿入口与新建并存、角色飞书路由及其余原型差异，M0—M4整体仍未封板。

角色入口已推送`7420a2d1c84e604f5efece845b85fe7b7613a54d`，独立Tester补核对[CI 40104044202](https://github.com/CerrorJ/weftpilot/actions/runs/40104044202)双平台成功：各36单元/6装配，开发及实际包32通过15跳过，NSIS/ARM64未签名DMG/ZIP装配通过。本次未复现Keychain，历史与隔离失败不关闭。下一真实复制能力已先提交内核`fb313df324527426197e293831f61278860ef1e8`/090/p1/schema8，142项及内核独立验收通过；桌面锁127文件后正在接入，不继承7420 CI，见[复制接入](role-copy.md)。

角色入口差异已完成Windows限定范围独立Tester/Reviewer：移除快捷下拉/全局Edit，卡片精确选择、取消焦点、市场/new草稿保护、外部更新CAS及双语明暗；36单元/6装配、实际包47项32通过15跳过，独立12证据断言及Reviewer9相关单元/126文件完整性通过。首轮旧role option等待导致21失败/5取消保留，修正测试助手后全量通过；详见[角色入口交接](role-entry-alignment.md)。内核仍080/3b1，未提交入口不继承fa30 CI，独立Continue草稿及fresh并存仍待补齐。

已核对080客户端`fa30eb8f43514b80eb289acd30d7a20d895469ed`[双平台CI 40102151584](https://github.com/CerrorJ/weftpilot/actions/runs/40102151584)全部成功：各36单元/6装配、开发与实际包均31通过15跳过，NSIS及ARM64未签名DMG/ZIP装配成功。本次未复现Keychain错误，b2d隔离分支的三失败与正式Mac待办继续保留，不能宣称根因关闭。以下尚在运行是此前时点；当前角色入口对齐工作区尚未提交，不继承fa30 CI。

CLI客户端已提交推送`fa30eb8f43514b80eb289acd30d7a20d895469ed`，关联固定080/3b1；独立Tester及Reviewer最终APPROVE，文档来源P3修正后关闭。[CI 40102151584](https://github.com/CerrorJ/weftpilot/actions/runs/40102151584)尚在运行，不继承070前序结果。独立Keychain测试身份隔离`b2d13e2`的[CI 40101800458](https://github.com/CerrorJ/weftpilot/actions/runs/40101800458)仍Mac实际包失败（26通过3失败14跳过），没有解决目标错误、没有合入080；具体两个密钥失败与一项超时分别保留，见[调查](macos-keychain-investigation.md)。当前继续角色页入口差异，不等待凭据。

CLI分项检查桌面已完成Windows限定范围独立Tester：真实只读四类命令（另两项英文布局复查）、默认账户/模型连接边界、切换/关闭/市场不自动查询、隐私、坏输入和焦点。36单元/6装配、strict/lint/格式/构建通过，实际包默认46项31通过15跳过，专项两UI+一真实四查询用例3/3。锁定内核080/`3b1c8b65fb93cb20e14a2b290f485ae91fecd3a2`，两份干净重建126文件及tar相同；独立Reviewer最终APPROVE，未继承前序CI，详情见[CLI接入及限制](cli-checks.md)。

角色卡片已提交推送`2cb75c12326ba740b50d943372e2b3c38500b487`，其[CI 40099809043](https://github.com/CerrorJ/weftpilot/actions/runs/40099809043)Windows通过，35单元/6装配、开发与实际包各29通过14跳过。macOS开发同样通过、DMG/ZIP装配成功，但实际包备份保存合成密钥再次出现`CREDENTIAL_STORAGE_UNAVAILABLE`（28通过1失败14跳过）。保留原失败与历史Keychain根因待查，当前不是双平台全绿。下一CLI分项检查已先形成内核`3b1c8b65fb93cb20e14a2b290f485ae91fecd3a2`/080/p1/schema8及126文件固定产物，桌面接入仍开发中，见[CLI接入](cli-checks.md)。

角色卡片/独立运行设置增量已完成Windows限定范围独立Tester与Reviewer：三列/窄屏、六步编辑和市场草稿、冻结版本、确切本版本证明重新启用、trial历史及业务验收隔离；35单元/6装配/strict/lint/格式/构建通过，实际包43项29通过14明确跳过。专项2/2为1受控用例及1真实Codex用例，后者实际两次trial且旧v1不启用v2，未点击真实停止。122文件/锁/tar独立核对一致，内核仍070/e6c。本增量未继承18465的CI，整体角色设计/CLI分项/飞书路由仍继续推进，详见[角色卡片记录](role-cards.md)。

已核对Run历史增量`18465bdeb7d29c92caeed6d014613a0e2e5c7e63`的[双平台CI 40096365165](https://github.com/CerrorJ/weftpilot/actions/runs/40096365165)：Windows和macOS均成功，各31单元、6装配，开发及实际打包应用均41项28通过13明确跳过，NSIS及ARM64未签名DMG/ZIP装配成功。本次Keychain失败未复现，历史根因仍未定位；用户Mac安装升级、真实CLI和签名未据此验收。下段“尚无结论”为提交前记录。角色卡片后续工作区尚未提交，不继承该CI结果，见[当前角色卡片工作](role-cards.md)。

Run历史/交付验收增量已完成本机独立Tester/Reviewer：固定Run快照、旧交付只读、明确核对及退回、新Run保留反馈、角色变更不改旧依据、失败保留与并发拒绝、嵌套弹窗/焦点和重启；31单元/6装配及strict/lint/格式/构建通过，修正版Windows实际包41项28通过13明确跳过。真实Codex两轮分别包含1trial+2业务Run，后轮补核对HEAD/空diff并保存证据，未当作旧扩展CLI失败已修复。独立窗口采用受控执行端口，和根真实CLI证据严格分开。详见[本增量及限制](task-review.md)。本增量CI尚无结论，不继承下述9b结果；下一步继续角色卡片、CLI分项检查与飞书角色路由。

预检增量已推送纬舟`9b53992762e29bfab5842bef39ccd51afaa51112`，关联内核`e6c33e97e18859453b441fccaff63442cda07333`/070/p1/schema8。[桌面CI 40092321957](https://github.com/CerrorJ/weftpilot/actions/runs/40092321957)双平台全部通过：各28单元/6装配，开发和实际包均26通过12跳过，NSIS与ARM64 DMG/ZIP装配通过。本次未复现Keychain错误，历史根因仍未定位，不等于原生用户设备/安装升级/签名验收完成。以下结果保留各自提交归属。

最新任务预检增量已装配070/`e6c33e97e18859453b441fccaff63442cda07333`/p1/schema8，122文件与tar经两份干净检出重建一致。内核127项及独立Tester/Reviewer通过；桌面28单元/6装配/strict/lint/构建通过，实际Windows新包38项26通过12跳过，单独真实Codex预检3/3通过。任务开始/重试/团队开始均先检查并显式确认，旧Git预览拒绝，新Run执行成功保持待验收。桌面独立Tester/Reviewer最终通过；关闭焦点P2与英文遗漏P3修复后已独立定向复验，等待/未知等未UI实测范围如实保留。070远端CI尚无核对结论，详见[预检交接](task-preflight.md)。以下060及更早结果保留原版本归属。

最新六步源码`2c60652791cf7dfa9f073b738dc5dc33a78c2cc7`的[CI 40088172558](https://github.com/CerrorJ/weftpilot/actions/runs/40088172558)已结束：Windows全部通过（27单元、6装配、开发/实际包各24通过11跳过）；macOS在实际打包应用`workflow:saveModel`继续返回`CREDENTIAL_STORAGE_UNAVAILABLE`。当前双平台尚未全通过，不能以此前全绿记录代替。下一增量为内核只读任务预检，尚未更新060桌面锁。

角色六步首增量已完成本机独立Tester/Reviewer验收：真实字段/保存版本/试运行与显式启用、市场往返、草稿起始版本/CAS保护和明确放弃后重载、受控模型历史引用，以及双语/明暗/700px。27项单元、strict/lint/格式/构建通过；两项审查P2修复并独立复验4/4，最新Windows包35项24通过11跳过。一次主体真实Codex trial确认结束后显式启用，未将后续UI补验写成重复真实模型调用。详见[角色与限制](role-wizard.md)。角色卡片、CLI分项检测、飞书路由、任务执行前检查和完整验收布局仍待实施。

最近CI：060接入`9f63b66`曾因测试清理误读恢复后的TEMP变量而双平台失败；隔离修复`2b98e9c`已验证两平台26单元通过。其[CI 40084065742](https://github.com/CerrorJ/weftpilot/actions/runs/40084065742)Windows全通过；macOS开发16通过11跳过、未签名DMG/ZIP装配成功，但实际包备份密钥写入仍Keychain不可用（15通过/1失败/11跳过）。串行未消除，当前macOS不全绿，见[范围修复](fixture-cleanup.md)及[外部待办](pending-external-validation.md)。本六步分支保留同源码修复，未自动合并开发分支。

最近确认双平台全通过的源码仍为`6d3d288`/059/193，[CI](https://github.com/CerrorJ/weftpilot/actions/runs/40077244639)每平台23单元、6装配、开发/实际包各14通过11跳过，NSIS及macOS26 ARM64未签名DMG/ZIP装配成功。后续任务页`520130b`的[CI](https://github.com/CerrorJ/weftpilot/actions/runs/40081253452)已结束：Windows全通过（26单元/6装配，开发/实际包各15通过11跳过）；macOS开发15通过11跳过、安装包装配成功，但实际059包保存合成密钥时Keychain不可用，14通过/1失败/11跳过。没有将该失败写成双平台通过；串行隔离测试措施仍待新CI验证。完整原型仍未验收，详见[原型对齐](prototype-alignment.md)。

任务页`520130b`完成本机独立验收/审查：四状态及紧凑工具栏、确切回执选择、外部新任务不抢详情、焦点、原型字体、团队父任务投影修复；26单元/6装配通过，对应Windows包默认15通过11跳过。内核角色字段/并发与迁移增量已在`feat/role-configuration`提交推送`c7366ba`，0.6.0/p1/schema8，120项全通过且独立Tester/Reviewer通过，两份干净检出116文件与tar摘要一致。后续桌面已显式更新060锁并重装配；实际新字段IPC回归通过，最新Windows包27项16通过11跳过，独立包边界2/2及116文件完整性/真实页面握手/退出通过。首次词典文件清理EBUSY及修复后复验分别保留。角色六步界面仍未完成，详见[角色六步接入](role-wizard.md)。

### 历史阶段基线（不代表当前锁定）

最新CI进展：用户已配置专用只读凭据，`fix/native-pnpm-launch`源码`34bfa29`的[双平台CI](https://github.com/CerrorJ/weftpilot/actions/runs/39915331008)已全部通过。修复原生pnpm启动、测试临时路径别名、规范化pnpm12工具链锁及主题初始化等待。两平台各21项单测、6项装配回归、开发/实际打包Electron各9通过11显式跳过；Windows NSIS与macOS ARM64 DMG/ZIP装配均成功。见[CI修复记录](ci-native-pnpm.md)。下文历史“缺凭据/CI未通过”描述不再代表当前状态；用户设备、真实CLI和macOS安装升级等剩余验收仍保留。

M0本机原生与打包、M1真实闭环、M2双CLI团队已完成Windows限定范围的独立验收；M3人工处理和飞书本机适配也通过。远端桌面CI仍缺跨仓凭证，真实飞书租户、自定义模型成功路径和macOS原生仍待验证，不将局部通过扩写为完整跨平台通过。
M4技能版本、真实双CLI技能交付、备份恢复、只读诊断与预览导出已接入并分别经Tester/Reviewer通过；当前桌面锁定`0.5.8/2d347d1/schema7`。备份桌面关联`b9ad0e9`，诊断关联`1b5b845`；补审关闭SQLite触发器P1、盘根P2、恢复退出竞争及坏业务JSON无法导出报告P2。参见[M4诊断记录](m4-diagnostics.md)、[备份记录](m4-backup.md)、[技能记录](m4-skills.md)。Windows未签名NSIS验证身份安装/升级/卸载经开发者与独立Tester分别真实通过，默认用户目录、运行中拒绝、升级保持密文/偏好及卸载保留均核对；安装器Reviewer最终APPROVE，正式身份本地候选从干净`bf85620`构建、摘要及默认原生9项通过，未覆盖安装正式环境。参见[M4安装器记录](m4-installers.md)及[统一发行交接](release-readiness.md)。M4整体仍因macOS原生等外部条件未完成。
全流程支持中英文及浅色/深色/跟随系统，偏好经重启验证。下文各节为按时间保留的阶段记录，当前状态以本节及各增量文档最新记录为准。

## 跨仓CI历史阻塞（已解决）

通过当前开发设备的正常 Git 认证只读核对 API 后，确认纬舟为 public、Agent-Team 为 private；没有改变可见性。
内核自身 Windows/macOS CI 已通过：[Embedded kernel](https://github.com/CerrorJ/Agent-Team/actions/runs/39798905100)。
桌面两平台 CI 在拉取内核时失败：[Desktop](https://github.com/CerrorJ/weftpilot/actions/runs/39798943330)，错误为缺少 GitHub 跨仓读取身份。
这不是 macOS 编译通过或业务执行证据，不能据此跳过 M0 门槛。

已准备专用凭据接线：CI 先检查 `AGENT_TEAM_READ_TOKEN`，再按完整锁定提交 checkout 私有内核，`persist-credentials: false`；装配发现目标提交已存在时不重复联网，仍校验产物 SHA-256。
缺少凭据时明确阻塞，不回退到其他代码或模拟内核。接线经独立 Reviewer 审查通过。

需要仓库所有者在纬舟的 [Actions secrets](https://github.com/CerrorJ/weftpilot/settings/secrets/actions) 配置 `AGENT_TEAM_READ_TOKEN`，只授予读取 CerrorJ/Agent-Team Contents 的权限，或提供已有 GitHub App 的等价只读授权。
不要将令牌发到聊天或提交仓库。本机 Git 认证只用于本机正常访问，没有复制到 CI，也没有从其他设备复制登录文件。
凭据到位后重跑两平台 Desktop CI，继续修复实际失败，验收 M0 后再推进 M1。

## 工作区保护

开发开始时纬舟 main 干净，基于它建立 feat/m0-kernel-host。
原 Agent-Team main 有 .env.example、README.md、config/bots.example.json 三处既有改动。
内核开发在新建隔离 Git worktree 的 feat/embedded-kernel 分支完成，未带入或提交上述改动。
没有读取旧 .env、CLI 登录文件或生产数据，没有启动独立飞书服务或切换在线服务。

## M0 当前成果

- Agent-Team 显式 createKernel、独立嵌入入口、协议 1、health/events/shutdown。
- SQLite 持久生命周期事件与独占实例锁；未实现业务能力通过握手明确标为 unavailable。
- 原独立飞书入口保留，现有 31 项测试加新增 2 项内核和 1 项 Windows 启动测试均通过。
- 修复 Windows shell 启动导致空格路径失败：受支持 CLI 入口改为 shell:false。
- 纬舟 Electron/React/TypeScript 工程、隔离 preload、来源校验、工具进程宿主、版本核验。
- 原创品牌界面与托盘；关闭窗口隐藏、完全退出先确认内核返回并等待工具进程结束。
- 系统凭据加密适配器已建立，尚无业务凭据写入界面。
- 固定提交重建内核 tarball 并校验 SHA-256；运行时校验内核文件摘要。
- Windows/macOS CI 定义已建立；远端结果单独记录，不将配置存在当作已通过。

## M0 历史关联

- Agent-Team 分支：feat/embedded-kernel，M0 首提交 d9e3f9d，评审修复及锁定源码 8a1491aeab5b6dd194083fb3b1e7a94afa1c3ce9（已推送）。后续纯 CI 修复不改变该已验证产物。
- 纬舟分支：feat/m0-kernel-host，阶段提交见本分支 `feat(desktop): 完成 M0 内核宿主与打包装配`。
- 内核 M1 草稿：feat/local-workflow，提交 a62b780；详细状态见该分支 docs/m1-work-in-progress.md。纬舟没有消费该草稿。
- 内核 0.1.0 / 协议 1 / 数据 schema 1。
- 产物版本、源提交、tarball 与文件摘要：config/kernel-lock.json。

## 可复现方法

两仓都不需要生产配置。桌面构建仅需要纬舟检出和网络，不要求相邻内核仓库。

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
pnpm package
pnpm dev
```

Windows 打包后验证（PowerShell）：

```powershell
$env:WEFTPILOT_PACKAGED_EXE = (Resolve-Path release/WeftPilot-win32-x64/WeftPilot.exe).Path
pnpm test:e2e
```

内核独立检出：`pnpm install --frozen-lockfile`，依次运行 typecheck、lint、format:check、test、build、build:kernel。
原入口仍为 `pnpm start:once`，需要开发设备单独授权的飞书配置，本次未连接真实租户。

## 已执行的验证

- 内核构建、strict 检查、lint、格式检查，34/34 测试通过。
- 内核在桌面独立干净检出中按固定提交重建，tarball SHA-256 与锁文件一致。
- 桌面 strict 检查、lint 与物理行检查通过；4/4 测试通过（2 项客户端契约，2 项 CI 凭据预检）。
- Windows Electron 原生 E2E 1/1 通过：锁定握手、桥接无 require、重新检测、隐藏后查询、完全退出与持久停止事件。
- Electron 42.0.0 工具进程实际运行 Node 24.15.0，SQLite 无额外 ABI 扩展即可运行。
- Windows 应用目录打包成功；打包后 E2E 与独立 Tester 验收通过。增强 E2E 将应用复制到中文/空格/# 安装路径，从临时 cwd、仅 System32 PATH 启动，验证无开发 Node 依赖和系统加密往返。
- 独立 Reviewer 首轮指出许可文本遗漏、CLI PATH 选择和断线文案；均已修复并复核通过。完整 Zod/React/ReactDOM MIT 文本进入产物 notices。
- 匿名/连接器 Actions API 最初返回 404，随后用本机正常 Git 认证临时只读查询确认了上述实际 CI 结果。当前桌面远端 CI 没有通过，不以本机通过代替。
- impeccable 机械检测没有返回命中项。截图在本机 .tmp/evidence/，不提交运行缓存。

## 限制与下一阶段

macOS 未在本机验证，不以跨平台编译替代原生验收；最终 M4 需要 macOS 原生安装、Keychain、停止进程树和更新验证。
未使用签名凭据，没有签名、公证、公开发行或生产服务切换。
旧飞书服务只做现有回归，不代表已验证真实租户连接或桌面/飞书共享新对象。
M0 通过后进入 M1：内核增加项目、角色版本、Task/Run、隔离工作目录、单 CLI、日志、停止重试、交付及人工验收。

## 最新交接（后续记录优先）

中英文切换、浅色/深色/跟随系统已在真实 Electron 与打包默认检查验证。M1 的开发构建真实闭环通过，但补充打包 exe 的真实 CLI 测试发现一次停止后状态待确认，M1 停止验收重新打开。0.2.4 诊断产物已锁定，正在复现和复验，不能沿用此前封板结论。

M2 已在 feat/product-teams 开始；Agent-Team 700da70 / 0.3.0 / schema 3 有需求、模型、团队版本、Claude 受控执行和角色文件挑战试运行基础，59/59 测试及本机两种真实 CLI 试运行通过。桌面仍消费 M1 schema 2 产物；M2 团队调度、模型凭证桥接与界面未完成。M3/M4 未开始。凭证、macOS 原生和其他外部待办持续记入清单，不等待确认。

## M2 当前交接

桌面已改为锁定 M2 0.3.1/a0f90b5/schema 4，需求/模型/团队版本、角色试运行/启用、父子 DAG、人工验收门控、贡献合成和并发队列均已接入实际界面。独立 Codex 团队闭环、旧快照与重启、英文和主题实看通过；默认 E2E 3 通过、3 个付费 CLI 用例显式跳过。详见 [M2 记录](m2-product-teams.md)。M1 停止诊断后续 0.2.4/0.2.5 原生回归及 Reviewer 已通过，旧失败仍保留，参见 M1 记录末尾，不能沿用上面的旧待复验状态。

M2 整体未封板：Claude 新探针收尾/停止待确认、安全模型凭证桥接、打包与整体审查仍在处理。Agent-Team 当前凭据端口在开发，不在桌面产物里引用未提交源码。M3/M4 尚未完成。外部凭据和 macOS 待办只记录，不作为独立开发停工条件。

## M2 模型凭据与精确版本增量（2026-10-23，未封板）

桌面消费内核更新至 0.3.2 / 3df108231a4d8c8f590674b024a7da4f30c72198，已从固定干净提交重复装配并校验摘要。自定义模型表单、系统加密存储、不可覆盖旧引用、私有运行时解析、模型精确版本引用已接入。新增凭据 E2E 和独立 Tester 通过，Reviewer 在审；真实自定义提供方成功执行仍缺凭据，不将本机 401 拒绝路由当模型成功。修复独立测试发现的历史模型下拉丢失问题。详见 [凭据增量](m2-credentials.md)。

停止 E2E 修正了 Playwright 异步 predicate 的假等待，真实在途工具停止和完全退出重新通过；此前偶发 taskkill 128 保持 STATE_UNCERTAIN 并保留现场，根因未关闭。打包内核真实 Codex→Claude 交接、验收与父任务完成已经实际跑通，探针收尾退出码 1 尚需核查，不能宣称整体打包验收通过。M3/M4 尚未完成；外部凭据与 macOS 验证记录后继续独立开发。

凭据增量后续：独立 Tester 与 Reviewer 均已通过，历史模型选项修复经直接保存和二次重启复验；指定结论不等于 M2 整体封板。可复现双 CLI 打包 UI 用例已添加，首次文件比较遇到 Windows 全局 Git 行尾转换，合成仓库固定 LF 后正在重跑，未放宽逐字节断言或改动用户仓库配置。

## M2 Windows 功能范围完成，继续 M3

最终打包双 CLI 用例由父代理和独立 Tester 分别运行通过；增强版 Buffer 三方逐字节、精确上游交付 ID、重启后同 ID 的断言由独立 Tester 再次运行 1/1 通过（102.7秒，exit0），测试代码补审 APPROVE。M2 Windows 核心退出条件（依赖/并发正确、配置快照不改写、第二 CLI 与对应真实界面）达成，按用户授权继续 M3。当前内核 0.3.2/3df1082，桌面功能0293c43，详见 [M2 Windows 验收](m2-windows-acceptance.md)。跨平台、有效提供方凭据、CI Secret 及旧停止不确定现场仍未关闭，不能把阶段本机结果扩大为发行或完整跨平台通过。

## M3 人工处理增量已联调，飞书继续开发

当前桌面锁定 `0.4.2/af9896a/schema5`。三类请求与待处理界面、同 Run 续接、等待重启、中英文和明暗主题已真实打通；独立 Tester 的打包双 CLI 2/2 和手动三类请求通过，独立 Reviewer APPROVE（内核专项15/15、桌面7/7）。父代理另有 Claude 普通提问未产生结构化请求的失败证据，作为P2保留，后续源码正在加强协议指引，未将失败改记成功。具体命令和限制见 [M3 人工处理记录](m3-human-workflow.md)。

Agent-Team 下一版飞书适配正在开发，尚未更新桌面锁定；没有真实飞书凭据，不连接生产应用，先完成端口、持久化与界面。M3 整体与 M4 尚未完成。外部阻塞继续记录后推进，不等待确认。

## M3 飞书连接进入独立复验

桌面已锁定 `0.4.4/d6b470a/schema6`（内核功能c5743a9，生成物兼容修复d6b470a），连接向导、系统密文、版本绑定、真实SDK端口和共享卡片/决定用例均已接入。内核81/81、桌面10/10、实际EXE默认E2E四项通过；独立Tester发现的非法字段原始错误展示已修复，正在复验。详情与失败记录见 [M3 飞书连接](m3-feishu-connection.md)。真实租户未提供，不将合成端口或绑定成功当作飞书连通；整体M3与M4仍未验收完成。

后续锁定升级至 `0.4.6/0ecb4ab/schema6`：0.4.5阻止长卡片截断后批准，0.4.6修复Reviewer指出的实际SDK HTTP响应正文契约P1，并严格核对SDK支持的AppID。83/83内核、10/10桌面、实际SDK本地HTTP/WS专项与94文件独立干净重建通过；Reviewer最终APPROVE，Tester r2负路径和0.4.6包绑定/原生专项均已通过。首次原生测试清理EBUSY按失败记录，有限重试after钩子修正后独立复验1/1通过，并经补审。真实租户、macOS和M3整体仍未验收；继续开发不依赖这些条件的M4能力。

## M4 技能Windows增量完成，继续备份恢复

M3桌面连接增量已提交推送 `07c5eed`。两仓继续在 `feat/skills-release` 开发，桌面固定内核 `0.5.2/062db21/schema7`；来源版本、真实下载预览、确认安装、升级/卸载、角色固定技能和Run独立副本已接入。内核91/91，桌面10/10和默认E2E4通过；开发构建真实Codex/Claude任务2/2逐字节技能交付并人工验收通过。独立Tester的0.5.1实际EXE默认、来源及真实Codex闭环通过，升级基准缺陷已关闭；Reviewer提出的卸载后停用P2在0.5.2修复，独立专项6/6和新EXE默认4项通过，最终APPROVE。104文件/产物摘要经独立干净重建核对。详见[M4技能记录](m4-skills.md)。技能增量完成，M4整体未完成；外部条件继续记录，继续备份恢复、诊断和发行装配。

## 2026-10-23 原型对齐增量（整体未完成）

用户确认最终界面不得偏离 product-design。feat/prototype-alignment 以设计提交 c29c2f5 为基线接入八个实际页面、真实概览、任务表格/项目与搜索筛选、原生创建弹窗、右侧抽屉及键盘操作、设置分类与双语/明暗。锁定0.5.9/1938441/protocol1/schema7内核，权威业务状态未转移。strict、lint/行数、format、23单元、6装配检查及构建通过，最新Windows程序默认25项为14通过/11显式跳过/0失败。独立Tester及两项P2/视口反馈补验通过，接续Reviewer最终APPROVE；完整设计仍未验收，详见原型对齐记录。

完整角色六步、各页面列表/编辑流程、任务状态筛选/执行前检查/验收布局仍未完成；功能和CI不作为最终设计通过依据。后续查看[原型对齐记录](prototype-alignment.md)，不将当前外壳增量当M0—M4全部封板。
