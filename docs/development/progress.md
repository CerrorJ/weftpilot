# 开发进度与跨设备交接

更新：2026-10-23。用户已授权 M0—M4 连续开发，两仓开发分支分别提交并推送，不合并、不公开发布。

后续授权更新：凭据由用户后续提供，继续推进可独立完成的 M1—M4 开发。本文先前“凭据到位再推进 M1”的顺序被本条取代；远端 CI、飞书真实租户、签名和 macOS 原生验收保留待办，不据此宣称已通过。

## 当前状态

M0本机原生与打包、M1真实闭环、M2双CLI团队已完成Windows限定范围的独立验收；M3人工处理和飞书本机适配也通过。远端桌面CI仍缺跨仓凭证，真实飞书租户、自定义模型成功路径和macOS原生仍待验证，不将局部通过扩写为完整跨平台通过。
M4技能版本、真实双CLI技能交付、备份恢复已接入并分别经Tester/Reviewer通过；当前桌面锁定`0.5.7/daea984/schema7`。备份恢复补审关闭SQLite触发器P1、盘根P2及恢复退出竞争；实际EXE3/3和恶意schema负例通过。参见[M4备份记录](m4-backup.md)、[技能记录](m4-skills.md)。继续诊断UI、安装包与更新装配，M4整体尚未完成。
全流程支持中英文及浅色/深色/跟随系统，偏好经重启验证。下文各节为按时间保留的阶段记录，当前状态以本节及各增量文档最新记录为准。

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

## M2 当前交接

桌面已改为锁定 M2 0.3.1/a0f90b5/schema 4，需求/模型/团队版本、角色试运行/启用、父子 DAG、人工验收门控、贡献合成和并发队列均已接入实际界面。独立 Codex 团队闭环、旧快照与重启、英文和主题实看通过；默认 E2E 3 通过、3 个付费 CLI 用例显式跳过。详见 [M2 记录](m2-product-teams.md)。M1 停止诊断后续 0.2.4/0.2.5 原生回归及 Reviewer 已通过，旧失败仍保留，参见 M1 记录末尾，不能沿用上面的旧待复验状态。

M2 整体未封板：Claude 新探针收尾/停止待确认、安全模型凭证桥接、打包与整体审查仍在处理。Agent-Team 当前凭据端口在开发，不在桌面产物里引用未提交源码。M3/M4 尚未完成。外部凭据和 macOS 待办只记录，不作为独立开发停工条件。

## M2 模型凭据与精确版本增量（2026-10-23，未封板）

桌面消费内核更新至 0.3.2 / 3df108231a4d8c8f590674b024a7da4f30c72198，已从固定干净提交重复装配并校验摘要。自定义模型表单、系统加密存储、不可覆盖旧引用、私有运行时解析、模型精确版本引用已接入。新增凭据 E2E 和独立 Tester 通过，Reviewer 在审；真实自定义提供方成功执行仍缺凭据，不将本机 401 拒绝路由当模型成功。修复独立测试发现的历史模型下拉丢失问题。详见 [凭据增量](m2-credentials.md)。

停止 E2E 修正了 Playwright 异步 predicate 的假等待，真实在途工具停止和完全退出重新通过；此前偶发 taskkill 128 保持 STATE_UNCERTAIN 并保留现场，根因未关闭。打包内核真实 Codex→Claude 交接、验收与父任务完成已经实际跑通，探针收尾退出码 1 尚需核查，不能宣称整体打包验收通过。M3/M4 尚未完成；外部凭据与 macOS 验证记录后继续独立开发。

凭据增量后续：独立 Tester 与 Reviewer 均已通过，历史模型选项修复经直接保存和二次重启复验；指定结论不等于 M2 整体封板。可复现双 CLI 打包 UI 用例已添加，首次文件比较遇到 Windows 全局 Git 行尾转换，合成仓库固定 LF 后正在重跑，未放宽逐字节断言或改动用户仓库配置。

## M2 Windows 功能范围完成，继续 M3

最终打包双 CLI 用例由父代理和独立 Tester 分别运行通过；增强版 Buffer 三方逐字节、精确上游交付 ID、重启后同 ID 的断言由独立 Tester 再次运行 1/1 通过（102.7秒，exit0），测试代码补审 APPROVE。M2 Windows 核心退出条件（依赖/并发正确、配置快照不改写、第二 CLI 与对应真实界面）达成，按用户授权继续 M3。当前内核 0.3.2/3df1082，桌面功能0293c43，详见 [M2 Windows 验收](m2-windows-acceptance.md)。跨平台、有效提供方凭据、CI Secret 及旧停止不确定现场仍未关闭，不能把阶段本机结果扩大为发行或完整跨平台通过。

## M3 人工处理增量已联调，飞书继续开发

当前桌面锁定 `0.4.2/af9896a/schema5`。三类请求与待处理界面、同 Run 续接、等待重启、中英文和明暗主题已真实打通；独立 Tester 的打包双 CLI 2/2 和手动三类请求通过，独立 Reviewer APPROVE（内核专项15/15、桌面7/7）。父代理另有 Claude 普通提问未产生结构化请求的失败证据，作为P2保留，后续源码正在加强协议指引，未将失败改记成功。具体命令和限制见 [M3 人工处理记录](m3-human-workflow.md)。

Agent-Team 下一版飞书适配正在开发，尚未更新桌面锁定；没有真实飞书凭据，不连接生产应用，先完成端口、持久化与界面。M3 整体与 M4 尚未完成。外部阻塞继续记录后推进，不等待确认。

## M3 飞书连接进入独立复验

桌面已锁定 `0.4.4/d6b470a/schema6`（内核功能c5743a9，生成物兼容修复d6b470a），连接向导、系统密文、版本绑定、真实SDK端口和共享卡片/决定用例均已接入。内核81/81、桌面10/10、实际EXE默认E2E四项通过；独立Tester发现的非法字段原始错误展示已修复，正在复验。详情与失败记录见 [M3 飞书连接](m3-feishu-connection.md)。真实租户未提供，不将合成端口或绑定成功当作飞书连通；整体M3与M4仍未验收完成。

后续锁定升级至 `0.4.6/0ecb4ab/schema6`：0.4.5阻止长卡片截断后批准，0.4.6修复Reviewer指出的实际SDK HTTP响应正文契约P1，并严格核对SDK支持的AppID。83/83内核、10/10桌面、实际SDK本地HTTP/WS专项与94文件独立干净重建通过；Reviewer最终APPROVE，Tester r2负路径和0.4.6包绑定/原生专项均已通过。首次原生测试清理EBUSY按失败记录，有限重试after钩子修正后独立复验1/1通过，并经补审。真实租户、macOS和M3整体仍未验收；继续开发不依赖这些条件的M4能力。

## M4 技能Windows增量完成，继续备份恢复

M3桌面连接增量已提交推送 `07c5eed`。两仓继续在 `feat/skills-release` 开发，桌面固定内核 `0.5.2/062db21/schema7`；来源版本、真实下载预览、确认安装、升级/卸载、角色固定技能和Run独立副本已接入。内核91/91，桌面10/10和默认E2E4通过；开发构建真实Codex/Claude任务2/2逐字节技能交付并人工验收通过。独立Tester的0.5.1实际EXE默认、来源及真实Codex闭环通过，升级基准缺陷已关闭；Reviewer提出的卸载后停用P2在0.5.2修复，独立专项6/6和新EXE默认4项通过，最终APPROVE。104文件/产物摘要经独立干净重建核对。详见[M4技能记录](m4-skills.md)。技能增量完成，M4整体未完成；外部条件继续记录，继续备份恢复、诊断和发行装配。
