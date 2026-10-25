# 原生菜单退出与测试响应竞态

草稿客户端`c3030fb98ab40f5719f26fc06e0988845bb0f7b9`的[CI 40172942235](https://github.com/CerrorJ/weftpilot/actions/runs/40172942235)macOS开发应用失败：37单元/6装配通过，52个Electron用例为35通过、1失败、16跳过。失败位于恢复期间完全退出用例的`application.evaluate(MenuQuit)`，错误为`Execution context was destroyed, most likely because of a navigation.`。该次没有运行后续实际包/安装器步骤，不继承4fdd双平台成功或将本轮记为Keychain失败。

栈位置支持“主进程先退出、evaluate响应未送达”的测试传输竞态假设；该次未执行后续恢复证据，不能仅凭错误字符串宣称正常退出或排除产品异常。源/日志均保留，不以盲目重跑将失败覆盖。

修正限定测试代码：原生Quit前监听应用关闭与所持ChildProcess的真实exit，核对菜单项存在；只允许上述精确类型的evaluate上下文销毁继续等待，必须同时观察应用close和实际exitCode=0才成功。其他RPC异常仍抛，非0/信号退出失败；只断开上下文而应用仍存活不会被当作成功。没有增加固定sleep、延长业务超时、调用app.exit或强杀，也不改产品的退出/恢复逻辑。

恢复期间退出改复用此helper，仍检查新slot生效、新内核最后事件kernel.stopped、instance.sqlite可独占、重启后项目与slot保持。Windows实际包两项定向及完整52项（36通过16明确跳过、0失败/取消、退出0）通过。新增6条可持续的受控传输回归后，43单元/6装配、strict/lint/格式均通过。原c303的Windows CI本身成功，开发及实际包36通过16跳过、未签名NSIS装配通过，与Mac失败分别保留。

独立Tester最终PASS，分开验证：实际Windows备份2/2；受控helper端口6/6，覆盖上下文错误但应用仍活、单独close或exit0不够、非0/信号退出、其他RPC及非Error字符串不误认成功；另实际Electron调用原生菜单后人为丢弃响应1/1，真实exit0、主PID消失、kernel.stopped且instance锁可独占。该探针首次关闭后重新取失效Playwright句柄报错，修正为提前持有所属child后仅重跑探针通过；未修改产品或将辅助错误写成产品失败。独立Reviewer最终APPROVE，无新增P0—P3，尚没有修正后的macOS结论，更不关闭Keychain根因、用户设备升级或旧停止不确定现场。

复现：按README构建实际包，指定`WEFTPILOT_PACKAGED_EXE`后运行`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/backup-workflow.test.ts`。完整默认Electron回归不调用付费模型。独立受控传输边界的结果应与真实原生窗口/进程结果分别记录。
