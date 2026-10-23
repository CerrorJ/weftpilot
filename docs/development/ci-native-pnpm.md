# 桌面CI凭据验证与原生pnpm启动修复

2026-10-23，开发分支`fix/native-pnpm-launch`，基于桌面`52b91da`。内核仍固定`0.5.8 / 2d347d11bf5b0f1cb61cc26366cb65643d5678d1 / protocol1 / schema7`，不改内核源码或产物锁。

## 已确认的凭据结果

用户在GitHub配置专用只读`AGENT_TEAM_READ_TOKEN`后，手动重跑[Desktop第19次运行的attempt2](https://github.com/CerrorJ/weftpilot/actions/runs/39876903946/attempts/2)。Windows和macOS均通过`Validate private kernel access`与`Checkout locked Agent-Team kernel`，因此“缺少私有内核CI读取权限”已解决。不记录或读取令牌内容，不扩大权限，不复制本机Git凭据。

此次CI整体尚未通过：macOS arm64在`kernel:assemble`将pnpm 12的无扩展名Mach-O可执行文件交给Node解释，抛出`SyntaxError: Invalid or unexpected token`。Windows已通过内核装配、strict/lint/format与20项单测，随后因默认矩阵fail-fast被取消，不能将取消项记为通过。

## 修复与本地验证

装配入口不再只以`.exe`后缀区分原生程序。读取最多256字节，识别PE、ELF及Mach-O/Fat头后直接`execFileSync`运行；JS入口及Node shebang包装器仍由当前Node启动。未知文本包装器明确拒绝，全程`shell:false`，路径和参数保持独立，不拼shell命令。不改变依赖版本、锁定提交、摘要或业务行为。

CI矩阵设置`fail-fast:false`，保留两个平台的独立结果，不因其中一个失败取消另一个。

```powershell
pnpm install --frozen-lockfile
pnpm kernel:assemble
pnpm test:packaging
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

新增3项回归覆盖真实原生子进程的原样参数、真实JS/无扩展名Node包装器在中文空格路径下运行，以及合成Mach-O/ELF头不传Node与未知包装器拒绝。连同原安装策略共6项通过。本机Windows全新内核检出、冻结安装与构建重打包通过，115文件tarball摘要仍与原锁一致。合成Mach-O头只验证分流，不能冒充macOS原生执行；真实macOS结果须以新CI运行记录为准。

`9214f18`修复后的[真实双平台运行](https://github.com/CerrorJ/weftpilot/actions/runs/39913178558)已确认两平台均完成内核装配、strict/lint/format、20项单测、6项装配回归和应用目录打包，macOS原生pnpm启动错误关闭。

该次CI仍有测试失败：两平台6个E2E均等待项目目录原始文本超时。Windows临时路径使用`RUNNER~1`短名，macOS使用`/var/folders`别名，内核按既有约定保存规范路径；原测试夹具错误地用别名比较真实路径。仅在夹具创建时先`realpath`，保持路径精确比较和真实内核，不延长超时或跳过用例。新增真实目录链接/junction作为TEMP的回归，覆盖Git仓库夹具路径规范化，本机21项单测与strict/lint通过；新CI结果待补。

`5fa902e`与`b144847`的CI确认两平台默认Electron9通过/11显式跳过，Windows实际打包应用同样通过；随后安装器正确拒绝不干净源码。`3b7c521`增加仅文件名/源码锁差异的诊断，确认唯一差异为pnpm启动时删除工具链文档中重复的`@pnpm/exe`记录，共19行，项目依赖图完全未变。

本机全局启动器实际为pnpm11.17.0，会先记录`@pnpm/exe`再切到锁定12；CI由action-setup直接安装官方`pnpm@12.3.4`，只记录`pnpm`。已在本机独立临时工具目录安装官方固定12.3.4，真实冻结安装复现同样19行差异；提交官方12规范化后的锁，不隐藏、还原或忽略构建产生的变化，不取消干净源码检查。没有修改本机全局pnpm或原内核锁。后续本机检查使用该固定12入口并放到子进程PATH首位，避免嵌套脚本再次经旧启动器。

pnpm官方[锁文件说明](https://github.com/pnpm/pnpm.io/blob/main/docs/lockfile.md)区分工具链启动文档和项目依赖图，[上游问题](https://github.com/pnpm/pnpm/issues/14009)也记录冻结安装可能更新工具链元数据；本次仅规范化固定12.3.4的工具链记录，不升级依赖，不设置忽略版本或废弃的管理开关。

独立Tester/Reviewer已通过pnpm启动、夹具路径与清理边界增量；锁规范化补验和最终远端CI结果见下节。原目录仍保持`product-design`及其已有未跟踪产物，不切换、清理或覆盖旧失败现场。

## 最终验收

`34bfa29ab01dab9535fa10011c4ec63673c30500`的[真实双平台CI](https://github.com/CerrorJ/weftpilot/actions/runs/39915331008)最终全部通过；没有修改内核版本、协议、schema、115文件或tarball锁。

| 范围                                | Windows x64 runner | macOS ARM64 runner |
| ----------------------------------- | ------------------ | ------------------ |
| 私有内核检出、原生产物重建与SHA校验 | 通过               | 通过               |
| strict/lint/format                  | 通过               | 通过               |
| 单元与装配回归                      | 21/21、6/6         | 21/21、6/6         |
| 开发Electron默认E2E                 | 9通过、11显式跳过  | 9通过、11显式跳过  |
| 实际打包Electron默认E2E             | 9通过、11显式跳过  | 9通过、11显式跳过  |
| 未签名validation安装包装配          | NSIS成功           | DMG/ZIP成功        |

macOS最后一次前序失败是备份重启后立刻读取主题得到null：preload IPC快于React首次effect。测试在选择主题后退出前和重启后等待可观察的dark主题，仍保留精确属性断言，不sleep、不扩大超时、不重试或跳过；本机独立真实备份专项2/2及新CI均通过。

独立Tester还核对stock12冻结安装前后完整锁SHA不变、构建后工作树干净，以及项目锁第二文档134636字节与旧版逐字节相同。独立agent-browser实看握手、隐藏继续、菜单退出exit0与kernel.stopped通过；辅助脚本首次退出后读取已释放句柄的错误保留，新数据修正验证后通过。Reviewer最终补审APPROVE至`34bfa29`，无待修复P0/P1/P2/P3，独立确认锁、检查及远端双平台成功；本机原始证据均放忽略的`.tmp/evidence/ci-native-pnpm-{tester,review}.md`。

此结论覆盖CI实际执行范围，不能替代macOS用户设备的CLI、安装/升级/卸载、Keychain提示、其他架构与签名/公证/公开更新验证。后续交接文档提交不冒充此已验收源码提交；原型分支、原内核脏改动和旧失败现场保持不动。
