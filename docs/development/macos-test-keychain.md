# macOS测试Keychain命名空间隔离（待原生验证）

从角色卡片`2cb75c12326ba740b50d943372e2b3c38500b487`创建独立`fix/macos-test-keychain-isolation`，不混入080 CLI客户端开发，内核仍锁070/e6c。其[原CI 40099809043](https://github.com/CerrorJ/weftpilot/actions/runs/40099809043)Windows成功；macOS开发通过、安装包装配成功，但实际包备份首个合成密钥保存`CREDENTIAL_STORAGE_UNAVAILABLE`，28通过1失败14跳过，根因仍未确认。

固定[Electron42.0.0源码](https://github.com/electron/electron/blob/v42.0.0/shell/browser/electron_browser_main_parts.cc)以应用名构成Keychain服务与账户名，userData目录不参与。开发与不同实际包虽隔离数据，仍可能接触同名系统条目；签名/权限关系见[官方说明](https://www.electronjs.org/docs/latest/api/safe-storage)。这是隔离试验的依据，不是原失败唯一根因的证明。

仅在macOS且显式设置`WEFTPILOT_TEST_DATA`时，在ready之前将运行时名称设为二进制路径和测试目录的稳定SHA-256派生名称。相同测试实例重启保持同名及密文，开发/打包路径和其他测试目录不共享条目；名称不输出原路径。没有测试目录时不改变名称，Windows安装器验证身份不改变。正式appId、产品名称/版本、安装包签名和加密API均未改动。

全部测试仍真实使用系统safeStorage和原加密断言，没有mock-keychain、跳过失败、删除既有条目、读取系统密码或回退明文。该验证仅用于合成数据的独立测试命名空间，不证明正式产品旧Keychain条目的更新兼容，更不代替Mac用户设备安装升级或稳定签名。

精确隔离依据是exe路径字符串和测试目录字符串，并未读取二进制内容或签名；同路径替换文件而保留同一测试目录时名称不变，不能称作所有构建或签名变化都自动隔离。

本机基础36单元/6装配、strict/lint/格式/构建通过；Windows实际包宿主/备份两项/飞书合成密文四项通过。独立Tester静态及Windows阶段通过，另行identity单元和四项实际包回归5/5，agent-browser核对真实窗口，系统加密可用且合成往返通过，Windows运行时名称保持`weftpilot`，070/e6c握手及菜单退出`kernel.stopped`、自有主PID已消失。独立范围不冒充Mac分支行为验证。

独立Reviewer最终APPROVE，仅覆盖源码和Windows限定范围，无P0—P3；独立类型/lint/规模/diff/格式及6项身份/密文单元通过，实际包main与built逐字节一致、070锁未变，Tester最终报告已复核。当前尚待macOS CI验证，不能标为已修复系统Keychain根因。后续若CI通过，只记录隔离后的测试结果；仍保留原失败与正式设备验证待办。
