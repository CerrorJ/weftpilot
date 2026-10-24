# macOS CI凭据可用性调查

2026-10-24，角色卡片`2cb75c1`的[实际包失败](https://github.com/CerrorJ/weftpilot/actions/runs/40099809043/job/120889450160)保留。35单元/6装配、开发应用和DMG/ZIP装配成功，实际包备份首个模型合成密钥保存返回`CREDENTIAL_STORAGE_UNAVAILABLE`；其余实际包用例28通过、14跳过。此前`18465bd`同类双平台检查曾通过，不能据此关闭偶发问题。

本仓`ModelVault.assertAvailable`在`safeStorage.isEncryptionAvailable()`为false时产生该错误，尚未进入本次密文文件发布。现有日志不足以证明为什么系统不可用；不将其直接归因于080内核、角色卡片、SQLite或唯一的系统竞争。

已核对固定[Electron42.0.0 safeStorage源码](https://github.com/electron/electron/blob/v42.0.0/shell/browser/api/electron_api_safe_storage.cc)：同步可用性在app ready后交给OSCrypt。固定[Electron42启动源码](https://github.com/electron/electron/blob/v42.0.0/shell/browser/electron_browser_main_parts.cc)在macOS用应用名称构成Keychain服务与账户名，未加入userData目录。因此单独userData并不隔离相同应用名称的系统条目。此前将实际包测试串行化没有消除失败，这一事实仍保留。

[Electron官方说明](https://www.electronjs.org/docs/latest/api/safe-storage)确认macOS Keychain访问可能需要交互。签名或不同构建的系统识别是否参与本次失败，仍是待原生证据验证的推测，不将它归为本次唯一根因或固定42接口已经证明的行为。正式签名凭据、Mac用户设备权限提示及升级仍未获得本机验证；没有使用签名凭据、修改用户Keychain、关闭系统加密、切换同步/异步接口或把失败降为跳过。

已在独立分支提交推送测试身份隔离`b2d13e2cc68c1ec19b02f337a8d069ab3d778302`：仅darwin且显式测试目录下，以程序路径字符串和测试目录字符串派生稳定测试名；未变更正式名称、Windows身份或加密API。源码/Windows限定范围独立Tester及Reviewer通过，macOS CI尚待核对。该分支仍锁070，不自动合并进080客户端工作区；同路径替换二进制并不会改变派生名，不能称所有签名变化都隔离。即使CI通过，也不等于正式应用已有Keychain条目的升级或根因关闭。

独立Tester已核对隔离分支[CI 40101800458](https://github.com/CerrorJ/weftpilot/actions/runs/40101800458)：Windows成功（开发/实际包各29通过14跳过）；macOS开发同样通过，但实际包26通过3失败14跳过。备份和诊断的模型合成密钥保存分别返回`CREDENTIAL_STORAGE_UNAVAILABLE`，另一个catalog选项等待超时；第三项没有日志证明同属加密根因。36单元/6装配与NSIS/DMG/ZIP装配均成功，不等于原生安装验收。**测试身份隔离没有解决Mac目标失败**；不将其合入080客户端或写成根因修复，不重跑直到绿色，原分支与原始失败均保留。

后续需要进一步取得原生系统可用性证据；不能从公开日志输出系统密钥、账户、完整环境或Keychain内容。调查暂不阻塞无凭据依赖的CLI检查与界面开发。

随后未包含该隔离代码的080客户端`fa30eb8`[CI 40102151584](https://github.com/CerrorJ/weftpilot/actions/runs/40102151584)双平台成功，各实际包31通过15跳过。本次未复现与隔离分支仍失败并存，不证明隔离有效，也不证明根因永久消失；不把一次全绿当系统修复。
