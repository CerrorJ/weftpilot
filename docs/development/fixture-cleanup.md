# 测试临时目录清理范围修复

2026-10-24，分支`fix/fixture-cleanup-scope`，基于桌面`9f63b6657e6e9457bf567d9426bf953dcca4e1e3`；内核仍为0.6.0/p1/schema8/`c7366ba`及原116文件锁。

[CI 40082231339](https://github.com/CerrorJ/weftpilot/actions/runs/40082231339)的Windows/macOS均在单元`fixture-path.test.ts`失败：先前新增的清理范围校验，在清理时重新读取当前`tmpdir()`；该回归有意在创建夹具后恢复TEMP环境变量，导致本来属于测试自己的目录被错误拒绝。此失败是测试辅助校验的问题，不是内核迁移或应用业务失败。该CI未运行到macOS串行包测试，不能据此判断此前Keychain问题是否解决。

现在创建夹具时记录实际canonical父目录，清理时核对原路径未被替换、真实父目录与记录一致、目录名称为本测试前缀。随后仍先读取Run；活动、进程不确定、损坏JSON或缺表时不删除。Windows有限文件删除重试保留，次数耗尽仍失败；没有强杀进程、删除旧现场或放宽到整个TEMP。

实现者完整26单元、strict、lint/行数通过。独立Tester再次通过26单元、实际TEMP别名回归及7个自有边界探针，覆盖环境恢复/后续改变不转移目标、active/uncertain保留、坏JSON/缺表拒绝、路径换junction拒绝且原目录与新目标保留。其首个辅助探针teardown遇到EPERM，仅修忽略目录的探针后复验通过；没有修改产品或被测源码。

独立Reviewer最终APPROVE，另行执行别名回归、定向lint和diff检查，确认清理范围不随TEMP改变、活动/未知Run及损坏数据仍保留。双平台修复结果必须由后续CI另行确认，不将独立Windows通过写成macOS通过。

复现：锁定Node/pnpm工具链并装配固定内核后执行`pnpm test`、`pnpm typecheck`、`pnpm lint`；定向为`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/fixture-path.test.ts`。纯测试辅助修复不需要模型、飞书或浏览器权限；macOS最终结果仍等待修复分支的真实CI。角色六步开发保留在另一个工作区，没有带入本修复或自动合并分支。
