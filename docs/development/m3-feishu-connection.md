# M3 飞书连接增量（Windows本机验证，真实租户待办）

桌面承接人工处理提交 `847dd0f`；内核锁定 `0.4.6 / 0ecb4abaa74491ec7e54a96879e3d1cdaee04c3d`，协议1、schema6。内核功能提交 `c5743a9`，生成物导入修复 `d6b470a`，长卡片修复 `bdd6330`、实际SDK HTTP契约修复 `0ecb4ab` 亦已推送；均在 `feat/human-workflows` 推送。没有自动合并、签名、发布或切换生产服务。

## 实际能力

- 新增飞书连接页和控制台辅助创建流程，提供中英文、明暗/系统主题；使用固定官方控制台地址，没有任意URL或原始IPC。
- 系统加密 App Secret，密文固定 App ID 和不可覆盖的引用；业务快照/SQLite仅持有引用。轮换产生新引用，旧密文不改写，App ID改变不能读取原应用密钥。
- 绑定采用共享内核命令、版本CAS和幂等回执。保存不会自动连接；启用后仍需显式连接，状态由内核实际SDK连接返回。建立长连接不等于权限和所有者已经验证。
- Agent-Team负责认证长连接、新式卡片、所有者/双方租户/会话/应用及绑定版本验证、请求版本与摘要、共享决定事务和持久通知游标。桌面不另建业务库或任务状态机。
- 首次卡片正文和uuid在网络前持久化，不确定时在55分钟保守窗口内按同正文/uuid重试，再更新最新状态；超过期限保留待确认，其他任务继续投递。当前完整日志和交付验收仍在桌面。

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
pnpm package
```

设置 `WEFTPILOT_PACKAGED_EXE` 为实际生成EXE，再执行 `pnpm test:e2e` 验证本机安装目录。`tests/e2e/feishu-binding.test.ts` 默认启用，使用合成 App ID/secret 测试实际 safeStorage、业务协议、重启与拒绝路径；**不会连接合成应用，不模拟真实飞书成功**。

真实 CLI 人工处理仍可设置 `WEFTPILOT_REAL_HUMAN=1` 运行 `tests/e2e/human-workflow.test.ts`，可能消耗现有CLI账户额度；不读取或复制登录文件。

## 已执行结果与失败记录

- Agent-Team strict/lint/format、完整编译、内核声明和bundle通过。83/83默认测试通过；新增项包括合成渠道共享用例、重复事件、非所有者/旧绑定、未知网络固定重发与补齐、超期停止盲发、schema5一致备份。端口测试不等于真实租户。
- 固定干净提交重建产物与桌面锁定tarball及文件摘要一致；生成protocol实际按browser平台编译，生成kernel实际导入后才完成内核构建。
- 桌面strict/lint/format和10/10单测通过。实际Windows EXE默认E2E四项通过、七项真实CLI用例显式跳过。修复后的绑定专项实际EXE再次1/1通过，含非法AppID稳定中文提示、跨应用密钥拒绝、轮换与重启。
- 0.4.3首次打包启动失败：SDK版本探测使用CJS目录变量。源码通过没有覆盖该问题，三项默认E2E超时，没有作为通过记录。0.4.4添加可移动SDK元信息路径和实际生成物导入检查后，纯Node及真实Electron/EXE启动通过。三个失败启动探针核对为本仓Electron且无其他后代后清理，旧M1停止现场不动。
- 独立Tester的合法绑定/三次轮换/不可覆盖密文、英文、系统主题和700px检查通过，发现非法ID暴露原始Zod/IPC包装；已改稳定错误码、补字段格式说明和跨应用需新Secret提示，r2独立复验关闭。独立Reviewer随后发现SDK HTTP实例缺正文解包P1，0.4.6修复后实际SDK token/消息/patch/响应头及WS本地TCP契约5/5复验通过，最终APPROVE；独立干净重建94文件摘要一致。0.4.6新EXE绑定专项和原生启动、桥接、退出专项均经独立Tester复验通过。
- 原生专项首次收尾删除测试EXE遇到EBUSY，按失败保留，没有推定为杀毒软件或产品故障。清理改为测试after钩子、限定临时目录并有限重试，保留测试主体错误；独立Tester再次运行1/1通过，Reviewer补审APPROVE。这不关闭历史M1进程停止128问题。
- 增强Claude协议指引后，父代理同一打包内核两轮真实人工闭环通过（75.9/80.6秒），独立Tester另一次37.0秒通过。保留0.4.2两次普通提问的P2历史限制，不以有限成功宣称模型绝对稳定。

## 真实外部条件与剩余工作

尚未提供专用飞书应用，未进行真实权限、卡片渲染/回调、重连、跨渠道竞争与重复/过期卡片验收。需要用户后续在本机表单输入App ID/Secret，并提供专用租户、所有者Open ID和通知Chat ID；不写入仓库。确切回调与接口依据见[官方API核验记录](feishu-api-verification.md)。没有验证通用自动创建应用API，因此只提供控制台辅助。

长期不确定消息的人工对账、更多飞书业务入口、macOS原生、跨仓CI凭据和历史Windows停止128仍未关闭。M3整体没有封板；按用户“记录阻塞继续开发”的授权，继续处理不依赖这些条件的技能、诊断、备份恢复及本机发行装配，并保留各项验收边界。
