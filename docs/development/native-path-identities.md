# 原生路径身份修复与 0.9.4 接入

2026-10-26。两仓在 `fix/native-path-identities` 维护此修复，没有合并或发布。项目页代码 `de97647223eba89918b282bb8ff169b28b589d0d` 已推送。[CI 40191016267](https://github.com/CerrorJ/weftpilot/actions/runs/40191016267) 两平台均停在锁定 0.9.2 内核回归：Windows 117 通过 / 40 失败，macOS 139 通过 / 9 失败 / 9 跳过；没有进入桌面检查和应用验收。保留原日志，不把失败归为 Keychain，产物重建一致不等于应用验收。

## 修复与固定关联

真实 Windows 8.3 探针证明普通 `realpathSync` 保留短名，而 Git 返回长路径，同一仓库因而被拒。内核将 Git 根、工作区、备份和技能的物理身份解析统一为 `realpathSync.native`，不回写历史 Project/Run 路径。临时夹具规范化创建路径并固定清理父目录，覆盖 macOS `/var` 别名，不放宽业务保护。桌面装配同步使用 native 身份，仍拒绝向上发现父仓、损坏 HEAD 和未提交改动。

独立 Tester 发现恢复源短名与目标长名的包含关系可绕过。修复后先执行原备份根链接、schema 和文件检查，再解析物理源路径、拒绝其内部目标，最后复制。独立正反向恢复、源字节不变、根 junction 拒绝和历史快照复验通过，原失败库与目录保留。

| 项目                 | 值                                                                     |
| -------------------- | ---------------------------------------------------------------------- |
| 内核源码             | `51f0b18d40cfb97371ae90178ca66762507aea6d`，已推送                     |
| 内核 / 协议 / schema | `0.9.4 / 1 / 8`                                                        |
| 产物                 | `weftpilot-agent-team-kernel-0.9.4.tgz`，131 文件                      |
| tar SHA-256          | `3670811868fc3672142b9f9bd494dc156637ddfe882e8be47237eafab6399d40`     |
| 桌面基准             | `de97647223eba89918b282bb8ff169b28b589d0d`，后续本分支更新锁与装配保护 |

原093来源`e3a061c67268661f0b386a18d559d7016de84479`与tar `a1fd42706439b231123bd09cbae89a188194629ac445d244fe052c57c9c96014`保留。桌面审查发现COM短名按UTF-8解码会在中文父目录误报ENOENT；两仓改以UTF-8 Base64信封传输，并用中文前缀夹具及native同根断言持续覆盖。未改变生产路径保护，递增094而不覆盖093。独立Tester中文长/短父TEMP下内核各3/3、桌面2/2零跳过；Reviewer再测中文父TEMP下8装配及中文8.3父下2专项均通过，P2关闭。

094从已提交源码和桌面隔离固定检出分别构建，tar摘要一致，远程标准装配直接成功。此前093远程获取TLS失败保留。实际Windows包使用已核对官方摘要的Electron42归档和标准packager；094首轮共享Temp模板rename遇EPERM，保留日志和原目录，改用全新独立临时装配目录后r2成功，未改生产打包策略。r2包131文件精确集合、逐文件摘要、内外锁一致。

## 本机验证及未关闭问题

- 内核真实 8.3 `TEMP/TMP/TMPDIR` 下 160/160；严格检查、原独立飞书服务和内核构建通过；独立 Tester PASS、Reviewer APPROVE。8.3 专项在非 Windows 或确实无短名的文件系统明确跳过。
- 093桌面strict、lint/规模、格式、44单元和8装配通过，隔离锁定内核160/160；独立Windows短DATA/仓库窗口10断言通过：新握手、旧092对象不变、真实Git、原文件/索引、正常退出及自有树为空。094真实短TEMP160/160及隔离锁定源码160/160、原服务/内核构建、strict/lint/格式、两仓定向验收与内核独立审查通过；新的桌面实际包、独立窗口/审查在进行中，不继承093结果。
- 独立旧数据的 3 个 Run 来自受控历史夹具，仅证明恢复和投影；此轮没有新模型执行，不将091 Codex/Claude证据扩写成093模型通过。
- 首次完整实际包为 **37 通过 / 1 取消 / 16 跳过**。项目卡片用例达到60秒，清理随后长时间未返回。只读检查有两个项目、一个任务、零Run，末事件 `kernel.stopped`，主进程及部分 Chromium 子进程仍残留；次日已不存在，退出原因未知。原数据/日志保留，**间歇性退出问题尚未定位或关闭**。
- 后续加入只读退出日志的单用例约4秒通过，同一包完整并发诊断轮 **38 通过 / 0 失败 / 0 取消 / 16 跳过**，约50秒。记录 `before-quit → window closed → will-quit → quit → debugger disconnect → child exit 0 → application close`。未提高时限、强制退出或放宽断言；诊断通过不代表原间歇性问题已修复。

忽略目录 `.tmp/evidence/` 保留 `native-path-locked-kernel.txt`、`native-path-test*.txt`、`native-path-packaged-full.txt`（原取消）、`native-path-hanging-state.json`、`native-path-quit-diagnostic-r1.txt`、`native-path-quit-full-instrumented.txt`、独立 Tester 报告和对应断言/包摘要。运行数据和机器绝对路径不入仓库。

## 复现与后续

094实际r2包的原始完整54项（非诊断副本）为38通过/0失败/0取消/16跳过，约50秒；仅开启Playwright的`pw:browser`控制侧日志，原用例及退出断言不变。最终44单元/8装配、strict/lint/规模/格式、锁定源码160/160及实际包摘要通过。独立窗口PASS、随后Reviewer最终APPROVE，无未关闭新增P0—P3。Reviewer另独立44/8、严格检查、131摘要/双lock/tar/exe核对通过；首轮REQUEST_CHANGES及P2关闭过程保留。原093取消没有据此关闭。

094独立实际窗口补验PASS：真实中文8.3 DATA和仓库入口、实际握手/摘要、创建唯一项目与真实Git clean、隐藏窗口继续查询，以及English/Dark重启持久化。两周期均原生菜单Quit、实际exit0/signalnull、kernel started/stopped成对、自有进程树为空，Run数0。报告`native-path-094-ui-independent-tester.md`与汇总JSON保留；探针文字等待和UTF16LE快照读取辅助错误分别记录，没有改写产品状态或假成功。桌面最终审查报告为`native-path-ui-independent-review.md`。

使用锁定 Node、官方 pnpm 12.3.4，按 README 执行 `pnpm kernel:assemble`、`pnpm --dir .kernel/source test`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm test:packaging`、`pnpm package`、`pnpm test:e2e`。再将 `WEFTPILOT_PACKAGED_EXE` 指向全新本平台程序并执行 `pnpm test:e2e`。真实CLI、模型和安装器用例须显式启用，跳过不算通过。

诊断副本复现原项目用例，增加测试控制侧生命周期/子进程退出日志并保留本轮自有目录；其余用例保持原文件，完整轮仍54项。没有修改产品包或生产日志；保持原生菜单、应用关闭和真实 exit0 三项要求，不以强杀、`app.exit` 或传输断线替代。

桌面接入提交、独立审查及新双平台CI另行补记，不继承旧green。本机不替代macOS原生运行；用户Mac安装/升级、真实CLI、飞书租户、有效提供方凭据、签名/公开发布保持待办。旧taskkill255/128、损坏缓存和恢复负例现场仍保留。项目原型差异继续开发，M0—M4整体未封板。
