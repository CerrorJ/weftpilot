# M2 Windows 功能验收与继续开发

2026-10-23。按用户“外部阻塞记录后继续”的授权，M2 Windows 功能范围完成，开始 M3；这不代表其他系统、CI 或真实第三方账号验收完成，也不是发行批准。

关联：Agent-Team feat/product-teams / 3df108231a4d8c8f590674b024a7da4f30c72198 / 内核 0.3.2、协议 1、schema 4；纬舟 feat/product-teams / 0293c43 为凭据与客户端实现，后续提交包含可复现双 CLI 验收。完整 tarball 和文件摘要由 config/kernel-lock.json 锁定。

## 实际范围与证据

| 范围                       | 实际结果                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 需求、模型、角色、团队版本 | 保存追加版本，历史 Task/Run/模型引用不被改写；独立测试发现并修复历史模型选项丢失                                                                    |
| 第二 CLI 与角色健康        | Codex/Claude 均真实完成随机文件挑战，成功后显式启用；失败/旧版本/未启用阻止新执行                                                                   |
| 团队/子任务/依赖           | 原子拒绝重复键和环，下游等待上游人工验收；真实 Git 菱形去重与贡献冲突保护                                                                           |
| 并发与队列                 | 全局两槽、每角色一槽、每项目一位写者，不同项目可并行；未知状态封锁所属项目                                                                          |
| 打包真实双 CLI             | 实际 exe 内 Codex 生成随机上游文件，接受后 Claude 读取合成输入并写入下游；Buffer 比较源文件、输入、输出逐字节相同，输入交付 ID 精确匹配且重启后保持 |
| 交付与人工验收             | 上游未验收时下游 queued/not_started；每份交付独立接受，全部子任务接受后父任务 done；退出/重启保持                                                   |
| 凭据                       | Windows safeStorage、不覆盖旧引用、提供方/地址绑定、重启解析旧版本密钥；真实 Codex 向本机 401 接口验证认证拒绝，未伪称模型成功                      |
| 界面                       | 中英切换、明暗/跟随系统、版本对象和队列历史；真实包英文/深色在重启后保持，浅色正常，无 pageerror                                                    |

内核 67/67 默认测试，桌面 7/7 单测、类型、lint/规模、格式与构建通过。默认 Electron E2E 3 通过，真实 CLI/凭据/团队用例通过显式 opt-in 单独执行，不将默认跳过当通过。

独立 Tester 与 Reviewer 对对象/团队、凭据增量分别通过。打包双 CLI 最终增强断言版由独立 Tester 实际运行 1/1 通过（102.7 秒、exit 0），测试代码补审 APPROVE，无遗留必修项。证据在本机忽略目录 .tmp/evidence/m2-*，不提交真实运行数据。早先辅助 UtilityProcess 探针业务成功后退出码 1 未捕获根因，其残留合成 Git 目录在进程退出后清理成功；正式打包 UI 验收完整退出/重启与夹具清理均 exit 0，没有把辅助失败记为通过。

## 可复现

先按 [开发记录](m2-product-teams.md) 从干净固定源码装配、检查、构建。Windows 本地打包：

```powershell
pnpm package
$env:WEFTPILOT_PACKAGED_EXE = (Join-Path $PWD 'release/WeftPilot-win32-x64/WeftPilot.exe')
$env:WEFTPILOT_REAL_TEAM = '1'
node --import tsx --test tests/e2e/dual-cli-team.test.ts
Remove-Item Env:WEFTPILOT_REAL_TEAM
Remove-Item Env:WEFTPILOT_PACKAGED_EXE
```

本用例需要已安装并由开发设备自身授权的 Codex 与 Claude CLI，使用真实模型服务，不能在无凭据环境中声称通过。测试只在新建合成仓库中固定 core.autocrlf=false，以定义逐字节 LF 断言，不改用户仓库或全局配置。实际验收包放在忽略目录以保护旧失败 exe。

## 未关闭与下一步

Windows 偶发 taskkill 128 仍保持 STATE_UNCERTAIN，根因未关闭；当前在途工具停止/完全退出回归和失败端口的“不谎报结束”测试通过，不据此恢复旧现场。真实自定义提供方成功执行、macOS 原生验收、私有跨仓 CI Secret 仍见 [外部清单](pending-external-validation.md)。

M3 在 Agent-Team 内扩展持久人工请求/决定与同 Run 新执行段、统一渠道用例；纬舟增加对应界面与连接向导。专用飞书应用未提供前，真实租户验证保留待办；不使用现有生产凭据或切换旧服务。M4 尚未完成。
