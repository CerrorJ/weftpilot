# 方案确认与单次操作审批的真实续接补验

2026-10-31，Root在桌面`ded64b677604ee4f2b30520b286c71c66455b874`的Windows实际包补验。renderer SHA-256为`9995d6ebfae666a1075ff8bf4c47700d7fc1916c2f804277de1c2e939c38bc50`，其余资源与[技能恢复记录](skill-import-recovery.md)一致。固定内核仍为`73b4498966954b64b1d622ba50fb983a3e62ce2f / 0.13.1 / protocol1 / schema12 / 143文件 / d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`，没有修改业务源码或重打产物。

## 实际范围

使用本机已授权Codex登录及新建的合成Git仓库、项目和workspace-write角色，真实调用内核注册的`request_plan_review`与`request_approval`。这是桌面本机联调，不是飞书消息或跨渠道决定。模型仅获准在自己的隔离执行目录写一个随机内容文件，不提交、推送或变更其他目录。

两类请求分别核对：

- 真实进入waiting_approval，进程confirmed_ended；文件尚不存在且没有交付。工作台待我处理指向同一任务UUID。
- 正常完全退出并重启，权威请求全文不变，Run仍等待。版本加一的决定返回VERSION_CONFLICT，整个快照不变。
- 在界面显式确认方案或批准本次操作后成功；同一个Run、attempt1、同一角色配置快照及workspace-write权限，没有另建重试。实际文件按UTF-8读取并trim后匹配随机证明值，未证明首尾空白或逐字节一致。
- 执行结束后任务为in_review，已有delivery但没有关联acceptance。重复决定已处理请求返回HUMAN_REQUEST_NOT_PENDING，整个快照不变。
- 交付逐项确认前“验收通过”禁用。明确确认并验收后task才为done，按deliveryId关联恰好一条accepted记录，交付版本为1。

最终批次1项测试包含两类业务场景，**1P0F0S0取消、exit0、88736.7085ms**。三个自有应用周期通过原生菜单退出，日志均有quit及launcher exit0/signalnull。没有本轮完整PID+CreationDate登记，不据此扩大为独立的全进程树终态证明；未知历史现场未处理。

## 记录器修正与证据边界

先前批次同样走完界面并返回成功，但临时记录器误用不存在的Acceptance.runId，导致acceptances汇总为空，验收前断言也无效。原日志与JSON保留，不能据此证明持久化验收关系。修正为实际协议的deliveryId，补恰好一条accepted及验收前无记录断言后另跑上述批次，不用新结果改写原记录。

临时脚本也单独按严格tsconfig检查，移除不属于桥接Input的冗余type字段；未改产品契约。最终忽略目录证据`real-plan-operation-final-result.json`保存两类pending/restored/finished/accepted完整合成快照，166800字节，SHA-256 `f91e78aeb03e5faaed5586e3e33ab6e2d337ef994829055abbf86292a2c13cc7`。Root另行读取再核请求不变、角色快照不变、验收前无记录/之后恰一条及task done。汇总字段exactFileContent只能按实际trim断言理解；该命名偏强，不把它当逐字节证明。原始文件包含本机合成执行路径，只留忽略目录，不提交公开仓库。

两张最终等待态图片由Root实际查看，但滚动位置只显示请求区域顶部，不用它们证明下方审批按钮或完整表单。实际按钮动作、拒绝结果与状态以自动化断言和完整快照为证。此段是Root补测，尚未声称独立Tester重跑真实模型。

随后独立Tester只读核脚本、原/最终记录、完整阶段关系和最终UTF-16日志，确认1P0F0S0取消及三次正常quit/launcher0；没有新调用模型或GUI。独立Reviewer也已只读核相同关系，正式补审结论与技能恢复CI一并记录。最终日志3136字节、SHA-256 `43afd758f98cdbc0f3b3e7f8789fe101f6e0ae1d402b9edf6336d69e332a4523`，不把读取转码后的文本摘要当原文件摘要。

## 手工复现

按锁定Node24.18/pnpm12.3.4冻结安装、`pnpm kernel:assemble`、`pnpm build`及`pnpm package`。以新测试目录启动自己的包，创建项目、workspace-write角色并完成真实试运行。不要复制登录文件或使用生产数据。

创建第一个任务，目标要求先调用`request_plan_review`，参数title为合成任务名、summary说明“只有所有者确认后才在隔离工作目录写plan-approval-proof.txt，内容为本轮随机证明值”；工具返回后立即结束当前段。第二个任务改用`request_approval`，声明唯一文件、影响及删除该文件的回滚方案、timeoutSeconds为600。两者都明确禁止提前写文件、网络、Git提交和推送。

等待后退出并重启，核对待处理任务、请求与Run；显式确认后核对文件内容、同Run且无权限扩大。此时只应有待验收交付；逐项核对并人工验收后再验证task done及deliveryId对应acceptance。协议拒绝注入与完整快照比对使用测试桥接，普通用户流程不暴露这些实现细节。

未验证本轮Claude方案/操作、审批超时/撤销/并发注入、飞书竞争决定、Mac真实CLI或全部八页状态；既有单元覆盖和此前澄清验证不能替代这些补验。历史Windows未知停止、Mac Keychain、通知波动及原生发行仍见[待办入口](remaining-work.md)，M0—M4整体没有封板。

最终Reviewer随ded64 CI完成独立补审，APPROVE_VERIFIED_CI_LIMITED_SCOPE；对本文件及两类完整快照关系的结论仅为只读证据审核，未新运行GUI/模型。后续交接不得把此结论解释为Reviewer独立执行两条CLI流程。
