# Windows本地候选与后续验收入口

2026-10-23。按用户授权连续推进M0—M4；凭据相关信息记录后继续处理独立工作。本记录区分已验收的Windows能力与尚待外部条件的完整发行，不能用局部结果宣称M3/M4全部完成。

## 当前能力与验证范围

后续开发入口已转至`feat/prototype-alignment`，锁定内核0.5.9/`1938441637e673744f0b95a60bcffc08f8509958`，协议1/schema7；两份干净重建及115文件摘要一致。Windows新应用目录的默认检查12通过/11显式跳过，独立打包进程边界1/1通过。当前正在完成八页原型对齐增量及审查修复，尚未据此生成新的干净源码安装器或宣称完整设计已验收。下方0.5.8旧安装器来源与摘要保留原归属，详见[当前设计差异与验证](prototype-alignment.md)及[新增真实集成失败](expanded-native-integration.md)。

最新补充：桌面当前开发入口`fix/native-pnpm-launch`（包含原`feat/skills-release`全部功能），内核仍为`feat/skills-release / 0.5.8 / 2d347d1`。源码`34bfa29`的[Windows/macOS CI](https://github.com/CerrorJ/weftpilot/actions/runs/39915331008)已全绿，含原生runner实际开发/打包Electron测试及NSIS/DMG/ZIP装配；下面历史待验收列中的“桌面远端双平台CI”已完成。macOS用户设备、真实CLI、实际安装升级与公开发行未据此标为完成，详见[CI修复记录](ci-native-pnpm.md)。

| 阶段 | 已实现并实际验证                                                                                                                                  | 尚未验收                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| M0   | Electron/React/严格TS、真实打包内核、版本握手、窗口隐藏继续、菜单完全退出确认停止、干净源码与逐文件摘要装配                                       | 桌面远端双平台CI；macOS原生                                             |
| M1   | 项目/角色/真实CLI任务、日志、停止/新Run重试、版本交付、人工验收及重启恢复                                                                         | 历史taskkill128不确定现场根因仍保留                                     |
| M2   | 需求/模型/角色/团队不可变版本、角色真实试运行、Codex与Claude真实依赖团队交付和父任务验收                                                          | 有效自定义模型服务的成功路径；macOS原生                                 |
| M3   | 澄清/方案/单次操作、同Run续接与新Run重试区分、旧版本/幂等决定守卫、共享飞书用例/状态卡片、系统加密连接向导及官方控制台辅助                        | 专用真实飞书租户连接、事件/卡片与桌面跨渠道决定；Claude普通提问偶发限制 |
| M4   | GitHub固定提交技能预览/许可/安装/升级/卸载与真实双CLI技能交付；备份检查/恢复与失败保护；只读诊断导出；Windows验证身份NSIS安装/升级/卸载与数据保留 | macOS原生安装/Keychain/退出/升级；签名、公证、公开更新渠道和公开发行    |

所有当前界面沿用中英文及浅色/深色/跟随系统偏好；重启与Windows验证安装器升级后仍保持。用户输入、任务和交付原文不自动翻译。
本轮既有Agent-Team脏改动、旧失败进程/数据、生成OpenWiki和在线飞书服务均未接管。未合并main、未公开发布、未使用签名凭据。

## 固定来源与本地候选

- 两仓均在`feat/skills-release`分别提交推送。内核源提交`2d347d11bf5b0f1cb61cc26366cb65643d5678d1`，版本`0.5.8`，协议`1`，数据库schema`7`。
- 内核tarball SHA-256：`1fe70425927e9d25369358c01dce9afd89f07feb2e504e08eadb8febc6a94f7f`；完整115文件锁定在`config/kernel-lock.json`。
- 桌面备份增量`b9ad0e9`，诊断`1b5b845`，安装器完整性/源树隔离`6561a41`、`c954fc4`，发行清单校验与真实测试`bf85620`。
- 后续仅测试保护`53b7e9f`和交接文档变化，不将其提交号冒充候选包来源；产品运行代码仍与下述固定候选一致。
- 正式产品身份本地候选来源为干净提交`bf856209b9a4cdbf28ae92fc8805fad9454c262c`；版本`0.2.0`，Windows x64，未签名。EXE SHA-256：`05a9c3487e0f972bd29da81f5337ac6c365cf01077d9539817fa0518306d0fb4`。
- 本机输出在忽略目录`.tmp/installer-production-bf85620`；真实清单、EXE、blockmap和未安装应用目录均已生成。此正式身份候选只做本地构建、摘要和隔离测试数据运行，未覆盖安装任何正式环境。
- 实际安装/升级/卸载独立验收使用干净`c954fc4`生成的独立validation身份0.0.1→0.0.2，详见[安装器记录](m4-installers.md)。它不等于正式appId现有用户安装迁移已验收。

不要手改清单的`pending`冒充原生通过。完整性校验只证明本地材料匹配，不证明签名、发布来源或可信自动更新。

## 可复现检查

新设备须获得正常私有内核Git读取权限；不复制其他设备登录文件。已知依赖使用Node24.18.0、pnpm12.3.4，Electron42.0.0内嵌Node24.15.0。

```powershell
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:packaging
pnpm build
pnpm test:e2e
pnpm dev
```

构建安装器必须是干净提交且使用新输出目录；`pnpm package:installer`不发布、不签名。随后执行`pnpm release:verify <输出目录>`。已有失败目录不能覆盖。
验证实际打包程序时，将`WEFTPILOT_PACKAGED_EXE`设为该新输出中`win-unpacked/WeftPilot.exe`再运行`pnpm test:e2e`；各默认用例创建独立测试数据，不使用正式用户数据。

本轮内核109/109、桌面20/20、装配策略3/3通过；strict/lint/format及构建通过。开发与正式身份本地候选的默认原生E2E均为9通过/11显式跳过；有调用成本或需特定条件的CLI/来源/安装器测试另按各阶段记录真实运行，未将跳过项计为通过。独立NSIS1/1加已安装应用agent-browser实看通过。

Windows安装器与本地发行材料独立Reviewer最终APPROVE，无待修复P0/P1/P2；测试保护提交后独立NSIS复验1/1通过。Reviewer另核对三个候选应用目录的115个内核文件集合/SHA和真实发行材料，不将其源码检查当成自己执行过安装流程。详细归属及限制见[安装器记录](m4-installers.md)。

## 外部条件到位后的顺序

1. 仅在GitHub Actions Secret配置只读`AGENT_TEAM_READ_TOKEN`，再重跑桌面Windows/macOS CI；不要在聊天、Git或公开日志提供令牌。
2. 在专用开发飞书应用与本机连接表单中完成权限/事件/卡片核对，验证重复、过期、跨渠道决定；不切换既有在线服务。
3. 用专用有效自定义模型凭据验证成功执行；合成401拒绝不算成功。
4. 在macOS实际设备执行原生启动、Keychain、双CLI、进程停止、备份恢复、安装与升级，逐项记录硬件/架构/系统与结果。
5. 所有者决定发行许可证，另行授权签名、公证、正式更新地址与公开发布；未获授权前不发布或接触签名材料。

细项见[外部待办](pending-external-validation.md)。M4完整退出条件仍要求两平台原生与旧入口回归；本机可独立完成的工作不会等待这些凭据，但这些验收不能伪造或省略。
