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
