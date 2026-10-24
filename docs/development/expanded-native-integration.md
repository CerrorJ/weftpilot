# 扩展真实集成检查（2026-10-23，未全部通过）

用户授权当前可用能力全部测试。Windows使用干净提交`f959d880995a39b46fabebe78945e67377db7339`构建的独立验收身份应用，测试源码`a8c42be8c941232cae3d0b7f3f1af193cca1720c`；实际内核`0.5.8 / protocol 1 / schema 7`，来源`2d347d11bf5b0f1cb61cc26366cb65643d5678d1`。本轮是此前功能界面，不代表后续原型对齐界面已经验收。

## 实际结果

20个用例已输出14通过、5失败、1显式跳过。最后一个失败的退出清理仍被状态待确认阻塞，进程保留；没有正常退出的套件汇总，不能记录为完整通过或清理完成。

| 范围                                               | 本轮结果                                                 |
| -------------------------------------------------- | -------------------------------------------------------- |
| 备份恢复两项、原生窗口/内核生命周期、诊断三项      | 通过                                                     |
| 飞书密文与绑定/重启                                | 通过；合成App ID，不连接真实租户                         |
| Codex人工等待、重启、同Run续接、交付验收           | 通过                                                     |
| 模型凭据加密、轮换、地址绑定、真实Codex本机401拒绝 | 通过；拒绝不是提供方成功调用                             |
| 模型/需求/团队版本、DAG和未就绪守卫                | 通过                                                     |
| GitHub真实技能下载、预览、升级、卸载与重启         | 通过                                                     |
| Codex固定技能资源、逐字节交付与人工验收            | 通过                                                     |
| 语言/主题持久化与脏仓库保护                        | 通过                                                     |
| 在途任务请求停止及完全退出                         | 通过；不抵消竞争失败                                     |
| 双CLI团队、Claude人工处理、Claude技能完整流程      | 启用角色等待超时，未通过                                 |
| M1交付退回/新Run重试/验收                          | 等待验收入口超时，未通过；本轮完整失败状态不足以确定根因 |
| 启动后立即停止三次竞争                             | 失败且停机清理未完成，保留未知状态                       |
| NSIS安装/升级/卸载                                 | 本轮缺两版安装器输入而跳过；此前独立安装验收另记         |

## 停止竞争现场

本轮自有Run`0cf28b94-3bbc-408c-8d9a-41089196be5c`保持`stopping / uncertain / STATE_UNCERTAIN`。事件为`process_stop:failed:255:627ms`，执行片段没有结束时间。观察时片段根PID已不存在，但不足以证明整个后代进程树结束。

保留隔离数据库、日志、截图、应用和测试进程；没有手工改库为stopped、强杀应用、删除目录或接管旧现场。下一步核对Windows停止命令的退出证据与树确认逻辑，补竞争回归并验证新构建。不能直接将255视为成功或放宽状态断言。

## Claude独立诊断

人工/技能失败快照中的试运行实际为`succeeded / confirmed_ended`，readiness为`ready / enabled=false`；同一058协议校验均有效。当时未保存DOM、busy和选择器匹配数，不能直接判定CLI失败或前端原因。

独立Tester另起两套隔离数据，真实Claude试运行与UI启用均通过，并经菜单退出、持久停止事件和自有进程检查。严格后台对照启动后立即等待原启用按钮，在原生窗口仍隐藏时41.681秒自行成功。原120秒超时未复现，根因未定；不能将后台/低RAF当作已证实原因，也不能把最小通过当作Claude人工或技能完整通过。

下次完整失败在清理前同时保存：角色区域DOM、启用按钮数量/disabled、保存/刷新busy迹象、原生可见/焦点、页面可见性、pageerror及快照游标/时间。根据证据修复，不增加无依据的等待时间或重试。

## 复现与证据

用Node 24和锁定的官方pnpm 12.3.4安装、构建独立验收包后运行：

```powershell
$env:WEFTPILOT_PACKAGED_EXE = (Resolve-Path '<隔离包目录>/WeftPilotValidation.exe').Path
$env:WEFTPILOT_REAL_CLI = '1'
$env:WEFTPILOT_REAL_TEAM = '1'
$env:WEFTPILOT_REAL_HUMAN = '1'
$env:WEFTPILOT_REAL_SKILLS = '1'
$env:WEFTPILOT_REAL_SKILL_CLI = '1'
$env:WEFTPILOT_CREDENTIAL_PROBE = '1'
pnpm exec tsx --tsconfig tsconfig.runtime.json --test --test-concurrency=1 tests/e2e/*.test.ts
```

真实CLI使用开发设备现有登录，不复制认证文件；测试仓库、密钥和数据独立创建。本机证据位于`.tmp/evidence/expanded-real-integration-20261023.txt`、`expanded-stop-race-state.json`、`expanded-stop-race.png`及`claude-background-independent-report.md`。原始证据含本机路径和合成运行数据，不提交；仓库只记录可公开结论与复现方法。

飞书独立测试应用尚未创建或连接。用户确认以「产品经理」机器人为配置模板；后续使用独立应用身份及凭据，不修改该机器人或切换在线服务。最终界面遵循`product-design`原型的要求单独验收；CI和功能检查不替代视觉/交互验收。
