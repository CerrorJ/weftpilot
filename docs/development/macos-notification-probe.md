# macOS通知开发签名对照

2026-10-31，从已验桌面6b35及其a897交接继续，诊断源码`83006e419fabea9611a263e2b135280fae5bd1c7`已推送，不修改产品源码、协议、依赖、默认发行签名或既有运行数据。固定Agent-Team `73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件`，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

## 问题与实验边界

6b35的双平台CI成功，但原始官方通知JSON为Windows test.shown、macOS test.failed，后者未解决。[固定Electron42官方通知说明](https://github.com/electron/electron/blob/v42.0.0/docs/api/notification.md)要求macOS应用签名；当前未签名材料不满足前置条件。尚无签名对照，不能指定唯一根因。

新增专用分支CI，复制原.app到自有RUNNER_TEMP，同一路径先测未签名回执，再用`codesign --sign -`对临时副本作无证书ad-hoc开发签名。禁用证书自动发现；不使用签名凭据、用户Keychain身份、正式发布服务或其他已安装应用。保留嵌套Electron的entitlements与flags，重新生成适合本地开发身份的requirements，不继承原证书要求。`--deep`仅为此有界开发实验，不作为正式发行签名方案。

签前记录实际codesign身份和deep/strict结果，因为原始材料可能带有Electron上游或局部签名，不能用模式标签代替检查。job显式使用bash及pipefail，避免codesign失败被后续输出脱敏管道掩盖。签后执行deep/strict硬校验，并比较dist全部文件的签名前后SHA清单；应用代码与内核内容变化就拒绝继续。两次探针均创建自己的空业务fixture，仅通过原命名桥接调用固定测试通知，等待实际系统回执，正常退出并清理自有数据。baseline仅采集真实结果；签名副本必须返回shown，否则断言失败，不把requested/failed改为成功。失败时仍上传有限JSON、签名身份与摘要清单。

该实验不改变默认安装器；即使ad-hoc得到shown，也只证明该runner的开发签名对照，不等于Developer ID签名、公证、用户授权、横幅/点击或发行验收。

## 复现与当前状态

Node24.18/pnpm12.3.4，冻结安装、`pnpm kernel:assemble`、`pnpm typecheck`、`pnpm lint`及格式检查。Windows可显式设置`WEFTPILOT_PACKAGED_EXE`为已验6b35包、`WEFTPILOT_PROBE_MODE=unsigned`、`WEFTPILOT_PROBE_REQUIRE_SHOWN=1`，运行：

```sh
pnpm exec tsx --tsconfig tsconfig.runtime.json tests/native/notification-platform-probe.ts
```

中断前Root与独立Tester的Windows真实API探针均shown/正常退出；独立Tester登记进程身份终态缺席，业务对象全0且前后相同。2026-10-31补充锁字段运行时校验，并将开发签名改为只保留entitlements/flags，Root定向TS/lint/格式及真实Winshown复验通过。新版独立Tester再次限定PASS：实际test.shown/正常退出，七个登记PID/CreationDate身份终态缺席，空业务前后相同，四资源/四锁/143文件再核通过；发现的shell管道退出码问题已修并静态补核。随后独立Reviewer限定APPROVE，无未解决P级问题，另跑严格检查/格式、核源码与包/测试原始证据；承接六文档与a897一致。可提交新macOS CI。Mac unsigned/ad-hoc尚未执行，不提前声称成功；原Mac failed记录保留，待新确切提交的实际结果决定后续。

同日Root另用未改6b35实际Windows包运行真实Codex/Claude人工处理专项2/2通过，0失败/0跳过/exit0（143588ms）：等待态重启、明确回答、同Run续接、原角色快照不变、真实answer.txt逐内容核对和单独人工验收均通过，四次应用启动均原生菜单正常退出。只补此当前版本链路，不以此宣布全部审批类型/飞书成功或旧不确定现场已恢复；这不是Mac签名对照结果。

## 原生对照实际结论

[专用CI41184747174](https://github.com/CerrorJ/weftpilot/actions/runs/41184747174) attempt1 exact83006e SUCCESS，job124489272917。baseline阶段名unsigned仅表示未进行本次应用级重签，原始检查实际为Identifier=Electron、Signature=adhoc/linker-signed、Info.plist未绑定、无Sealed Resources，strict退出1。不能将它描述为完全没有任何签名。重签后Identifier=io.weftpilot.desktop、有效adhoc、Info.plist 30条与Sealed Resources version2/167文件、TeamIdentifier未设置，strict验证通过；实际原生回执failed→shown。

同一路径的157份dist载荷摘要清单前后逐字节相同，143锁定内核与四份桌面JS/CSS资源摘要一致，业务对象全0；代码内容未被重签替换。此结果验证该runner的开发重签对照有效，不能推出只有正式证书才能通知、签名是所有环境的唯一原因、已经完成默认包修复或用户横幅/点击验收。Mac对照未开启逐PID身份登记，仅按原正常退出守卫和两个探针步骤完成记录退出，不冒认逐PID证据。

独立Tester和Reviewer核官方run/head/jobs/logs，官方artifact13036012198为17408字节、SHA-256 `804965fa363cb98477c8046905a880540a68c765e308d978748e30560962550b`，一ZIP/七白名单文件，CRC、上限、全部payload/签名记录及两份JSON通过。原始官方日志58108字节、SHA-256 `258d1d598e8352eeef0fbb28e881ed305b3f1e4e114d78416cf3ef2e27e8ece5`，独立连接器正文与Root只读下载逐字节相符。下载使用正常Git身份仅内存官方只读API，跨域去Authorization，不保存凭据或签名URL；没有用下载分工替代独立核验。专用对照限定PASS/APPROVE。

## 常规CI失败与其余验证

[常规Desktop41184747138](https://github.com/CerrorJ/weftpilot/actions/runs/41184747138) attempt1 exact83006e整轮FAIL，不能继承6b35绿色或专用对照SUCCESS。Windows成功；Mac开发默认79项61通过18跳过，实际包59通过2失败18跳过：备份保存合成密钥时CREDENTIAL_STORAGE_UNAVAILABLE，及工作台返回项目后焦点即时断言false。后者日志无实际activeElement明细，不能凭日志猜测唯一原因。Mac真实公共技能来源因前步失败未执行。

当前源码返回列表使用requestAnimationFrame归焦，而测试立即检查activeElement；后续将核对挂载与焦点时序，不能通过删除断言、强制测试聚焦或重跑换绿解决。Keychain失败后的有限元数据为appReady=true、name=weftpilot、ARM64、encryptionAvailable=false，不等同根因；签名对照空fixture未保存模型或调用safeStorage，不能据此宣称Keychain已修复。

常规轮的独立Tester/Reviewer已批准失败事实的归属，**应用验收仍不通过**。七官方ZIP全部按官方大小/摘要、CRC、路径与上限核验，58张PNG全核尺寸/摘要，Tester实际看八张设置代表图、Reviewer另看两张，不冒称58图全看。Mac缺的两张技能安装/恢复图来自未执行的公共来源步骤，不补造；原生JSON仍Win shown/Mac failed。Mac原始日志128077字节与连接器原字节一致；Win下载原179020字节与工具177224字节仅在CRLF正规化后相同，不冒认原字节一致。后续新版本成功也不能改写此FAIL。

Root另跑真实技能来源/两CLI资源专项3项，全部在下载预览前置返回SKILL_DOWNLOAD_RATE_LIMITED，0通过3失败0跳过/exit1，10179ms；两个CLI场景均0Run/0安装，模型未执行，不将标题当作CLI失败。相同固定Git tree URL实际403、remaining=0、reset=2026-10-31T08:49:22Z。不同rate_limit端点显示60不推翻该精确响应，未注入Git凭据或关闭校验绕过；原失败日志保留，条件变化后再定向复验。下一步修复Mac本机包身份绑定、核对项目归焦，正式签名、用户设备及真实飞书/自定义模型仍独立待办。
