# 设置：角色连接、通知与后台

2026-10-30，`feat/settings-notifications`承接ab82及f017ece工作台CI事实记录。固定设计`product-design/c29c2f5fcbd68836d0dd0055b5ace4b2fa1f1880`；沿用中英文、浅色/深色/跟随系统。新增能力为桌面系统桥接，不建立任务数据库或第二套执行状态。

## 实际功能

当前桌面实现提交`6b35cbb3a48d8defdf4d343cc912b2fceda179e1`已推送，Agent-Team仅关联文档`09bb77516c9fa804e7d2cb8e3aa85415aa5a3543`已推送，运行内核仍为下文73固定产物。[CI40994207392](https://github.com/CerrorJ/weftpilot/actions/runs/40994207392) attempt1两平台SUCCESS，独立官方证据核验及Reviewer补审APPROVE。**Mac原生测试通知实际failed，CI成功不等于显示成功**；下文过程时点与最终结果分开。

飞书分类按角色最新配置版本展示；“未接入”“继承工作空间”“已保存配置”与真实连接状态分开。用户展开一个角色后才查询原角色渠道状态，连接/断开仍调用Agent-Team同一用例，不自动授权或连接。配置入口携带确切角色UUID进入原六步表单；旧工作空间飞书表单保留在折叠区。真实租户成功联调仍待独立测试应用，不把未连接角色的界面验收当飞书成功。

角色草稿继续使用当前窗口sessionStorage，配置/市场往返保持确切角色或新草稿身份。存储被拒绝或配额失败时，保留已校验的非敏感输入到本窗口内存，并明确提示重载/退出后不能恢复；失败删除保留tombstone，避免旧草稿复活。恢复存储后显式保存可重试。角色版本、既有Run快照和凭据存储未改写。

“通知与后台”提供总开关及澄清/审批、待验收、执行失败三类偏好，默认总开关关闭。主进程每两秒查询实际内核快照，观察当前Run的待办；试运行、旧Run/旧审批、已验收交付排除。首启、恢复、内核客户端切换或断线重连先建立基线，不重放历史；关闭开关期间仍观察，重新打开不补发历史。仅内存去重，每轮同类至多一条，不承担业务消息可靠投递或跨重启通知历史。

原生通知只有固定中英文文案，不包含任务正文、标题、目录、凭据或原始异常。保留有限原生对象，点击意图只包含任务UUID，使用已有Task详情入口，不批准/验收。preload保留挂载前的最新一条意图；严格来源检查拒绝另一渲染窗口，即使其加载相同URL及preload。

偏好保存到专用版本化JSON，主进程CAS及同目录临时文件写入/fsync/替换；拒绝损坏、过大、非普通文件，读失败不覆盖旧文件。轮询不替换未保存输入；版本冲突保留输入，用户明确重新载入才替换。测试通知先核对偏好可读再投递，避免无法回滚的系统副作用先发生。

API支持、观察状态、请求/系统show回执/失败分别显示；`shown`只是Electron原生事件，不证明用户看见横幅或点击。关闭窗口继续后台运行，完全退出先等内核确认进程结束，再停止观察并清理原生对象；停止失败不伪造已退出。Windows应用标识与正式/验证安装器现有身份一致，无系统权限改写或自动创建快捷方式。

## 锁定与本机验证

Agent-Team源码`73b4498966954b64b1d622ba50fb983a3e62ce2f`，版本`0.13.1 / protocol1 / schema12`，143正规文件；归档SHA-256 `d9ce0b501f1d025559a6888d882b6fb9db8b0335eee2d009f44111312d1a402d`。本增量不改内核源码/归档，装配仍从固定远端提交，无相邻目录依赖；原独立飞书入口不变。

Windows最终实际包四资源：

| 文件             | SHA-256                                                          |
| ---------------- | ---------------------------------------------------------------- |
| main.cjs         | 6ebe415a15358142751d3641a9045ff75a1dfecae82f882e3ed9a26758bfd4bc |
| preload.cjs      | 968e1aab87abc69341d9c2d142c22ffa6e7f2aa8f269a1c5c23b2e83561a5946 |
| renderer/app.js  | f2b050a4c777df49bd96219d0e0a69bcfa5f23e4d73813adfa53979baf43a26b |
| renderer/app.css | d496dc067a88f5b0c1d571eac0b24be56ba20f3dca173ca67d7710a2e180659d |

strict、lint/规模、69单元、8装配及格式检查通过。最终6ebe实际包完整默认78项61通过17明确跳过0失败0取消，exit0（250852.645ms）；此前429包相同计数另有完整日志，不混为同一包。随后新增真实通知opt-in，默认总数变79，新增项默认跳过；本段78结果不改写成79整轮。

Root新设置两个实际包专项通过，其中包含受控UUID意图打开确切任务；该控制信号导航未由独立Tester补测，不能当成OS点击。独立Tester必要GUI限定PASS，核39份相关源文件、143文件/四锁、资源摘要和八张新图；角色配置精确返回/内存草稿、偏好CAS/重启/坏文件保护、真实show回执、第二渲染来源拒绝通过。旧429完成主要GUI、新6ebe补主进程边界分开归属；六周期正常菜单退出exit0/null，原PID/CreationDate身份最终均缺席，不强杀。

Root另运行真实Codex专项1/1通过，43206ms：UI创建/激活角色、创建项目任务、确认真实预检后隐藏窗口；唯一业务Run真实写出约定文件、succeeded且进程confirmed_ended，经实际worker JSON IPC触发review通知show回执，窗口仍隐藏、Task待验收且0验收。不调用测试通知、不替换worker或系统通知API。独立Tester另用自己的fixture和同6ebe包补验1/1通过，41486ms/exit0；实际观察CLI子进程，正常退出后登记PID身份均缺席。仅关闭此真实review通知正例缺口，源码审查继续；OS横幅/真实点击、其他通知类型真实触发、macOS及新提交CI尚未验收。

Root同6ebe包另启真实workflow回归4/4通过，0跳过0失败0取消/exit0，154892ms：默认偏好/脏仓库保护、真实交付退回/新Run重试/人工验收、在途停止与完全退出等待进程结束、启动后立即停止竞争重复三次。每个实际进程均由原生菜单退出/launcher exit0；旧Windows unknown现场和停止根因仍保留，不用本轮成功改写历史。

过程失败保留：最初驱动误读preload属性修正为实际URL路径；存储拒绝测试先因驱动函数跨上下文转换失败，再暴露真实草稿丢失，均分别记录。修复后内存草稿往返通过。最后修复测试通知先投递后读坏配置的问题；真实Notification.show call-through探针验证坏偏好时调用数为0，不用替身成功。未删除失败证据。

独立Reviewer随后限定APPROVE，无未解决P级问题。另跑八项风险回归及双TS/lint/规模/格式，核39原源SHA及新增真实测试、143文件/四锁、四资源和独立真实通知补验；文档已将Root受控UUID导航与独立GUI范围分开。当前源码重新构建四资源仍逐SHA一致，未用后加注释冒认旧包来源。

提交后Reviewer通过git-show另核40项源/测试/CI，确切6b35与已审SHA一致，五文档结论保守准确，限定APPROVE维持。随后[八页独立审计](eight-page-validation.md)核心新对象流程通过，294源SHA/20图/快照与自然退出有独立补核；未验状态仍保留。

Root同包真实Codex→Claude团队专项1/1通过、exit0，101225ms，覆盖文件挑战、上游验收门控、贡献交接、父任务与重启。另从干净6b35构建独立validation身份的0.0.1/0.0.2未签名NSIS，两个release:verify均通过；真实安装/升级/卸载专项1/1通过、exit0，22957ms，运行中升级/卸载返回32且未改现有运行，正常退出后升级保留业务/加密凭据/中英文及明暗偏好，卸载保留数据。只针对本轮新建隔离身份，未接管其他安装；本轮未额外断言通知偏好跨升级，不扩写该项。

本机computer-use另作空fixture有界尝试，固定测试通知原生shown、窗口隐藏；没有取得可选系统通知浮层，窗口截图内容不属于测试应用而未采纳。未向其他窗口输入或改系统权限，原生菜单exit0后清理自己的fixture。OS横幅/真实点击仍待验，不拿API或DOM截图代替。

## 本提交原生CI与通知限制

确切6b35的Windows job123863424586、macOS job123863424279均SUCCESS。Win核心189通过、单元69/装配8；Mac核心179通过10平台跳过、单元69/装配7通过1平台跳过。两平台开发与实际包默认79项均61通过18明确跳过0失败0取消，新增两设置用例四种原生模式共八条成功记录；实际公共来源专项各1通过2CLI跳过，未签名NSIS和ARM64 DMG/ZIP装配通过。CI未调用真实模型或执行NSIS安装升级；本机专项另记。

独立CI Tester用官方run/jobs/artifacts元数据核确切head/attempt，六ZIP逐官方大小/摘要、CRC、安全路径/上限和逐文件字节核验，60张官方PNG（每平台26主图+4剪贴板）全部逐张查看。连接器临时断联后，Tester独立匿名官方元数据、Root正常Git身份仅内存从官方只读API下载原始日志/ZIP，跨域去Authorization、不保存凭据或签名URL；不将下载分工冒称全程独立下载。两份原始完整日志均独立核验。

| 官方artifact                 | ID          | 字节    | SHA-256                                                          |
| ---------------------------- | ----------- | ------- | ---------------------------------------------------------------- |
| requirement-ui-Windows       | 12951235773 | 1430005 | 3509e6f97c1a2244f53b9d1b83fb013febd2bb5729c7eb180260d78d84b58c56 |
| requirement-ui-macOS         | 12950499966 | 2075832 | 5e0db03190695d15d48de083e9571b637827b18ffca4884e213cf5a9e082f711 |
| project-clipboard-ui-Windows | 12950783258 | 234768  | ef3aee04aa55771554de182806eb4c65c3a226a738fb30366afc4045bebea4d1 |
| project-clipboard-ui-macOS   | 12951076998 | 322102  | 1f15a1546520226796d3808f7f78d8d5afd613a25d9bc9adebfd130737003a45 |
| native-notification-Windows  | 12950882930 | 374     | 33e6e6d217ed2aae95d56d199240e4b821798899c2936030b04a0c44e71c2e31 |
| native-notification-macOS    | 12950699119 | 376     | f2acdcdac5f7bb17fd2e8a052f5206acfa1d489a9b4c29eecc00aafa2e0a24a6 |

两份原生JSON均packaged=true/supported=true/watching，属于显式测试通知。Windows最终test.shown，Mac最终test.failed；截图拍于较早requested，不能拿截图替代后续系统反馈，更不能当OS横幅。Mac本轮通知显示失败是实际观察，不标成未发生；Mac备份开发和实际包均通过仅为未复现历史Keychain失败，不关闭其根因。

Reviewer另从匿名官方API核run/jobs/artifacts，对原始日志计数、六ZIP官方摘要/CRC、60PNG逐摘要和两JSON独立补审APPROVE；仅另看两张代表图，60图全看归Tester。连接器故障与只读下载分工、Mac failed及无签名对照均如实保留，没有重跑换绿或把通知失败条件放宽成成功。

已核固定[Electron42通知API原文](https://github.com/electron/electron/blob/v42.0.0/docs/api/notification.md)及[平台说明](https://github.com/electron/electron/blob/v42.0.0/docs/tutorial/notifications.md)：macOS的UNNotification要求应用签名，未签名材料不满足此前置条件。本轮材料明确未签名，与failed一致；未做有签名对照，不据此声称唯一根因、已经修复或正式签名后必然成功。正式签名凭据、用户设备权限及横幅/点击仍需后续验证；不自行使用签名凭据或改变系统权限。可以先研究隔离、无凭据的开发签名对照，不把它当正式签名或发行验收。

## 复现与后续

使用固定Node24.18/pnpm12.3.4及自己的空测试目录。依次运行：

```sh
pnpm install --frozen-lockfile
pnpm kernel:assemble
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:packaging
pnpm package
pnpm exec tsx --tsconfig tsconfig.runtime.json --test --test-concurrency=1 tests/e2e/settings-runtime.test.ts
pnpm test:e2e
```

实际包验证显式设置`WEFTPILOT_PACKAGED_EXE`为本机新包；真实CLI专项另设`WEFTPILOT_REAL_NOTIFICATIONS=1`运行`tests/e2e/native-notification-cli.test.ts`，需要已有正常CLI授权并产生真实模型调用。默认CI不调用付费模型，保留两平台截图及有限字段的原生反馈JSON。CI结果须关联确切源码提交，不继承ab82绿色。

下一步为Mac通知前置条件对照及剩余状态/发行验证。真实飞书/自定义模型、Mac Keychain间歇失败、旧Windows未知进程现场、用户设备安装升级/通知显示、签名许可和更新渠道仍分别待验，M0—M4与整体原型不封板。
