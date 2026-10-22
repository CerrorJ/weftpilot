# M4 技能增量（开发中，未作阶段验收）

两仓分支 `feat/skills-release`。桌面承接M3提交 `07c5eed`，当前固定内核
`0.5.2 / 062db21d1edc554da85f66ed2d9f0cdafe27ea8c`，协议1、schema7。
0.5.0功能提交 `463329b`，0.5.1固定升级比较基准并补下载恢复；锁定产物104文件重复干净构建摘要一致。

## 实际能力

- 技能中心支持公共GitHub来源和40位固定提交，编辑追加来源版本；下载先生成预览，完整说明、许可证、文件与SHA256供用户核对，再明确确认安装。
- 内核核对树完整性、Git blob、SHA256、路径、Windows保留名称、大小与数量；拒绝symlink/submodule及存储junction。不自动运行脚本、安装依赖、复制用户全局技能或扩大权限。
- 安装采用持久意图、staging验证、原子rename及数据库记录；下载中退出可取消，重启重做；rename已完成但事务未提交时核对原目录后完成。
- 升级导入新包，不改角色或Run；角色选择固定摘要并生成新版本，必须重新试运行。卸载停止新引用可用性，历史内容与Run不删除。
- CLI实际读取本Run独立技能副本，执行前后核对摘要；控制目录不进入交付/团队补丁。桌面仅消费内核命令和快照。
- 新页面同步中英文、浅色/深色/系统主题。角色草稿跨技能中心往返保留，并修正非空文本域的无障碍名称。

## 可复现验证

```powershell
pnpm install --frozen-lockfile
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
$env:WEFTPILOT_REAL_SKILLS='1'
node --import tsx --test tests/e2e/skill-workflow.test.ts
Remove-Item Env:WEFTPILOT_REAL_SKILLS
```

真实CLI专项另设 `WEFTPILOT_REAL_SKILL_CLI=1`，会使用已授权的本机CLI账户并可能消耗额度。
设置 `WEFTPILOT_PACKAGED_EXE` 为本机打包EXE可复验打包应用；不读取登录文件。
验证源为本仓原创MIT技能，两次固定提交：
`d9b64543d28459c98f6245a2c483a3f640e10e3d`、`55fe61b4254e8c7e1bdc2b362ee572b85043ca6c`。
没有把端口模拟当作真实下载或CLI结果。

## 已执行与失败记录

Agent-Team默认91/91、strict/lint/format、完整源码及bundle通过；桌面单测10/10、strict/lint/format通过。
0.5.0开发构建默认E2E4通过/10个明确跳过；一次并行窗口测试60秒超时保留为失败，父代理和独立Tester单独复跑及后续完整默认套件均通过，未推定根因。
真实来源专项父代理1/1通过8.58秒，独立Tester1/1通过8.92秒；首次测试的非空文本域标签和CLI定位已修正。
真实Codex/Claude技能任务2/2通过58.5/62.8秒：试运行、固定资源逐字节输出、控制目录排除、执行/人工验收分开。
首次Codex专项在任务创建选择器匹配两项而失败，收窄测试后重跑，未放宽业务断言。

独立Tester发现安装后升级差异与自身比较，0.5.1将比较基准固定到导入记录；补升级前后不变测试。
0.5.1实际Windows包经独立Tester通过默认4项、真实来源专项8.58秒及真实Codex技能任务55.06秒；700px英文浅深界面、安装后及重启差异基准不变均通过。
Reviewer另发现卸载后停用角色被可用性守卫阻止的P2，0.5.2已修复：停用保持CAS，试运行/启用仍要求技能可用。独立相关6/6与新实际EXE默认4通过/10跳过，未为守卫重复调用模型。
最终Reviewer APPROVE；独立干净重建、桌面装配104文件、tarball与manifest全部匹配0.5.2锁。Reviewer另行验证卸载后同Run审批续接读取原资源、快照不变且交付排除控制目录。
本次技能Windows增量通过，不代表M4整体验收或两平台发行完成。

## 剩余工作

技能来源目前仅公共GitHub固定提交；私有源、依赖自动安装不支持。未把未经核验许可的第三方技能预装进产品。
备份恢复、诊断、平台安装包/更新装配仍需实现和验证；真实飞书、自定义模型有效凭据、跨仓CI密钥、macOS原生及历史Windows停止128继续记录，不能由本次技能测试关闭。
没有签名、公开发布、自动合并或生产切换。
