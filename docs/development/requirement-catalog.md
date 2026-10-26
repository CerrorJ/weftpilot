# 需求列表、详情与版本编辑

2026-10-26，`feat/requirement-catalog`从`44d4df6`继续，固定内核仍为`0.9.4 / 51f0b18d40cfb97371ae90178ca66762507aea6d / protocol1 / schema8`。131文件与tar SHA-256 `3670811868fc3672142b9f9bd494dc156637ddfe882e8be47237eafab6399d40`未变。本次没有新增桌面业务数据库或内核副本。

实际提交`ca46ce248ab4abbc7b80ff09836321734af7c4d4`已推送，Windows独立Tester PASS/Reviewer APPROVE、无新增P0—P3；[CI40271482336](https://github.com/CerrorJ/weftpilot/actions/runs/40271482336)双平台成功，各51单元、开发/实际包59项43通过16明确跳过、0失败/取消，需求新增用例两模式均实际执行。装配Win8/Mac7通过1平台跳过；锁定内核Win160/160、Mac150通过10平台跳过；未签名NSIS/ARM64 DMG/ZIP装配过。独立Tester/Reviewer随后补验确切提交/完整日志、两平台4张PNG、两ZIP官方digest/大小及逐PNG字节，一致后限定原生CI范围PASS/APPROVE。以下尚未提交/待CI为原时点；下一[需求创建关联任务](requirement-task-create.md)不继承此CI结果。

## 实际实现

按`product-design/c29c2f5`需求页恢复列表行、目标摘要、所属项目、关联任务数与新建弹窗；点击行打开详情，查看原文、验收标准和历史版本，关联任务打开同一全局任务详情。列表只投影每个需求最新版本，历史内容仍来自内核，不复制演示需求。

创建/编辑通过既有命名IPC调用内核`requirement.save`，只有严格回执成功才关闭表单。编辑基准在打开表单时固定：后台轮询或其他渠道保存不会覆盖用户输入、不会提高`expectedVersion`。冲突保留输入与明确错误；取消后重新打开，才能以当前版本重新编辑。修改产生新版本，旧需求、任务及Run引用不改写。

中英文、纸白/森林绿与深色沿用现有字体及主题。原生模态框支持Enter/Esc和焦点归还，内层编辑关闭不会关闭外层需求详情。正文/标题按用户原文呈现；窄窗口中的任务表使用既有内部横滚。

## 已执行验证

- 严格类型、lint/规模、格式、51单元、8装配检查通过。无新增依赖或协议变化。
- 新增实际窗口专项覆盖创建、其他渠道v2导致v1编辑冲突、草稿保留、重新打开v2后保存v3、历史v1不变、任务仍固定v1、关联任务跳转、英文深色700px与正常菜单退出；同时调整原产品对象回归到实际列表/弹窗交互，两个定向用例通过。
- 实际Windows包完整59项：41通过、18明确跳过、0失败、0取消。18项含本机剪贴板成功路径2项（系统访问受限已单独记录）及原16项模型/安装器等显式选择，不将其算作本次成功。
- 首轮两个定向用例因当前正文和隐藏历史存在相同文本而触发测试选择器歧义；保留原失败日志，随后精确限定当前正文，未删除历史或弱化版本断言。真实包核对131精确集合/逐文件SHA及内外锁。
- 首批中文浅色列表/英文深色700px详情已实际查看，没有新增视觉阻塞。独立Windows Tester限定增量PASS：创建拒绝获焦/输入保留、v1/v2冲突、三版历史、任务仍固定v1、嵌套Esc/归焦、精确任务跳转、700px表内实际横滚、重启恢复与28文件SHA保护通过；两次主验收正常菜单exit0/自有树空，实际包131集合/逐SHA/双锁一致。
- 独立辅助driver曾误读控制文件BOM而退出，其首次程序退出码未知；另有resize未等待、确认滚动后读取已dispose进程的辅助错误，均保留，不用后续主周期通过覆盖。Reviewer与本分支原生CI待完成；父44d的CI不包含本增量。

## 复现和未完成项

按README装配固定内核，`pnpm build`、`pnpm package`；设置`WEFTPILOT_PACKAGED_EXE`后运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/requirement-catalog.test.ts tests/e2e/product-catalog.test.ts`或`pnpm test:e2e`。完整检查使用`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`和`pnpm test:packaging`。

本增量没有伪造原型中的优先级、需求阶段或“转任务”成功；这些需要后续内核对象/用例及对应交互扩展。当前版本徽标只是已有真实版本，不替代业务阶段。需求页整体、团队页、角色飞书路由及完整原型/M0—M4验收均未因此完成。
