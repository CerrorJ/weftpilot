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

独立Tester/Reviewer与最终远端CI结果后续补记。原目录仍保持`product-design`及其已有未跟踪产物，不切换、清理或覆盖旧失败现场。
