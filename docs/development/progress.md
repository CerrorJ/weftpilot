# 开发进度与跨设备交接

更新：2026-10-23。用户已授权 M0—M4 连续开发，两仓开发分支分别提交并推送，不合并、不公开发布。

后续授权更新：凭据由用户后续提供，继续推进可独立完成的 M1—M4 开发。本文先前“凭据到位再推进 M1”的顺序被本条取代；远端 CI、飞书真实租户、签名和 macOS 原生验收保留待办，不据此宣称已通过。

## 当前状态

M0 本机原生与打包验收、独立 Tester 和 Reviewer 通过，但远端干净构建缺少必要的跨仓读取凭据，阶段最终验收仍未完成。macOS 桌面原生运行尚未验证。
M1 已接入真实项目/角色/Task/Run、Codex、Git worktree、状态日志、停止重试、交付与验收界面。Windows 真实 CLI 闭环和停止测试通过；独立 Tester 复验通过，Reviewer APPROVE（受影响回归 8/8）。M1 Windows 本机验收通过，继续 M2；外部平台/凭据验收仍待处理。新增中英文、浅深主题与跟随系统设置，偏好经刷新及重启验证。详见 [M1 开发记录](m1-local-workflow.md)。M2—M4 尚未开始。

## 当前真实阻塞与已备好的修复

通过当前开发设备的正常 Git 认证只读核对 API 后，确认纬舟为 public、Agent-Team 为 private；没有改变可见性。
内核自身 Windows/macOS CI 已通过：[Embedded kernel](https://github.com/CerrorJ/Agent-Team/actions/runs/39798905100)。
桌面两平台 CI 在拉取内核时失败：[Desktop](https://github.com/CerrorJ/weftpilot/actions/runs/39798943330)，错误为缺少 GitHub 跨仓读取身份。
这不是 macOS 编译通过或业务执行证据，不能据此跳过 M0 门槛。

已准备专用凭据接线：CI 先检查 `AGENT_TEAM_READ_TOKEN`，再按完整锁定提交 checkout 私有内核，`persist-credentials: false`；装配发现目标提交已存在时不重复联网，仍校验产物 SHA-256。
缺少凭据时明确阻塞，不回退到其他代码或模拟内核。接线经独立 Reviewer 审查通过。

需要仓库所有者在纬舟的 [Actions secrets](https://github.com/CerrorJ/weftpilot/settings/secrets/actions) 配置 `AGENT_TEAM_READ_TOKEN`，只授予读取 CerrorJ/Agent-Team Contents 的权限，或提供已有 GitHub App 的等价只读授权。
不要将令牌发到聊天或提交仓库。本机 Git 认证只用于本机正常访问，没有复制到 CI，也没有从其他设备复制登录文件。
凭据到位后重跑两平台 Desktop CI，继续修复实际失败，验收 M0 后再推进 M1。

## 工作区保护

开发开始时纬舟 main 干净，基于它建立 feat/m0-kernel-host。
原 Agent-Team main 有 .env.example、README.md、config/bots.example.json 三处既有改动。
内核开发在新建隔离 Git worktree 的 feat/embedded-kernel 分支完成，未带入或提交上述改动。
没有读取旧 .env、CLI 登录文件或生产数据，没有启动独立飞书服务或切换在线服务。

## M0 当前成果

- Agent-Team 显式 createKernel、独立嵌入入口、协议 1、health/events/shutdown。
- SQLite 持久生命周期事件与独占实例锁；未实现业务能力通过握手明确标为 unavailable。
- 原独立飞书入口保留，现有 31 项测试加新增 2 项内核和 1 项 Windows 启动测试均通过。
- 修复 Windows shell 启动导致空格路径失败：受支持 CLI 入口改为 shell:false。
- 纬舟 Electron/React/TypeScript 工程、隔离 preload、来源校验、工具进程宿主、版本核验。
- 原创品牌界面与托盘；关闭窗口隐藏、完全退出先确认内核返回并等待工具进程结束。
- 系统凭据加密适配器已建立，尚无业务凭据写入界面。
- 固定提交重建内核 tarball 并校验 SHA-256；运行时校验内核文件摘要。
- Windows/macOS CI 定义已建立；远端结果单独记录，不将配置存在当作已通过。

## M0 历史关联

- Agent-Team 分支：feat/embedded-kernel，M0 首提交 d9e3f9d，评审修复及锁定源码 8a1491aeab5b6dd194083fb3b1e7a94afa1c3ce9（已推送）。后续纯 CI 修复不改变该已验证产物。
- 纬舟分支：feat/m0-kernel-host，阶段提交见本分支 `feat(desktop): 完成 M0 内核宿主与打包装配`。
- 内核 M1 草稿：feat/local-workflow，提交 a62b780；详细状态见该分支 docs/m1-work-in-progress.md。纬舟没有消费该草稿。
- 内核 0.1.0 / 协议 1 / 数据 schema 1。
- 产物版本、源提交、tarball 与文件摘要：config/kernel-lock.json。

## 可复现方法

两仓都不需要生产配置。桌面构建仅需要纬舟检出和网络，不要求相邻内核仓库。

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
pnpm package
pnpm dev
```

Windows 打包后验证（PowerShell）：

```powershell
$env:WEFTPILOT_PACKAGED_EXE = (Resolve-Path release/WeftPilot-win32-x64/WeftPilot.exe).Path
pnpm test:e2e
```

内核独立检出：`pnpm install --frozen-lockfile`，依次运行 typecheck、lint、format:check、test、build、build:kernel。
原入口仍为 `pnpm start:once`，需要开发设备单独授权的飞书配置，本次未连接真实租户。

## 已执行的验证

- 内核构建、strict 检查、lint、格式检查，34/34 测试通过。
- 内核在桌面独立干净检出中按固定提交重建，tarball SHA-256 与锁文件一致。
- 桌面 strict 检查、lint 与物理行检查通过；4/4 测试通过（2 项客户端契约，2 项 CI 凭据预检）。
- Windows Electron 原生 E2E 1/1 通过：锁定握手、桥接无 require、重新检测、隐藏后查询、完全退出与持久停止事件。
- Electron 42.0.0 工具进程实际运行 Node 24.15.0，SQLite 无额外 ABI 扩展即可运行。
- Windows 应用目录打包成功；打包后 E2E 与独立 Tester 验收通过。增强 E2E 将应用复制到中文/空格/# 安装路径，从临时 cwd、仅 System32 PATH 启动，验证无开发 Node 依赖和系统加密往返。
- 独立 Reviewer 首轮指出许可文本遗漏、CLI PATH 选择和断线文案；均已修复并复核通过。完整 Zod/React/ReactDOM MIT 文本进入产物 notices。
- 匿名/连接器 Actions API 最初返回 404，随后用本机正常 Git 认证临时只读查询确认了上述实际 CI 结果。当前桌面远端 CI 没有通过，不以本机通过代替。
- impeccable 机械检测没有返回命中项。截图在本机 .tmp/evidence/，不提交运行缓存。

## 限制与下一阶段

macOS 未在本机验证，不以跨平台编译替代原生验收；最终 M4 需要 macOS 原生安装、Keychain、停止进程树和更新验证。
未使用签名凭据，没有签名、公证、公开发行或生产服务切换。
旧飞书服务只做现有回归，不代表已验证真实租户连接或桌面/飞书共享新对象。
M0 通过后进入 M1：内核增加项目、角色版本、Task/Run、隔离工作目录、单 CLI、日志、停止重试、交付及人工验收。

## 最新交接（后续记录优先）

中英文切换、浅色/深色/跟随系统已在真实 Electron 与打包默认检查验证。M1 的开发构建真实闭环通过，但补充打包 exe 的真实 CLI 测试发现一次停止后状态待确认，M1 停止验收重新打开。0.2.4 诊断产物已锁定，正在复现和复验，不能沿用此前封板结论。

M2 已在 feat/product-teams 开始；Agent-Team 700da70 / 0.3.0 / schema 3 有需求、模型、团队版本、Claude 受控执行和角色文件挑战试运行基础，59/59 测试及本机两种真实 CLI 试运行通过。桌面仍消费 M1 schema 2 产物；M2 团队调度、模型凭证桥接与界面未完成。M3/M4 未开始。凭证、macOS 原生和其他外部待办持续记入清单，不等待确认。
