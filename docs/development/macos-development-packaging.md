# Mac本机开发包与返回焦点修复

2026-10-31，从83006e常规CI的两项Mac失败继续。专用通知对照证明有效的应用级ad-hoc签名可令该runner通知failed→shown，但不证明Keychain历史根因已关闭。运行内核保持`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件`，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

## 实际改动

项目列表返回使用useLayoutEffect，在列表完成React提交、卡片已挂载后同步归还确切UUID焦点；不再把一次requestAnimationFrame当成已经完成提交。创建回执复用同一显式焦点目标，轮询不设置目标、不抢选择。原workbench焦点断言不删、不强制测试端focus；布局、品牌、中英文和主题未改。830失败日志没有activeElement明细，因此不宣称已证明其唯一原因。

开发启动在读取userData/建立单实例锁之前，将app名称设为weftpilot-development；未指定TEST_DATA时显式设置appData下同名开发目录，避免路径缓存仍指旧profile。打包应用仍为weftpilot，独立验收安装器仍为weftpilot-validation。显式WEFTPILOT_TEST_DATA继续优先，不移动或复制旧数据/凭据。[固定Electron42实现](https://github.com/electron/electron/blob/v42.0.0/shell/browser/electron_browser_main_parts.cc)在用户主脚本加载后以app名称设置Mac Keychain service/account，因此开发与打包不应仅靠userData隔离。此处隔离应用存储与Mac系统凭据名称，不改变用户已有CLI登录；不把该设计修正直接当作所有Keychain失败的根因证明。

`pnpm package`在macOS为本次新生成的应用目录补齐应用级ad-hoc签名：固定/usr/bin/codesign、不使用证书/私钥/时间戳或公证，保留执行entitlements/flags，strict校验及实际Identifier/Signature检查。签前后整个dist载荷逐文件SHA相同，内核143文件/内外锁再次核验。显式hostLock仅允许与外锁一致的额外宿主锁；安装器的默认严格白名单不放宽。旁侧development-signature.json明确标为development-adhoc，不是Developer ID信任声明。

默认CI新增Mac本机应用目录的实际原生探针，必须真实shown才通过，并保留有限通知/签名元数据。当前改动**不改变正式安装器或发行manifest**，不声称旧DMG/ZIP、用户设备安装、横幅点击、公证或正式发行已通过；这些仍独立验收。

## 当前验证与失败保留

Root严格TS/lint及新增宿主锁边界装配9项通过。首轮单元68P1F，恢复补偿pointer未到期望回滚启动；第二轮68P1F，handshake场景日志阶段仍old_stopped。未改该测试或恢复实现，目标pointer单独1P；仅异常时记录真实fs错误且不改变结果的本机pass-through跟踪69P、未捕捉异常；随后恢复未插桩完整69P。两个原失败日志保留，不能以重跑通过宣布文件系统波动根因已修复。

首Windows包main `fc0a261fc9c02cf77ed778f743d49b1a083b64d91b0bd63578d77c6fa5187d23`完成完整默认79项61通过18明确跳过0失败0取消/exit0，283075ms，归焦原断言和显式TEST_DATA/应用名称检查通过。随后显式设置无TEST开发默认目录，最终main变为`19860127e3bac2fa4b0367a18fe3122152a84e5987869c13070598dca660aa73`；其余三资源未变：preload `968e1aab87abc69341d9c2d142c22ffa6e7f2aa8f269a1c5c23b2e83561a5946`、renderer `7c318601498f0defb8c0cf43e325fb30682e202e3d009ab291337d4706da71a1`、CSS `d496dc067a88f5b0c1d571eac0b24be56ba20f3dca173ca67d7710a2e180659d`。最终包备份/设置/工作台/窗口相关10项7通过3明确CLI跳过/exit0，33539ms；实际开发模式显式TEST_DATA与名称/语言主题/重启单项通过，5856ms。旧完整79只归fc0，不套到1986；真实无TEST默认profile未在用户现有目录上试运行。独立GUI、源码审查及新Mac CI继续，不提前封板。

Root另在明确观察同一Git tree URL由403/remaining0变为200/remaining41后，定向复验原6b35包真实技能3项，3P0F0S/exit0，178514ms；包含真实来源许可/升级/卸载/重启，以及Codex/Claude固定技能资源逐字节交付。此前限流0P3F不删除、不改称CLI已经执行，两个新结果归不同网络条件；这不是本轮Mac修复包或Mac模型运行证明。

独立Tester限定PASS：同名项目按精确UUID返回/Enter、跨轮询不抢焦、双语明暗窄窗口与新任务0Run均由真实agent-browser操作；五张必要图实际查看。最终1986主进程另补身份/TEST_DATA/脏仓库/重启单项1P和安全桥接检查，独立69单元/9装配通过；合成密文重启摘要/解密不变、自己的旧包数据库不变。自有GUI/开发、最终namespace和桥接登记的25/12/6个PID+CreationDate身份均终态缺席，不处理历史未知现场。旧fc0 GUI只复用字节相同的7c renderer结论，不冒认最终main完整79已执行。无TEST真实默认profile与Mac原生部分仍待验；本机ignored报告为validation-independent-tester.md/json。

复现使用Node24.18/pnpm12.3.4，冻结安装后依次运行`pnpm kernel:assemble`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:packaging`、`pnpm build`。`pnpm dev`使用新的开发应用名称/默认profile；打包或测试应使用自己的新输出目录与TEST_DATA。macOS本机运行`pnpm package`后核development-signature.json及实际原生通知，不用编译成功代替运行；正式证书、用户设备和其余外部条件仍按待办处理。
