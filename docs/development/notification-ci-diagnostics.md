# Mac通知波动诊断与CI失败保留

2026-10-31，继续02f614f的原生检查，只补测试侧诊断和CI控制，不改运行产品、权限、内核或系统配置。运行内核仍`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件 / d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

## 本轮确切失败

前一78449的常规CI已经独立限定通过，Mac开发应用目录strict及两份test.shown；它不能代替新[02f614f/41191641941](https://github.com/CerrorJ/weftpilot/actions/runs/41191641941) attempt1。新Mac job124509460313在内核179P10平台跳过、单元69P、装配8P1平台跳过及应用级ad-hoc/strict通过之后，原生probe实际test.failed，NATIVE_NOTIFICATION_NOT_SHOWN令步骤exit1。后续开发/打包80项与技能来源未运行，Mac没有新GUI图片，不能继承旧图或数字。Win job124509460549最终成功，各开发/实际80项62P18S，整轮仍FAIL；四ZIP/32Win PNG/两JSON经独立Tester与Reviewer核验，限定APPROVE_VERIFIED_FAILURE_ONLY，不是应用Mac通过。

Root官方Mac日志98730字节，SHA-256 `2b471ef2f3db50db362b99c67eba21824c77122b2b58bc2b1824dc85c266871f`；唯一官方artifact13039540354为579字节，SHA-256 `d40627066c4a7fa3aab94887f67d2d3335e15fb761f940152ac4db0cd46d4904`。独立Tester另核官方大小/摘要/CRC/安全成员与有限JSON：确切02f/73/d9、packaged/supported/watching、test.failed，七类业务计数全0。它没有签名sidecar，因为旧step在断言失败后才复制；不能沿用784的157项aggregate来补造本轮材料。

本轮产品main1986与784字节相同，仅renderer及测试策略改变；这是来源事实，不足以指定为runner、权限或授权时序的唯一根因。旧Mac Keychain、本机两个恢复单元故障和并行80项两取消继续保留。

## 有限诊断与硬失败

新增测试侧observer只在自有空fixture probe显式启用，使用固定Electron42的ELECTRON_DEBUG_NOTIFICATIONS与ELECTRON_ENABLE_LOGGING。识别授权bool、创建/调度、授权/调度错误，最多20项、输入行4096上限；错误只存有限分类与SHA指纹，不保存原错误、UUID、路径、正文或凭据，不替换Notification/OS API。采集范围明确为post-launch-stderr，启动初期授权行可能已发生，不宣称完整历史；缺少行也不推断授权成功。

固定[Electron42 presenter](https://github.com/electron/electron/blob/v42.0.0/shell/browser/notifications/mac/notification_presenter_mac.mm)异步请求授权，[Cocoa实现](https://github.com/electron/electron/blob/v42.0.0/shell/browser/notifications/mac/cocoa_notification.mm)另向系统排通知；授权/调度时序只是据源码提出的候选，当前失败JSON没有原因或时序，不能定根因。开关由[固定notification.cc](https://github.com/electron/electron/blob/v42.0.0/shell/browser/notifications/notification.cc)读取环境变量启用。

签名sidecar复制移到probe之前，探针失败也保留本轮严格校验旁证。单项continue-on-error只让后续独立UI检查继续，末尾按原始steps.native-notification.outcome硬gate，只有success可通过；failure/skipped/空结果仍让job失败，取消也不变成功。[官方上下文](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#steps-context)区分outcome与continue之后的conclusion；不用conclusion把失败变绿。原must-shown断言、不模拟成功、业务退出守卫和UI时限均保持。

## 当前验证与复现

Root严格TS/lint、两新增诊断parser隐私/长度单测及完整71单元通过；Windows真实原生probe shown、业务全0前后不变、原生MenuQuit完整退出0。诊断观察列表为空，表示该平台没有观察到固定Mac行，不填造授权事件；这不是Mac成功。独立Tester另用自己的空fixture跑probe、真实agent-browser设置页点击测试，均shown、业务前后深等、正常退出0；合成日志25条截20与隐私检查仅算parser边界，不能当OS结果。原YAML末gate实际shell验证success→0，failure/skipped/cancelled/空→1。正式Tester限定PASS后，独立Reviewer核四源/七文件、退出顺序、硬gate、143内核与四运行资源，自己严格TS/lint/格式及两单测通过，限定APPROVE。新确切提交的Mac实际采集和完整CI仍待验，不宣称已修复波动根因。

在自己的全新实际包与数据目录，显式设置WEFTPILOT_PACKAGED_EXE、WEFTPILOT_PROBE_MODE=adhoc（本机Mac开发应用目录）、WEFTPILOT_PROBE_REQUIRE_SHOWN=1，再设WEFTPILOT_NOTIFICATION_DIAGNOSTICS=1、ELECTRON_DEBUG_NOTIFICATIONS=1、ELECTRON_ENABLE_LOGGING=1，运行`pnpm exec tsx --tsconfig tsconfig.runtime.json tests/native/notification-platform-probe.ts`。有限JSON留在ignored .tmp/evidence，失败保持非0，不自动再发通知换绿，不更改用户系统权限。Windows测试标签unsigned不声称正式签名或Mac验收。

## e9f确切原生结果

源码`e9f042722432df4887c74670070b6312a5ba929a`的[Desktop41192789086](https://github.com/CerrorJ/weftpilot/actions/runs/41192789086) attempt1整轮仍**FAIL**：Win job124512818274成功；Mac job124512818099仅在公共技能来源返回SKILL_DOWNLOAD_RATE_LIMITED，3项0P1F2真实CLI跳过。不是通知失败，也不能把限流忽略后称整轮绿色。Win公共来源3项1P2CLI跳过，不能替代Mac失败；实际网络限流原因未独立定位，不注入Git凭据或盲目重跑换绿。

两平台严格TS/lint/格式、单元71P、应用目录与验证安装器装配通过；Win核心189P/装配9P，Mac核心179P10平台跳过/装配8P1平台跳过。开发及实际包均80项62P18明确跳过、0失败0取消。Mac首次probe和默认设置最后均test.shown，末gate使用原始outcome=success并通过；Win默认同样shown。Mac没有额外PID日志，仅按原MenuQuit/实际child exit0守卫记录，不编造逐PID证明；Win80组生命周期对应launcher exit0/null。

本轮诊断只有created@59ms、scheduled@76ms，未采到授权行或失败；不推断授权事件、历史失败原因已经确认或波动已经修复。sidecar为development-adhoc/io.weftpilot.desktop/strictVerified/payloadUnchanged，157项aggregate `18d39133f5faf8482e65f1f2b8f6851ea7454da8c6fb36c5464bc2ad6897562a`，仍73/d9；不能用784的旧1081值，也不能从只有聚合值的ZIP重算整个.app。正式installer/manifest、用户设备横幅/点击、旧密文兼容与根因仍独立待验。

独立Tester核完整官方来源/日志、六ZIP大小/SHA/CRC/安全成员、四有限JSON和实际63 PNG：Win28主图+4剪贴板，Mac27主图+4剪贴板；Mac来源失败少两张installed/restored图，另有一张source-failure图，不套64或62。Tester实际看九张必要图。通知图采集时为requested、后续JSON才shown；来源failure图仍在下载中，没有可见限流文案，错误依据日志/实际断言与快照，不凭文件名编造画面。原始Mac日志135375字节/SHA `f232239736dc29a90f057c7409ece2a3705a0fff072e6df8e63e05070fbac1ff`，Win180954字节/SHA `eb6ebfa4e285ad01faed1d55f7ada142409a617b7daa21bbffb0300c3f288b04`。随后独立Reviewer另取官方来源及全文、核六ZIP/63图元数据/四JSON并实看两张Mac图，限定APPROVE_VERIFIED_PARTIAL_CI_ONLY；不将完整性审计通过当整轮CI通过。

内核仓最终关联交接`68600045dc30e1837065f050965b80e712e346f6`已推送，仅更新文档；运行产物仍73/0.13.1/p1/schema12/143/d9。桌面本结果分支只记录02f失败及e9f本轮受限结论，不修改或自动合并源码，不公开发布。
