# macOS通知开发签名对照

2026-10-31，从已验桌面6b35及其a897交接继续，不修改产品源码、协议、依赖、默认发行签名或既有运行数据。固定Agent-Team `73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件`，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。

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
