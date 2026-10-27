# 需求优先级与业务阶段

2026-10-27。按`product-design/c29c2f5`需求页及`openReq`接入低/中/高优先级和待澄清、待确认、方案已确认、实现中四个阶段，沿用现有列表/详情/版本编辑与中英文、明暗主题。

## 内核与版本边界

固定Agent-Team `969b548947b0bf6d0303f4a476130d7da0bf4452`，内核0.10.0 / protocol1 / schema9，握手能力`requirement-metadata`。132文件，产物`weftpilot-agent-team-kernel-0.10.0.tgz`，SHA-256 `1ebd0ff1b81afcbf12204e9de4358462c77ab1b0c493a37468c691152d5d8732`。先提交/推送内核，再从两份干净检出重建同一摘要并装配桌面，未覆盖094或引用相邻未提交源码。

字段与枚举、缺省/继承/null、CAS、事务、幂等及持久化都在Agent-Team。桌面从同一协议枚举生成选项，只提交命名`requirement.save`；没有第二份任务状态。需求阶段由所有者记录，不代表方案审批、任务执行、队列优先级或交付验收；修改生成新需求版本，已有Task和Run不改绑。

旧数据缺省显示“阶段未设置/优先级未设置”，编辑时保持未设置；不向历史补造默认值。新建表单明确显示中优先级和待澄清，用户保存才形成版本。选择未设置显式清除为null；旧渠道省略字段则由内核继承上版已有值。每个历史版本显示自己的属性，不借最新版本覆盖旧依据。编辑基准及选择不随后台新版本抬高，冲突保留输入。

schema9只提升旧内核读取门禁，不更新历史JSON；升级前留一致schema8备份。schema7/8/9归档只读预览，旧归档源字节不变，仅恢复副本启动后迁移。独立后端已用真实094构建/产物验证8→9、旧094拒9且数据库摘要不变、旧账本key重放、事件失败22表整体回滚、旧Task/受控Run/pending Human不变与7个子进程正常exit0；这些受控夹具不冒称模型执行。

## 当前实际验证

- 内核164项、strict/lint/格式、原独立服务及嵌入内核构建通过；独立Tester PASS、Reviewer APPROVE，无P0—P3。原飞书入口源码未切换或启动。
- 桌面strict/lint/规模/格式、51单元、8装配及构建通过，132实际包文件精确集合/逐SHA/内外锁核验一致。
- 新实际Windows包完整61项：45通过、16明确跳过、0失败/取消。新元数据专项覆盖旧值不补造、非法枚举真实拒绝、版本追加、并发冲突保留、显式清除、历史引用、没有Run/审批副作用、中英/明暗700px与重启。原需求目录/创建关联任务/产品对象专项也通过。
- 首轮元数据专项因选择器的原生嵌套label包含选项文本而超时，随后给两个select添加明确aria-label，保留原日志并实际通过；没有放宽断言或修改业务成功条件。首批两张页面图已实际查看，无新增视觉阻塞，英文长表单使用原生内部竖滚。
- 本轮两个真实Git地址复制/迟到回执用例也实际执行通过，先前本机error5未复现；没有修改系统权限、剪贴板实现或处理未知进程，不将其指定为0100修复或永久恢复。

桌面独立实际界面验收正在进行，本分支尚无新提交CI，不继承16e结论。完整M0—M4、原型八页、真实飞书和有效自定义模型服务、用户Mac安装/升级/真实CLI及签名仍未整体验收。

## 复现

在对应开发分支使用锁定Node/pnpm：`pnpm install --frozen-lockfile`、`pnpm kernel:assemble`、`pnpm dev`；构建`pnpm build`、`pnpm package`。实际包测试设置`WEFTPILOT_PACKAGED_EXE`，运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/requirement-metadata.test.ts`或完整`pnpm test:e2e`。常规检查为`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`。
