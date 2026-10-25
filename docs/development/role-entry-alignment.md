# 角色页入口对齐

后续[草稿入口](role-draft-entry.md)已补回原型Continue与空白Create并存，分别保护多份表单；本机独立Tester/Reviewer通过。本文件下方缺口为7420当时归属，持久跨应用草稿、角色飞书路由与整体设计仍未封板。

提交后核对：桌面`7420a2d1c84e604f5efece845b85fe7b7613a54d`固定080/3b1。[CI 40104044202](https://github.com/CerrorJ/weftpilot/actions/runs/40104044202)由独立Tester只读核对，双平台成功；各36单元/6装配、开发和实际包均47项32通过15跳过，NSIS及ARM64未签名DMG/ZIP装配通过。本次Keychain未复现，历史及b2隔离失败仍未关闭，不等于正式Mac用户设备、旧密文升级、签名或真实CLI/模型验收。

从已提交推送的`fa30eb8f43514b80eb289acd30d7a20d895469ed`继续对齐固定`product-design/c29c2f5`的`renderRoles`。保留真实角色卡片和运行设置；移除原型没有的快捷角色下拉及重复全局编辑按钮，直接点击目标卡片进入其确切配置，页头保留新建入口，并补回原型的`ROLES / CAPABILITIES`和原创加号笔画。该页头来自用户指定原型，不另行改造视觉体系。

草稿与CAS、试运行/启用、版本冻结仍复用既有实现，没有新业务对象或状态库。新建当前仍优先保护既有未提交new草稿；原型独立“继续角色草稿”入口与全新草稿并存的交互还需在不丢稿的前提下补齐，不将本增量称完整角色设计封板。

内核保持080/`3b1c8b65fb93cb20e14a2b290f485ae91fecd3a2`/p1/schema8、126文件及tar摘要。strict/lint/规模/格式、36单元/6装配及构建通过；Windows实际新目录包完整47项32通过、15明确跳过、0失败、退出0。新入口及中英标识冲突专项3/3通过。

首轮遗漏共用configure及若干用例仍等待已移除role option，导致开发专项3项均超时，首实际包47项6通过/21失败/5取消/15跳过，退出1；原始日志保留。修正测试入口与等待，按可见卡片确切名称/版本确认新投影，模型/需求/团队下拉原断言未改；没有恢复多余产品控件、放宽版本断言或强制点击。修正后完整实际包通过，未将前轮取消写成正常退出或通过。

独立Tester最终PASS：实际Windows包两个逻辑角色A1/B2分别打开确切配置，Cancel/Esc回对应卡片，空new入口不误选现有角色且不写版本；市场草稿保留，外部B3出现后旧base2保存`VERSION_CONFLICT`，原版本不被覆盖。已有new草稿仍优先保护，renderer reload后保留，未扩写为应用重启验证。运行设置及CLI页仍可见，首两张宽中文浅色/700px英文深色无阻塞，不另做样式修正。12项独立证据断言通过；自有菜单退出0、`kernel.stopped`、pageerrors空，已知自有进程树和命名session闭合。没有CLI或模型调用。

独立Reviewer最终APPROVE，无P0—P3；独立类型/lint/规模/diff、9项相关单元通过，最终包126文件/锁/manifest/tar逐项匹配，并复核Tester最终文字及12项断言。此增量尚无远端CI或新正式身份安装器结论，不继承fa30或早前CI；原型独立Continue与fresh并存、飞书角色路由等仍保留后续工作。

复现`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`、`pnpm build`，在新目录打包后指定`WEFTPILOT_PACKAGED_EXE`运行`pnpm test:e2e`；定向为`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/role-entry.test.ts tests/e2e/role-wizard-errors.test.ts`。
