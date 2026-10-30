# 技能下载错误与固定内核0.13.1

2026-10-30，桌面接入已获Windows独立限定PASS/APPROVE，新错误用例双平台通过，整轮CI因Mac备份密钥存储失败未通过。承接任务看板`e4a64bc`，不把旧技能0a3或看板CI当作本版本结果。

## 确切提交与原生CI

桌面源码`5ff4958942f0740b610ab23bce1dfdb14c3a1ad0`已推送。[CI40874507588](https://github.com/CerrorJ/weftpilot/actions/runs/40874507588) attempt1整轮FAIL：Windows核心189、单元60、装配8，开发及实际包默认74项57通过17明确跳过，真实公共来源1通过2CLI跳过（21.026秒），未签名NSIS装配通过。Mac核心179通过10平台跳过、单元60、装配7通过1平台跳过，开发同为57通过17跳过；实际包56通过1失败17跳过，唯一失败为backup-workflow前置保存合成模型的`CREDENTIAL_STORAGE_UNAVAILABLE`，公共来源整个步骤未运行；ARM64 DMG/ZIP此前已装配。

新增限流/TLS错误用例两平台开发和实际包四处通过。独立CI Tester核官方完整日志、46张新图及五份ZIP官方摘要/字节数/安全解包，Reviewer另读取官方run/jobs/两日志、复算缓存ZIP摘要并查看Mac两张新详情图后，批准上述限定事实；46图全量查看归Tester，非Reviewer重复全量。Mac窄看板截图只含工具栏、部分表单在滚动以下的限制保留，不把未入镜内容说成全面视觉验收。

失败后白名单诊断只观察到appReady=true/appName=weftpilot/encryptionAvailable=false，不能据此确定Keychain因果根因。历史失败继续开放；未跳过加密断言或回退明文，不把本CI写成双平台全绿或发行通过。此docs分支只记录确切5ff证据，不重建已固定内核。

## 两仓固定关联

Agent-Team源码`73b4498966954b64b1d622ba50fb983a3e62ce2f`，版本`0.13.1 / protocol1 / schema12`，正规产物143文件。归档`weftpilot-agent-team-kernel-0.13.1.tgz`，SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。两份GitHub干净检出各自构建并打包一致，独立核逐文件摘要和实际JSON IPC通过；原独立飞书构建及嵌入构建、189项回归通过。

桌面仅更新固定锁、翻译和失败卡片说明，仍由唯一内核下载和持久化。不新增任务状态、下载器或数据库写入，不修改公开命令、协议或schema。旧0.13.0固定归档与摘要不变。

## 实际行为与边界

有限错误码区分限流、访问拒绝、未找到、服务不可用、其他HTTP、DNS、超时、TLS和未知网络失败；界面在卡片及版本详情提供中英解释。仅显示固定代码与安全提示，不显示原始异常、服务正文或底层cause。失败版本没有确认安装入口，失败重启不自动重试。

下载目标、固定提交、公开仓库限制、HTTPS验证、大小/路径/摘要核验保持内核原有保护。分类不能追溯解释此前仅保存泛化码的失败，也不能证明Mac Keychain根因已修。真实公共下载、真实CLI和受控HTTP错误三种证据分别记录。

## 已运行与待验

桌面strict/lint/规模/格式、60单元通过，远程固定装配和新Windows包143文件及内外锁一致。新受控错误开发窗口专项1通过：403且明确额度0、TLS cause由真实内核用例保存，再由实际桌面显示；切换中文浅色/英文深色700px、无原始标记/安装按钮、重启记录不变且0Run/0安装、两次原生退出。首轮因测试期望遗漏已有错误码前缀失败，修正精确断言后通过，未改变产品错误格式。

新Windows实际包完整默认74项57通过17明确跳过0失败0取消，exit0（238057ms）；装配检查8项通过。APP JS `ac07bdf795f3534dfedabddb61560950fa7c098d8f6ecea17d243e5e6fe237e1`，CSS `ab6e2b4f7dd7e52076a74f0855ae523d6737a4d5082990164a476189ff3e4c5d`。测试夹具提取有意义的命令派发函数后，strict拦住误用的未导出类型名；改用正式BusinessCommand后strict/lint/格式/单元60通过，没有改动产品包或放宽规则。

独立Tester实际包限定PASS：config/装配/包内两处锁一致，两套143文件及额外宿主锁精确匹配，实际宿主握手为73b4498/0.13.1/p1/schema12/d9。真实中文浅色1124与英文深色700卡片/详情、无确认安装或原始标记、重启imports逐对象相等、0Run/0技能、全库无标记及quick_check通过；两周期原生菜单退出均exit0/null，登记进程最终缺席。自有驱动首轮缺runtime tsconfig的启动前失败保留，不归为产品故障。

Tester之后独立Reviewer限定APPROVE，无P0—P3：双TS、全lint/规模/格式、九码18个中英固定输出、两套143逐SHA/四锁/归档及桌面资源均核验通过，与已批准内核clean-a产物一致。两类受控GUI由Tester实际验证，Reviewer没有将其扩成其他七码GUI或真实网络覆盖。受控HTTP不作为真实GitHub连通证明；双平台原生CI仍待确切新提交结果，尚不宣布整体M4或发行完成。

## 复现

固定Node24/pnpm12.3.4，`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm build`。专项：

```sh
pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/skill-download-errors.test.ts
```

设置`WEFTPILOT_PACKAGED_EXE`为当前装配的本机可执行文件后运行相同专项或`pnpm test:e2e`。真实公共来源另显式设置`WEFTPILOT_REAL_SKILLS=1`，不可用受控失败替代其成功路径。
