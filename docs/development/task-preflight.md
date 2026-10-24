# 任务执行前检查接入

2026-10-24，`feat/prototype-alignment`在角色六步`2c60652791cf7dfa9f073b738dc5dc33a78c2cc7`上继续接入。开发者检查、实际Windows包测试、独立浏览器Tester及Reviewer均已通过；整体原型及M4不因此验收。

## 两仓与产物

纬舟本增量已提交推送`9b53992762e29bfab5842bef39ccd51afaa51112`，对应下述Agent-Team固定提交。其[桌面CI 40092321957](https://github.com/CerrorJ/weftpilot/actions/runs/40092321957)Windows与macOS均通过：每平台28单元、6装配，开发及实际打包Electron各38项26通过/12显式跳过/0失败，NSIS与ARM64未签名DMG/ZIP装配成功。本次macOS没有复现此前060的Keychain错误；未修改凭据加密或跳过原失败断言，也没有证据认定历史根因已修复。用户设备安装升级、真实Mac CLI与签名仍未验收。

- Agent-Team：`feat/task-preflight`，已提交推送`e6c33e97e18859453b441fccaff63442cda07333`，内核0.7.0/协议1/schema8，新增`task-preflight`能力。独立内核Tester/Reviewer均通过；完整默认127项通过。
- 同一提交的两份干净检出重建：122文件逐一摘要一致，`weftpilot-agent-team-kernel-0.7.0.tgz` SHA-256均为`9d4bf5577f7a6e7c519e94ad43ad30ecc15bc3e7d28c290e84300d8acd29c911`。桌面`config/kernel-lock.json`显式更新，并由正常装配流程重新检出/构建/核对同一摘要。
- 没有引用相邻目录的未提交业务源码，没有修改原独立飞书入口、凭据、生产服务或旧停止异常现场。

## 实际行为

开始单任务、重试和开始团队任务先进入原型中的执行前检查弹窗。命名IPC `workflow.preflight`校验来源与输入，再调用唯一内核的只读`workspace.preflight`。显示真实角色版本、CLI/固定模型、技能引用、权限与并发，项目默认分支、当前分支/提交和执行基线，以及团队真实依赖。工作目录固定为内核支持的独立目录；没有加入尚不支持的共享目录选项或模拟脏文件开关。

打开、取消、Esc和重新检查都不创建Run。检查明确区分通过、阻塞、等待、未验证；发现CLI文件不等于登录、版本兼容或实际模型调用成功。技能引用元数据可用也不等于目录完整性已验证，实际准备仍核对摘要。执行分支和工作目录只在真实Run创建后显示，不提前制造UUID、分支或目录。

确认只提交原始目标/版本及内核`configurationFingerprint`。角色、任务或实际Git状态变化后，旧确认被内核拒绝；不静默改用新配置。用户须重新检查并确认。命令仍使用现有幂等账本，跨进程结果未知不假定成功；重试仍创建新Run，审批续接保持原Run。新运行成功后进入待验收，不自动写验收通过。

弹窗沿用原型920px布局、成员/代码基线区域、独立目录说明、检查列表及固定底部动作。长内容单独滚动；中英文和浅/深/跟随系统沿用已有偏好。Esc只关闭弹窗并返回原任务触发按钮，不关闭背后的任务详情。

## 可复现检查

使用仓库锁定的官方pnpm12.3.4：

```sh
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:packaging
pnpm build
pnpm test:e2e
```

单独执行默认预检窗口检查：`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/task-preflight.test.ts`。真实Codex专项在本机已安装并正常登录时，对该文件单独设置`WEFTPILOT_REAL_PREFLIGHT=1`；它创建自有临时项目，实际试运行并显式启用角色，再执行最小回答任务。不得将受控夹具、缺少登录时的跳过或失败称作真实成功。

实际包检查通过`WEFTPILOT_PACKAGED_EXE`指定新构建应用路径，测试同一文件及默认全套。`node build/package-desktop.mjs <新的输出目录>`只装配本机平台、拒绝覆盖已有目录；这不是安装器/签名/发行验收。

## 已执行结果与限制

开发者28项单元、6项装配、strict/lint/构建通过。Windows实际新包默认38项：26通过、12显式跳过、0失败、退出0。新预检文件单独启用真实Codex后3/3通过：一次真实角色试运行和业务Run；预检只读、旧Git基线`PREFLIGHT_CHANGED`且0业务Run、重查确认后执行成功/确认结束/待验收/0验收记录。没有把这次最小回答当作双CLI团队、停止竞争或人工审批全套重验。

首轮英文用例使用了不符合既有字典的触发选择器`Start real execution`而超时，修正测试为已有的`Start execution`后复验通过，没有改变产品文案来迁就测试。首轮日志保留。旧taskkill255/128不确定状态、原Claude完整超时、真实飞书新应用、macOS用户设备/钥匙串及发行签名仍保留各自原状态，见[外部待办](pending-external-validation.md)。截至本增量提交前，070远端CI尚无核对结论，不沿用旧版本全绿记录。

独立Tester在真实包中另行完成一次Codex角色试运行（17.921秒）及最小回答任务（9.730秒），均确认结束；实际分支/worktree/HEAD与重查后的基线一致，先取证待验收/0验收记录，再显式退回以测试重试入口。预检后外部角色v2变更也使旧确认返回`PREFLIGHT_CHANGED`，失败前后无业务Run和新回执；重查返回本版本角色未就绪。重试及团队父任务预检打开/取消不写业务状态。查询仍明确将CLI版本、认证和模型调用标记未验证，未借用历史试运行伪造本次检查成功。

首轮视觉批量对照后修复了通用DL样式撑高摘要、阻塞原因不可见及关闭按钮；最后宽中文浅色/700px英文深色确认通过，不继续美容。复核发现P2：X/footer取消将焦点落body；修复为记录来源、先原生关闭再归还焦点，并防关闭回调重入。最新新目录包完整38项仍26通过12跳过，独立Tester三条关闭路径实际均回到Start execution，抽屉保留、快照不变。P3英文Git地址遗漏已补，实际英文DOM确认为Git URL；补充Skills/Task dependencies映射没有扩大为阻塞态中的成员实测。独立自有实例均菜单正常退出、kernel.stopped、无剩余记录PID，旧异常现场未触碰。

独立Reviewer最终APPROVE，无待修P0—P3；独立核对装配目录和实际包内各122文件、manifest/元数据与tar摘要一致，另行类型、全仓lint/规模、3项单元及6项装配检查通过。新增关闭焦点循环曾使测试回调复杂度达到11，已保留断言并提取具名helper，未提高阈值；根与Reviewer全仓lint复验通过，实际包双语专项2通过/1明确跳过，首轮质量失败记录保留。

真实排队/未知状态的桌面窗口、已安装技能和固定模型profile的预检成员展示、Claude、飞书及macOS未在该独立窗口专项实测；内核受控协议已分别验证等待/未知、模型/需求引用等边界，但不把它们写成桌面真实执行证据。下一步继续Run历史/验收布局与角色卡片、CLI分项检测、飞书角色路由。
