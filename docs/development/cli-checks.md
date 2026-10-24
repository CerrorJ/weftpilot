# CLI分项检查接入（开发中）

提交后核对：桌面`fa30eb8f43514b80eb289acd30d7a20d895469ed`关联内核080/`3b1c8b65fb93cb20e14a2b290f485ae91fecd3a2`。[CI 40102151584](https://github.com/CerrorJ/weftpilot/actions/runs/40102151584)Windows/macOS全部通过，各36单元/6装配，开发及实际包46项31通过15跳过，NSIS与ARM64未签名DMG/ZIP装配成功。本次Keychain未复现，但隔离分支b2d的Mac失败仍保留，不宣称根因修复、正式旧密文升级、真实Mac CLI或用户设备验收完成。本文后续尚无CI是提交前时点记录，当前角色入口未提交改动不继承本CI。

从角色卡片提交`2cb75c12326ba740b50d943372e2b3c38500b487`继续，内核先独立Tester/Reviewer通过、提交推送`3b1c8b65fb93cb20e14a2b290f485ae91fecd3a2`，版本0.8.0/p1/schema8。来自干净内核开发检出及桌面独立固定检出，两次重建126文件和tar摘要一致；SHA-256为`12aa27705a8c114ceda7cd4e346711ce537c73fa6d50a3275ec64aec438b6d61`。桌面未使用相邻未提交源码。

新增命名IPC和严格输入，角色六步CLI页分别读取版本、检查CLI默认环境的登录状态。检查结果不保存角色或生成Run，不写角色就绪证明；模型仍未验证，最后一步保存确切配置后真实试运行。CLI报告已登录不代表凭据当前有效、版本读取不代表功能兼容，自定义模型配置也不继承默认CLI账户的连通证明。只显示白名单版本/状态/时间，不回传账户、邮箱、目录、部分密钥或原始输出。

CLI切换卸载旧检查视图，迟到响应不能覆盖新引擎；检查不在切换语言、主题或重新进入步骤时自动执行。关闭表单不等于停止检查，内核持有其生命周期；同一活内核下超时、限量、终止未知、防重与退出拒绝由内核处理。跨崩溃重启的探针意图/身份恢复尚未实现，本增量不声称支持自动恢复或安全回收；旧业务Run停止问题也未关闭。

内核完整135项、独立11项/真实4查询、真实合成父子进程及受控失败ACK通过；桌面strict/lint/格式、36单元/6装配及构建通过。Windows实际包专项3/3：两个中英界面/坏输入用例和一个实际四CLI查询用例，没有模型调用；当前默认完整46项为31通过、15明确跳过、0失败、退出0。

初轮新增客户端单元的受控拒绝响应漏掉协议必填retryable，严格校验按预期断开；补全测试响应后通过。初轮界面坏输入期望内核错误码，但main边界实际稳定拒绝为INPUT_INVALID；仅修正确断言。首轮完整回归仍寻找旧工具发现按钮，改走读取版本并等待真实结果时间；CLI缺失也要如实显示不可用，模型仍未验证、角色仍不能启用，不以假成功替代。前述初始记录保留，修正后完整通过，未放宽协议、删除错误断言或使用强制点击。

桌面独立Tester最终PASS：agent-browser操作实际包，完成Codex/Claude四类只读命令，为英文结果布局另外显式重查Claude两项，共6次只读查询；这不是模型调用。结果仅含安全版本/状态/时间，模型始终未验证，全部阶段权威快照相同（0个角色、Run和就绪记录）。切换CLI/关闭重开/市场往返不自动检查、草稿保留；额外command经命名IPC稳定拒绝`INPUT_INVALID`，Esc归还创建来源。宽中文浅色及700px英文深色首两图无阻塞问题，没有继续美容。自有实例菜单退出0、`kernel.stopped`、pageerrors空、已知自有进程树退出后空，未碰旧故障实例。

独立窗口未制造迟到响应、缺CLI、未登录、异常输出、超时、未知状态或检查中关窗，不以正常查询推断其UI通过；内核独立失败/进程守卫有各自范围。独立Reviewer最终APPROVE，无剩余P级问题：另行36单元/6装配、类型/lint/规模/diff通过，包内126文件、锁、manifest及tar完全匹配，内核固定检出干净。首轮Keychain调查文档来源P3已修正，将签名/构建识别参与本次失败明确标为推测，未将其归因于固定42接口或宣称唯一根因；补审关闭。当前增量无远端CI或新正式身份安装器结论，不继承前序结果。外部真实模型凭据、飞书角色应用路由、Mac用户设备等继续记录，不冒充已完成。

复现：`pnpm kernel:assemble`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`、`pnpm build`，用`node build/package-desktop.mjs <新目录>`装配后指定`WEFTPILOT_PACKAGED_EXE`运行`pnpm test:e2e`。可用本机CLI环境显式设置`WEFTPILOT_REAL_CLI_CHECKS=1`，运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/cli-checks.test.ts`；版本/账户检查本身不发起模型请求。

角色卡片`2cb75c1`的[CI 40099809043](https://github.com/CerrorJ/weftpilot/actions/runs/40099809043)：Windows成功，35单元/6装配、开发与实际包各29通过14跳过；macOS开发29通过14跳过、DMG/ZIP装配成功，但实际包备份保存合成密钥再现`CREDENTIAL_STORAGE_UNAVAILABLE`，28通过1失败14跳过。历史Keychain根因仍未定位，不跳过失败、回退明文或使用签名凭据；此增量未继承18465的全绿结果。
