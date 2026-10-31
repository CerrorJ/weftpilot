# 技能下载失败的手动恢复

2026-10-31，从桌面8f0a4c1交接继续。前一e9f Mac公共来源返回SKILL_DOWNLOAD_RATE_LIMITED的失败仍保留，本增量不把它认定为已复原。内核继续锁定`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件`，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

## 实际行为

原技能详情只显示下载失败，重新发起需回到来源表单。现为纯下载失败增加“按此来源版本重新下载”：仅兼容旧下载失败码、网络/超时/DNS/TLS/限流/服务不可用且没有package的failed记录显示入口。来源、摘要、路径及内容校验问题不提供直接重下，已有预览/安装状态也不显示该入口。

用户点击后复用原Agent-Team的skill.import用例，按失败记录固定的source id/version、目录和许可证路径创建新UUID；不改写旧失败、不自动改用同名来源最新版本、不自动安装或继承许可同意。UI同步Ref阻止提交中及回执完成到React重绘间的重复操作；结果不明仍由既有useSubmission复用幂等键。回执显示创建事实，只有权威快照包含新ID时才启用“查看新下载记录”。UI仅持有回执/选择，不持有另一套下载状态。

未改CSS、品牌、窗口或业务协议；中文与英文复用既有详情布局。SkillPage把选中详情/关闭归焦收在SelectedSkillDetail，恢复组件的异步提交与展示分责，均满足现有规模检查。数据、下载、SHA校验、安装事务和权限仍由唯一内核维护，无需重打内核或修改运行版本。

## 本机验证与保留失败

首轮0P1F1跳过：切英文后测试助手仍定位中文“查看详情”，原skill-recovery-default.log保留。助手改成双语精确正则，未删除产品断言；随后第一实际包2P0F0S/exit0，10087ms。再补同步回执Ref、重建最终包后同两项2P0F0S/exit0，9796ms；原包结果不反套最终renderer。最后来源响应是该本机条件下的真实公共HTTP结果，不替代旧Mac runner的失败。

初始429与截断tree由独立fixture通过真实createKernel应用用例和受控fetch生成，无直接SQL；它们不是实际GitHub限流证明。fixture内核先关闭，打包应用的新worker随后执行真实公共GitHub请求，校验固定提交的文件与许可证摘要。实际双击只增一条新导入、固定旧v1而非已有v2、原失败和来源数组不变、无同意点击安装不写skills、显式勾选后安装、正常重启保留，0Run。

严格TS/lint/格式、71单元、9装配通过；技能目录/历史焦点/错误/恢复四文件专项5项4通过1真实网络跳过，18135ms。最终Ref仅影响UI提交边界，最终包又定向完成上述2项；不宣称当前本机已跑完整82默认项。独立Tester/Reviewer与新确切提交的Mac/Win CI继续，不提前封板。

最终实际包main `19860127e3bac2fa4b0367a18fe3122152a84e5987869c13070598dca660aa73`、preload `968e1aab87abc69341d9c2d142c22ffa6e7f2aa8f269a1c5c23b2e83561a5946`、CSS `d496dc067a88f5b0c1d571eac0b24be56ba20f3dca173ca67d7710a2e180659d`未变；renderer `9995d6ebfae666a1075ff8bf4c47700d7fc1916c2f804277de1c2e939c38bc50`。来源按自己装配的143锁校验，Win开发包使用已核官方Electron42归档，不依赖相邻未提交内核源码。

## 复现与限制

Node24.18/pnpm12.3.4，冻结安装后`pnpm kernel:assemble`、`pnpm build`；使用自己的全新实际包及测试目录，通过WEFTPILOT_PACKAGED_EXE指定。默认`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/skill-import-recovery.test.ts`只跑受控失败的无网络浏览；显式WEFTPILOT_REAL_SKILLS=1才执行真实公共下载/许可安装/重启。无模型、飞书或真实凭据调用。public CI保留该实际成功断言，不吞网络失败换绿。

本增量不关闭e9f Mac来源失败、02f通知波动、历史Keychain/Windows未知现场或全部M0—M4验收，不扩为Mac用户设备、正式签名、公证、安装升级及发行通过。

## 独立验收

Tester最终限定PASS，14项检查。早期13f78 renderer包只做受控失败的只读浏览，三图已查看；最终9995包用全新fixture实际agent-browser双击，原两条failed与三份source各阶段全文不变、新UUID固定v1，真实worker公共下载后仍0skills/0Run。未同意安装触发原生required且完整快照深等，明确核对说明与MIT后勾选才安装；三个落盘文件字节/SHA与清单相同，重启完整WorkspaceSnapshot深等。最终包/当前dist四资源、五产品源SHA、143内核与锁一致。

三个自有应用周期均正常MenuQuit/exit0/signalnull/kernel.stopped，登记PID+CreationDate终态无存活，命名会话与自有fixture清理完成。共八图实际看七张，不声称全看；受控初始失败、最终真实网络和旧包浏览分开归属。未做所有七错误类或未知IPC/回执绘制微时序的故障注入，不用双击用例替代所有通信恢复证明。随后独立Reviewer核产品源/实际包/143锁及各阶段完整快照，严格TS/lint/格式检查通过，限定APPROVE；最终默认显式light补验1P1真实跳过/exit0，4438ms。新确切提交CI仍待执行。

## ded64确切原生CI

上述“CI待执行”为源码提交前时点。[Desktop41200634442](https://github.com/CerrorJ/weftpilot/actions/runs/41200634442) attempt1、head `ded64b677604ee4f2b30520b286c71c66455b874`，最终整轮SUCCESS；Mac job124535565306与Win job124535565537均成功。两平台严格TS/lint/格式、71单元通过；固定内核Win189P，Mac179P10平台跳过；装配Win9P、Mac8P1平台跳过。

两平台开发态及实际包各82项，**63P19明确跳过0F0取消**；新增默认恢复浏览成功。公共技能各5项**3P2真实CLI跳过0F0取消**：原真实来源闭环及新恢复的默认/真实场景均按原断言成功。CI不调用模型；不能把2CLI跳过计入真实执行通过。Mac首通知probe实际shown，末尾gate按原始NATIVE_NOTIFICATION_OUTCOME success通过；不是仅读取continue-on-error后的step conclusion。

Root经官方API读取并保存原始完整日志：Mac134124字节/SHA-256 `348f20285b4ccbb5552e76a6d27e121844138881ce430c07750a983210247b97`；Win184096字节/SHA-256 `30d3d26ed1656d9b79ad72e5daf94b10c1f5f9643549df5d8acf458fe6a42bc5`。官方二进制下载仅使用正常Git身份、跨域不转发Authorization，不保存凭据或临时签名URL。独立Tester以连接器另取元数据/日志并规范化对齐原字节文件，归档与新图核验继续，不提前称完整CI补审通过。

六份官方ZIP已下载并按官方大小/SHA核验。独立审计实际70PNG：每平台主图31、剪贴板4，不能沿用旧e9f的63张。Mac本轮strict后签名sidecar声明157文件aggregate `da4fc07f497a94d3ba2ffceccafc21140ae01048ac2a5312d82b71ba06fcf329`；renderer变更，不继承旧aggregate。独立核验有限sidecar的字段及本轮归属，没有从未上传的157份完整应用文件重新构造aggregate。首probe及两平台默认native JSON均shown，post-launch有限诊断仅created49ms/scheduled73ms，无授权行或失败事件，不能据此定位旧波动。

独立Tester实际查看八张代表图（两平台各三张恢复及一张英文工作台），Root另看两张CI安装图。Win名为real-installed的截图仍显示“正在安装并核对”，不能单凭文件名当作最终安装画面；通过的用例另有权威installed快照及重启断言。Mac同名图可见“可用于新执行”。没有因截图异步渲染差异放宽业务断言、修改ded64源码或宣称新根因已定；最终独立补审仍单独记录。

本轮成功不抹除e9f公共来源失败、02f通知失败或历史Keychain/未知Windows现场。macOS是runner实际运行开发及打包应用，不等于用户设备安装/升级、真实CLI、系统横幅点击或正式签名发行。另见[Root真实方案/操作续接补验](approval-continuation-validation.md)，该Windows模型证据与CI跳过分开归属。

最终独立Tester结论为PASS_EXACT_DED_CI_LIMITED_SCOPE，随后Reviewer另取官方元数据/全文日志，重核六ZIP、70PNG元数据、四有限JSON及原始通知gate，实际另看四张Mac/Win英文恢复及安装图，结论APPROVE_VERIFIED_CI_LIMITED_SCOPE，无必须修正项。Root审批补测的只读审计也通过，不改其执行归属或trim边界。前文“补审继续”是报告落盘前时点，不再表示此确切CI未核。

下一步优先继续审批失效/拒绝与需求、团队等非空状态的独立验收；真实飞书、自定义模型成功调用及用户设备发行条件继续分别记录，不用本增量封板M0—M4。

两仓关联：桌面功能`feat/skill-import-recovery/ded64b677604ee4f2b30520b286c71c66455b874`；Agent-Team交接`docs/skill-import-recovery/e5ad07882462fef073285a97751c481215611a61`已推送，后者只记录确切CI及Root审批证据，不改变固定运行提交73、协议、schema或产物。当前桌面交接位于`docs/skill-recovery-validation`，两仓分别提交，不自动合并或发布。
