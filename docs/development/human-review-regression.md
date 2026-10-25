# 真实人工处理与显式交付验收补验

基于桌面`c3030fb98ab40f5719f26fc06e0988845bb0f7b9`，产物为固定090/fb313df/p1/schema8/127文件；本次只维护验收测试，不改产品、内核状态机或协议。人工处理的真实门控用例仍直接点击旧版Accept入口，在当前交付弹窗与逐项确认后已经不能作为正确验收路径。

统一交付helper支持真实中文/英文Review入口及弹窗名称；人工处理用例明确先断言Accept禁用，再逐项核对固定验收条件后提交。保留空回答无决定、等待态重启、同Run/attempt和配置快照、真实输出字节以及交付待验收/最终done断言，没有降低状态或扩大等待。既有英文受控交付用例改用同一helper，实际包两项通过、一项真实Codex交付明确跳过；strict/lint通过。

根代理在同一Windows实际包定向真实Codex人工处理1/1通过、退出0：来源真实trial启用，真实澄清等待且无文件/交付、进程已确认结束，正常退出重开仍pending；空决定不影响请求，显式唯一回答后同Run/attempt1续接、Role快照不变、answer.txt逐字匹配，任务先in_review，再经英文交付弹窗逐项核对后done并正常退出。此用例包含一条真实trial和业务同Run的两个执行片段，不是三条业务Run，也不证明飞书租户或停止竞争根因已解决。

独立Tester以实际包/agent-browser完成真实Claude完整路径，最终PASS、13项独立证据断言通过：角色v2真实trial68.38秒后显式启用，业务Run结构化等待且进程确认结束、无文件/交付；正常菜单退出/重启仍pending，未默认选择/空提交不决定。显式唯一OWNER回答后同Run/attempt1续接、角色快照不变、answer.txt为42bytes且与回答逐字节相同；业务succeeded/confirmed_ended，任务先in_review且无验收，再经英文Review初始禁用/勾选仍in_review/显式Accept后done，唯一accepted对应确切delivery。原测试Git保持clean、执行分支与记录一致。

首次自有文件控制器EBUSY异常退出，无kernel.stopped，准确保留辅助异常归属；只读发现同一trial实际已完成后用原data保留其证明继续，不重复CLI trial或把异常退出算正常。后续等待态和最终两次均正常菜单退出0、kernel.stopped、无pageerror、全部Run确认结束且自有树为空，命名session关闭。该轮是1trial及业务同Run两个执行片段，不是新增业务Run/重试，也不是飞书联调或凭据复制；未处理任何旧停止现场。

当前路径在090上的本机完整证明不追溯消除058历史120秒启用超时/普通提问未结构化的失败，其根因未被本轮确定。独立Reviewer最终APPROVE，无新增P0—P3；尚未提交、无本次测试维护CI结果，c303草稿CI另按该提交核对。

根代理另在相同实际包定向真实文件M1闭环1/1通过：真实trial后创建业务任务，文件交付待验收、退回保留原因、新Run重试且交付版本递增，最后逐项核对后done并正常退出。包含1个trial/2个业务Run，未重现本次对应路径的旧超时，但不把旧058失败根因写成已经修复。该结果发生在本次退出响应helper修正前，后续无模型默认回归单独核对新helper；[macOS恢复退出CI失败](native-quit-response.md)亦保留独立归属。

复现：按README装配固定产物并`pnpm build`，新目录实际包指定`WEFTPILOT_PACKAGED_EXE`。默认`pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/task-review.test.ts`验证两种语言受控路径；显式设置`WEFTPILOT_REAL_HUMAN=1`后，`pnpm exec tsx --tsconfig tsconfig.runtime.json --test --test-name-pattern '真实codex人工处理' tests/e2e/human-workflow.test.ts`执行真实CLI。去掉名称过滤会执行两种CLI；使用本机已授权登录，不复制凭据，不连接生产飞书或修改已有项目。
