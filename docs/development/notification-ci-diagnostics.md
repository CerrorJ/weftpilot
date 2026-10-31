# Mac通知波动诊断与CI失败保留

2026-10-31，继续02f614f的原生检查，只补测试侧诊断和CI控制，不改运行产品、权限、内核或系统配置。运行内核仍`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件 / d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

## 本轮确切失败

前一78449的常规CI已经独立限定通过，Mac开发应用目录strict及两份test.shown；它不能代替新[02f614f/41191641941](https://github.com/CerrorJ/weftpilot/actions/runs/41191641941) attempt1。新Mac job124509460313在内核179P10平台跳过、单元69P、装配8P1平台跳过及应用级ad-hoc/strict通过之后，原生probe实际test.failed，NATIVE_NOTIFICATION_NOT_SHOWN令步骤exit1。后续开发/打包80项与技能来源未运行，Mac没有新GUI图片，不能继承旧图或数字。Win job124509460549另按实际终态记录。

Root官方Mac日志98730字节，SHA-256 `2b471ef2f3db50db362b99c67eba21824c77122b2b58bc2b1824dc85c266871f`；唯一官方artifact13039540354为579字节，SHA-256 `d40627066c4a7fa3aab94887f67d2d3335e15fb761f940152ac4db0cd46d4904`。独立Tester另核官方大小/摘要/CRC/安全成员与有限JSON：确切02f/73/d9、packaged/supported/watching、test.failed，七类业务计数全0。它没有签名sidecar，因为旧step在断言失败后才复制；不能沿用784的157项aggregate来补造本轮材料。

本轮产品main1986与784字节相同，仅renderer及测试策略改变；这是来源事实，不足以指定为runner、权限或授权时序的唯一根因。旧Mac Keychain、本机两个恢复单元故障和并行80项两取消继续保留。

## 有限诊断与硬失败

新增测试侧observer只在自有空fixture probe显式启用，使用固定Electron42的ELECTRON_DEBUG_NOTIFICATIONS与ELECTRON_ENABLE_LOGGING。识别授权bool、创建/调度、授权/调度错误，最多20项、输入行4096上限；错误只存有限分类与SHA指纹，不保存原错误、UUID、路径、正文或凭据，不替换Notification/OS API。采集范围明确为post-launch-stderr，启动初期授权行可能已发生，不宣称完整历史；缺少行也不推断授权成功。

固定[Electron42 presenter](https://github.com/electron/electron/blob/v42.0.0/shell/browser/notifications/mac/notification_presenter_mac.mm)异步请求授权，[Cocoa实现](https://github.com/electron/electron/blob/v42.0.0/shell/browser/notifications/mac/cocoa_notification.mm)另向系统排通知；授权/调度时序只是据源码提出的候选，当前失败JSON没有原因或时序，不能定根因。开关由[固定notification.cc](https://github.com/electron/electron/blob/v42.0.0/shell/browser/notifications/notification.cc)读取环境变量启用。

签名sidecar复制移到probe之前，探针失败也保留本轮严格校验旁证。单项continue-on-error只让后续独立UI检查继续，末尾按原始steps.native-notification.outcome硬gate，只有success可通过；failure/skipped/空结果仍让job失败，取消也不变成功。[官方上下文](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#steps-context)区分outcome与continue之后的conclusion；不用conclusion把失败变绿。原must-shown断言、不模拟成功、业务退出守卫和UI时限均保持。

## 当前验证与复现

Root严格TS/lint、两新增诊断parser隐私/长度单测及完整71单元通过；Windows真实原生probe shown、业务全0前后不变、原生MenuQuit完整退出0。诊断观察列表为空，表示该平台没有观察到固定Mac行，不填造授权事件；这不是Mac成功。独立Tester另用自己的空fixture跑probe、真实agent-browser设置页点击测试，均shown、业务前后深等、正常退出0；合成日志25条截20与隐私检查仅算parser边界，不能当OS结果。原YAML末gate实际shell验证success→0，failure/skipped/cancelled/空→1。正式Tester限定PASS后，独立Reviewer核四源/七文件、退出顺序、硬gate、143内核与四运行资源，自己严格TS/lint/格式及两单测通过，限定APPROVE。新确切提交的Mac实际采集和完整CI仍待验，不宣称已修复波动根因。

在自己的全新实际包与数据目录，显式设置WEFTPILOT_PACKAGED_EXE、WEFTPILOT_PROBE_MODE=adhoc（本机Mac开发应用目录）、WEFTPILOT_PROBE_REQUIRE_SHOWN=1，再设WEFTPILOT_NOTIFICATION_DIAGNOSTICS=1、ELECTRON_DEBUG_NOTIFICATIONS=1、ELECTRON_ENABLE_LOGGING=1，运行`pnpm exec tsx --tsconfig tsconfig.runtime.json tests/native/notification-platform-probe.ts`。有限JSON留在ignored .tmp/evidence，失败保持非0，不自动再发通知换绿，不更改用户系统权限。Windows测试标签unsigned不声称正式签名或Mac验收。
