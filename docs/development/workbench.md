# 工作台真实快照与窗口菜单

2026-10-30，`feat/workbench-overview`承接桌面5ff及其CI事实文档，限定功能与原生CI验收通过。固定内核`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12`，143正规文件，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。不改内核、协议或业务数据表。

## 确切提交及CI最终结论

桌面`ab82b4aa483f8d779deb382225019fd0b9de1c23`已推送，[CI40986263270](https://github.com/CerrorJ/weftpilot/actions/runs/40986263270) attempt1双平台SUCCESS。Win核心189/单元61/装配8，Mac核心179通过10平台跳过/单元61/装配7通过1平台跳过；两平台开发和实际包默认76项各59通过17明确跳过0失败0取消，实际公共来源专项各1通过2CLI跳过（Win7.575秒/Mac11.410秒）；未签名NSIS与ARM64 DMG/ZIP装配通过。新增两个工作台用例四种原生模式均通过，Win额外菜单栏/Alt检查与两平台真实复制粘贴断言均保留。

独立CI Tester核官方run/jobs/两个完整日志、四ZIP官方大小/SHA/CRC/安全解包/PNG摘要并逐张查看52张新图；Reviewer另取官方记录及日志、复算四缓存ZIP、查看Win中文工作台和Mac英文700两图后批准限定事实。全量52图查看归Tester。工作台长图完整覆盖概览/待处理/近期/项目，其他页仍有截图内部滚动/菜单遮挡及Mac窄看板未入镜卡片的限制，不扩大为全部视觉内容已核。

本轮Mac备份开发/实际包真实通过且没有凭据失败artifact；仅未复现，不能关闭5ff/e4/f3等历史Keychain根因。真实CLI、飞书/自定义模型、用户安装升级/签名及发行仍单独待验。当前docs分支只汇总确切ab82证据，不重打内核、不合并或公开发布；下文“待CI”为提交前时点。

## 实际功能

按固定`product-design/c29c2f5`接回绿色空间概览、独立待我处理与近期工作、我的项目卡片。数据来自内核项目/最新角色/共享执行任务筛选；未知显示横线，不编造活动时间、CLI步骤和百分比。项目卡片复用默认团队、仓库/分支和已验收任务数/总数。

待处理复用待决定/待验收/进程未知筛选，补充最大attempt的失败/中断；已验收、试运行排除，旧失败不污染新Run。首页和侧栏共用此只读投影。近期工作显示最近创建的至多八条业务Task，不把创建顺序当最近CLI事件。点击使用原Task详情/审批/交付用例，不在首页决定或自动验收。

项目入口携带确切UUID/显式visit，同名项目不串选，轮询不抢当前选择；复用项目详情、返回卡片焦点和项目任务入口。全部项目/全局项目导航显式回列表。首页发起任务复用原弹窗和项目/角色绑定，确切回执打开原Task，不自动创建Run。

用户随后要求去掉“纬舟 / 编辑”窗口菜单。Windows/Linux初始隐藏并在语言/主题设置共享菜单后移除窗口菜单，Alt不会显示；macOS屏幕系统菜单保留平台习惯。托盘打开/完全退出共用原停止确认，全局菜单对象保留共享退出动作。关闭窗口仍隐藏继续，未绕过停止守卫。

## 验证和过程

strict/lint/函数及文件规模/格式、61单元、8装配通过。新增投影单元覆盖待决定/验收/unknown/最大attempt/旧失败/试运行/空态/输入不变。

初包APP `048d8ab58ba1ad8653a9c773cdf84558a491c4a71d040895976b21f06bcb12b0`、CSS `47534b7be9a29507b990f10f2aa1c0c9a81bf08e365a7d8d7d6e7562e60b9e6b`两新专项通过。一次宽浅/窄深批量实看发现标题按钮未靠右、指标继承多余dl下划线、侧栏漏计待验收，已同批修正。初包整轮76项58通过1失败17跳过，唯一侧栏0而期望1；该断言在旧整轮进行中补入，结果只能归旧包缺陷，不算修复包回归。原日志与图保留。

修后APP `4db81885219fa5a63c80586d825704bfde74f225624b9f9e46128c598ded53e6`、CSS `823759fdf20399772caed29fd5ff3bd6e90f985246b63348af71e6de37907eed`，新两专项通过。菜单调整后renderer不变，最终main `c97d9cb73ccff656f5ed4f120e352ba2a221e9ed55f840bb2655d05f4d74f6b8`、preload `b11ac05a7f856b6ed51bd380dfedc5e37d4ef9ad7c8fcd7a03534eda5f3a0a0a`；官方Electron42归档SHA装配、143文件和内外锁核验通过。最终包两新专项2/2通过，含初始/Alt/切英文深色的原生bar隐藏、真实Ctrl/Cmd+A/C/V读回和自然退出。

真实UI创建项目/角色/任务场景保持0Run；待验收正例由既有prepareDeliveryFixture经内核用例及受控executor生成，只证明展示、试运行排除、旧Task/Run/交付只读/重启，不证明真实CLI或停止树。

独立Tester限定PASS，核20项runtime/test/CI源码SHA、三套143+额外宿主锁及六处锁、最终四资源摘要，原Task/Run/交付/角色/项目逐对象与重启不变、两库quick_check通过。实际UI同名项目UUID/轮询不抢选/返回焦点/全部项目重置、首页显式选择第二项目创建任务及0Run、待验收1/侧栏1/近期排除trial、中浅1124/英深700/键盘/无横溢出通过。独立查看五张新图；完整76仅归root运行，未继承为Tester结果。

最终菜单包独立核原生isMenuBarVisible在初始/Alt/语言主题后均false，实际CtrlA/C/V读回、Esc取消无新任务；真实window.close隐藏后命名snapshot/diagnostics仍可用，show恢复后正常退出。旧包1、renderer修复包4、最终菜单包2共七周期严格MenuQuit→exit0/null，全部原登记PID/CreationDate身份缺席；PID被新创建时间进程复用分别记录，未强杀。没有点击系统托盘、没有实测unknown展示、CLI/Mac/真实飞书或模型，不扩大结论。

root最终菜单包完整默认76项59通过17明确跳过0失败0取消、exit0（244145ms），原失败日志不删除。Tester之后独立Reviewer核双TS/全lint规模/格式/投影测试、20受测源码SHA、三套143/六锁/归档d9、最终四资源/五图摘要及两张实际图后限定APPROVE，无P0—P3；没有冒认重跑root整轮或Mac/CLI。待确切提交的新原生CI，不继承其他提交绿色。

## 复现与剩余

固定Node24/pnpm12.3.4，依次运行`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`、`pnpm build`。设置当前本机包`WEFTPILOT_PACKAGED_EXE`后运行：

```sh
pnpm exec tsx --tsconfig tsconfig.runtime.json --test --test-concurrency=1 tests/e2e/workbench.test.ts
pnpm test:e2e
```

新提交须跑原生CI，不继承5ff或0a3。下一项设置逐角色连接总览和实际通知；真实飞书/模型、Mac Keychain和用户设备安装升级、旧Windows故障、签名许可/更新渠道仍各自待验，M0—M4与整体原型未封板。
