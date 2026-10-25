# CLI 输入生命周期与固定内核接入

桌面代码已本地提交`b75660ba6043de96812442ba200ed8cd9dd3e833`（`feat/prototype-alignment`），关联内核源`aaeeeb4`。2026-10-25推送遇本机Git HTTPS握手失败；现有系统代理及受校验的替代TLS/SSH传输也未通，未修改全局网络/证书设置。GitHub连接器确认远端仍`26f2f309`，备用上传明确403 `Resource not accessible by integration`，没有创建替代分支或改变远端。故091远端CI尚未触发，不将旧CI或本机验收写成新Mac结论。保留本地提交、完整证据与原分支，网络/连接器写权限恢复后正常推送；继续可独立的本地开发。

2026-10-25。Agent-Team `fix/cli-stdin-lifecycle`已提交推送`aaeeeb41990920f3223f32a94b2c6e86ef7719a4`，版本0.9.1、协议1、schema8。桌面锁定该提交并独立重建装配128文件，tar SHA-256为`fcf11983a4b83918d0d9ee01a0deabd10107a1973be79125b58bf3ab0a6c3688`，与干净内核工作区产物一致。未使用相邻未提交源码；旧停止不确定现场保持原状。

实际Windows有界Node探针以256KiB合成输入、开始后立即取消触发未捕获write EOF，宿主exit1；新输入模块先接管管道错误、拒绝不完整输入的成功结果，终止端口失败/异常保持STATE_UNCERTAIN。修复后同探针exit0、取消与真实taskkill确认0。独立Tester发现的提前tool先终止/P1误进入人工等待已修正：不能用tool代替stdin写完证据，输入失败优先于工具/结果，取消与重试保持分离。真实文件SQLite复验无human/交付，未知仍不可重试且shutdown不ACK，完整读取368000bytes后正常工具仍可等待审批。153项、strict/lint/格式及原独立飞书服务/内核构建通过，独立Tester最终PASS、Reviewer最终APPROVE。受控Node/流不是真实模型证明，也不关闭旧taskkill255/128根因。

桌面增加`CLI_INPUT_FAILED`中英文提示，CI在装配后直接执行锁定源码的内核回归。Windows本机隔离检出153/153通过，桌面strict/lint/格式、43单元及7装配检查通过。新实际Windows包完整52项为36通过16明确跳过、0失败/取消；根代理另定向真实Codex文件M1闭环1/1通过（约70秒），含1次真实trial和2个业务Run：真实文件/diff、退回原因保留、新Run/交付版本2及逐项显式验收、正常退出0。

独立Tester最终PASS、9项断言通过：实际agent-browser核对091握手与Windows x64、中文浅色/英文深色及128文件摘要；独立真实Git安全回归通过，错误翻译纯函数中英断言通过（不冒充真实EOF失败UI证据）。唯一真实Claude trial约152秒成功且confirmed_ended，未自动启用；显式Enable后仍同一proof、仅1Run。全程无失败/超时/重试；正常菜单退出0、kernel.stopped、无pageerror、自有进程树为空。未重复此前090的Claude完整人工流程，不将正常模型路径当作停止竞争或Mac真实模型证明。

桌面独立Reviewer最终APPROVE，无新增P0—P3；独立43单元/7装配、两套strict、lint/规模/格式及128精确文件/两锁/tar摘要通过。另自有真实Git的unborn/零HEAD均拒绝且保留原状。提交与推送状态见页首，尚无本增量远端CI或新正式身份安装器结论。

实际普通packager应用含额外`artifact-lock.json`，安装器专用验证器会严格拒绝该额外文件；第一次直接复用它失败不属于内核文件缺失。针对普通包另核对外层lock及额外artifact-lock均深等于固定配置、剩余128文件精确集合与逐文件SHA全部通过，未忽略其他多余或缺失文件，也未改宽安装器规则。

## 中断缓存与装配保护

恢复工作时发现装配缓存Git HEAD包含无效零字节、内核package不完整；中断与损坏的具体因果未确定。旧source/staging/package移到同一受忽略缓存下的带日期目录保留，未删除或修改产品仓库HEAD。新增构建保护在任何fetch/checkout前核对真实Git根目录、有效HEAD和干净状态，防止Git向上发现桌面仓库，也不覆盖缓存已有改动；新克隆使用完整检出再核对。真实临时父子Git仓测试确认缺失/损坏嵌套仓被拒绝，合法干净仓通过，已有改动被保留并拒绝装配。

复现：按README使用锁定Node/pnpm，执行`pnpm kernel:assemble`、`pnpm --dir .kernel/source test`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`和`pnpm package`；指定新应用的`WEFTPILOT_PACKAGED_EXE`后执行`pnpm test:e2e`。真实模型另按[人工补验](human-review-regression.md)的显式门控执行，不将默认跳过写成通过。Windows专属内核原生用例在其他平台明确跳过，CI结果需按实际平台分别核对。

真实飞书应用、多角色路由、Mac用户设备/真实CLI、签名/公开发布和旧停止不确定现场仍待处理，M0—M4整体未封板。
