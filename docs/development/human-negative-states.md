# 审批拒绝、到期与停止撤销补验

2026-11-02，从桌面`35577eff4fadfb08288c9339fe0195646f573381`继续。用户取消另行交接，保持原开发授权。本增量补负向状态的实际窗口验收，没有修改产品布局、内核业务源码、依赖或协议，不把受控执行端口称为真实CLI。

## 固定基线

Agent-Team继续锁定`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件`，归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。两仓边界与原独立飞书入口不变，不从文档HEAD重打内核。前一ded64的双平台结果见[技能恢复记录](skill-import-recovery.md)，不当作当前新测试已经在Mac执行。

## 验收内容与实现方式

新增`human-state-fixture.ts`通过公开createKernel/命令用例生成自己的Git仓库、项目、角色试运行和三个等待请求。受控execute仅返回试运行证明及等待请求；不执行真实CLI、模型或飞书，不直接SQL写入业务对象。fixture内核先正常关闭，再由实际桌面包自己的worker读取数据，所有决定/停止/持久化由原内核裁决。

新增`human-negative-states.test.ts`与只读视图helper覆盖：

- 方案拒绝：空白原因保持按钮禁用且完整快照不变；显式原因记录为rejected，Run以HUMAN_REQUEST_REJECTED失败，保留理由。
- 等待停止：从任务详情点“结束等待并停止”，请求cancelled、Run stopped/confirmed_ended。只证明停止已结束执行段的等待，不证明杀死活动CLI进程。
- 单次操作到期：使用协议真实最短60秒期限，等待系统时钟跨过expiresAt后点击批准；内核返回拒绝并持久化expired/HUMAN_REQUEST_EXPIRED。不改数据库期限、系统/页面时钟，不缩短产品超时。
- 旧请求再决定：三个已结束请求使用旧版本再提交，分别返回EXPIRED或NOT_PENDING，完整快照不变；不产生新Run、续接、业务交付或验收。
- 跨页与重启：拒绝/过期在工作台提醒失败，停止不再提醒；列表和看板按同UUID显示，全部在已结束列，未知步骤无假百分比。中文浅色与英文深色700均只读浏览，完整快照不变；正常重启后全文状态保留，默认待处理为空，历史三个v2记录无可操作按钮。

角色试运行自身有一份合法交付。本测试核对该完整交付数组前后不变，再明确按三个业务request.runId核无交付；不能把总数组非空误判成未经审批发生业务交付。重试按钮可以存在，不自动点击，也不把历史请求决定当作新Run重试。

原内核目前在新业务命令入口裁决到期，而非承诺快照轮询即持久化到期。本测试证明超时后点击也不能放行，不声称后台定时器已自动处理全部请求。未来如改变到期调度，须在Agent-Team实现并另验。

## 本机实际记录

Root使用此前已核的Windows实际9995 renderer包，四资源/内核身份沿[基线记录](skill-import-recovery.md)，没有为测试改产品。严格TS、lint/规模、格式及diff检查通过。

本轮另逐文件重新计算包内143份内核SHA，0不符，包内artifact-lock与仓库锁全文相等；main/preload/renderer/CSS四摘要也重新计算，与上述基线一致，结果留在忽略目录human-negative-package-verification.json。不是仅从旧报告继承包身份。

首轮0P1F/exit1，36400ms：驱动误找运行态“请求停止”，实际等待态按钮为“结束等待并停止”，产品已有正确入口。第二轮0P1F/exit1，62572ms：三种终态已成立，但驱动错误要求含试运行的总交付数为0。原日志和失败合成快照保留；修正定位及业务范围，不删除负向状态断言。

第三轮**1P0F0S0取消/exit0，64892.667ms**，含真实60秒等待、三个终态、旧请求拒绝、跨页和重启。两次自有应用均原生菜单quit、launcher exit0/signalnull；Root没有本轮完整PID+CreationDate树清单，不据此扩大为全部进程终态证明。

Root实际查看该轮两张截图，发现停在页面顶部，不能以它们证明下方请求内容。随后仅补截图前滚动至方案历史卡片、英文先Escape收起外观弹层；产品和业务断言未改变。第三轮通过归属截图修正前版本，最终取证版交由独立Tester及确切新CI核验，不把旧图冒充新图。

## 复现与后续范围

锁定Node24.18/pnpm12.3.4，`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm build`及`pnpm package`，用自己的新数据目录和应用包。设置WEFTPILOT_PACKAGED_EXE为实际可执行文件，再执行：

```sh
pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/human-negative-states.test.ts
```

该用例默认执行，约需一分钟，无真实CLI开关或新凭据；CI分别在开发态与本平台实际包运行，并上传human-negative两张PNG。诊断原始快照只留忽略目录，不提交公开仓库。

独立GUI、代码审查及新确切提交的两平台CI继续，尚未提前封板。不覆盖真实模型发起拒绝/到期、飞书并发决定、状态未知的活动进程、Mac用户设备安装升级或全部需求/团队非空状态；完整M0—M4与三类总体待办仍见[入口](remaining-work.md)。
