# M4 安装器与更新装配（Windows限定范围已验收）

本增量在既有真实应用目录之上装配本机Windows NSIS，macOS预备DMG/ZIP配置。
electron-builder固定26.15.3（MIT），复用原创app-icon.svg生成平台图标。
当前只允许本机平台、干净桌面提交、固定内核锁及逐文件摘要匹配；不从相邻未提交内核源码打包。打包后的afterPack再次核对全部内核文件集合和SHA，不只验证打包前dist。
应用源码、内核版本/提交/协议/schema/产物SHA、安装器SHA及装配状态写入本地清单。
装配开始写preparing意图，只有生成真实安装器并核对摘要后才写release-manifest.json，不将半成品当作成功。

## 本地候选与验证身份

```powershell
pnpm install --frozen-lockfile
pnpm kernel:assemble
pnpm test:packaging
pnpm package:installer
pnpm release:verify <输出目录>
```

必须先提交当前源码。输出默认在忽略目录`.tmp/installers/<commit>-<uuid>`，已有目录拒绝覆盖。
可用`--output`指定一个全新位置。应用目录打包同样不覆盖，保留旧失败现场；有旧release时先构建，再用`node build/package-desktop.mjs <新目录>`。

安装/升级/卸载验证使用独立身份：

```powershell
pnpm package:installer --validation --validation-version 0.0.1
pnpm package:installer --validation --validation-version 0.0.2
```

验收安装器为`io.weftpilot.desktop.validation / WeftPilotValidation`，与正常产品的appId/程序名/注册项分开。
合成版本号只允许用于此身份；绝不以验收安装器覆盖现有正式应用。
Windows按用户安装、无需提权、不自动启动、不建桌面快捷方式，卸载保留用户数据。
安装与卸载的运行检查覆盖默认强杀逻辑：只定位程序，不发终止信号；存在或不能确定不存在时退出码32，要求从应用菜单完全退出后重试。
该宏依据固定版本构建模板及[nsProcess官方返回码](https://nsis.sourceforge.io/NsProcess_plugin)，未把普通窗口关闭当作退出证明。

## 更新边界

release-manifest.json是本地更新装配的版本、兼容性与摘要材料，不是签名信任源或已上线更新服务。
本轮没有公开更新地址/授权，构建明确`publish: never/null`；Windows关闭签名，macOS关闭签名身份与公证，子进程不继承签名、发布、模型或飞书秘密，不加载electron-builder.env。
当前不会下载、信任或自动安装未签名网络更新；生产签名、公证、公开更新渠道和公开发布仍列外部待办。
安装器升级须在应用确认完全退出后进行；业务schema迁移与备份由唯一内核完成，不在安装脚本写业务库。

`release:verify`严格校验清单格式、产品身份、平台/版本/文件名组合、唯一文件集合、普通文件类型、大小与实际流式SHA；拒绝路径穿越、符号链接、篡改、重复项和伪造签名状态。它不运行安装器，也不把摘要一致当作来源信任。清单保持`nativeValidation: pending`，原生验收结论另记本文，不能由构建脚本自证通过。

## 验证状态

三项装配策略测试、20项桌面单元测试、strict/lint/format检查已通过；默认原生E2E共9项通过、11项需显式环境开关而跳过，没有把跳过项算通过。CI已接入本机未签名验收安装器装配，但远端CI仍缺跨仓读取凭证，不能称远端已通过。
首次实际NSIS安装可完成，但启动失败：builder主目录默认过滤d.ts，遗漏锁定产物类型文件。首次V1/V2及失败合成数据保留，不能用安装成功掩盖启动失败。修复采用独立dist FileSet、仅复制锁定内核文件、afterPack校验实际集合/摘要，并新增遗漏/损坏/多余文件负例；新V4/V5实际包均已重建，全部115个内核文件核对通过。
随后发现builder从工作区暂存目录收集依赖会改写源树的pnpm管理器元数据。装配项目改到仓库外独立临时目录，只有已编译且锁定的应用内容，构建前后均检查同一干净提交，避免将源树改写视为正常发行输入。内核实际文件核对与安装后的启动仍分别验证。
图标生成也曾遇到隐藏窗口首帧UnknownVizError，改用canvas等待SVG解码后生成；构建浏览器userData限定到独立暂存目录，原创1024px图标已实际检查。
Windows真实NSIS验证身份闭环由开发者1/1（20.27秒）及独立Tester1/1（20.07秒）分别通过。独立Tester另用agent-browser重新安装V2实看诊断预览/导出、备份检查、英文深色700px、隐藏窗口继续查询及菜单完全退出。实际默认Roaming数据目录且未设置测试重定向；运行中升级/卸载均实际返回32，完全退出后升级/卸载返回0。升级后项目、角色、模型、系统密文及中英/明暗偏好保持；系统密文在当前用户下仍能解密。卸载后先断言默认业务库与密文保留，再核对随机owner标记和realpath，仅归档测试自己的数据。旧正式应用和失败现场未操作。

审查提出的测试保护建议已在`53b7e9f`固化：查询HKCU/HKLM及各WOW6432Node四处注册，遇其他位置或重复登记立即拒绝，查询错误不吞；创建profile前还检查同名验证进程。独立Tester重跑相同真实NSIS闭环1/1通过（19.73秒），前后四处登记、默认profile和验证进程均为空。未为负例写机器级注册表，其他位置拒绝分支仅做源码核对，不冒充故障注入实测。

测试修正也保留真实失败记录：NSIS卸载器自动复制后的父进程exit0不能代表子进程退出码，测试现在按[官方方法](https://nsis.sourceforge.io/Docs/AppendixD.html)复制到自有目录并以`_?=`取得真实32/0；Electron main-evaluate不能动态import文件系统的测试错误改为向真实safeStorage传入已读取的合成密文字节。未改变产品拒绝逻辑或放宽断言。

复现需先确认验证身份没有现存安装/数据；测试发现已有内容时拒绝接管：

```powershell
$env:WEFTPILOT_REAL_INSTALLER = '1'
$env:WEFTPILOT_INSTALLER_V1_MANIFEST = (Resolve-Path '<V1输出目录>/release-manifest.json').Path
$env:WEFTPILOT_INSTALLER_V2_MANIFEST = (Resolve-Path '<V2输出目录>/release-manifest.json').Path
pnpm exec tsx --tsconfig tsconfig.runtime.json --test tests/e2e/installer-workflow.test.ts
```

实际验证包源码提交`c954fc4d1f202e2c232cd3fbc74d3fb2cd7786e6`；V1安装器SHA为`3045b5319956edd401a6444a4a8352713e6b15a92bb7bc8a25fc0494fe5cc3fa`，V2为`e3bf78660d79cb7686e8b967c972c9f19640e2b44e33b467888c63e201ae1408`。内核`0.5.8 / 2d347d11bf5b0f1cb61cc26366cb65643d5678d1 / protocol1 / schema7`，tarball SHA为`1fe70425927e9d25369358c01dce9afd89f07feb2e504e08eadb8febc6a94f7f`。本机详细证据在`.tmp/evidence/m4-installer-tester-report.md`，原始截图/合成数据不入公开仓库，不能据本节宣称整体M4完成。

独立Reviewer最终APPROVE，无待修复P0/P1/P2；测试保护建议已关闭。Reviewer独立运行装配策略3/3、清单2/2、strict/lint、两份验证包及正式候选的清单校验，并逐一核对三个应用目录的115文件集合/SHA；未执行安装器或操作正式profile。报告在本机`.tmp/evidence/m4-installer-review-report.md`。本结论只覆盖Windows安装器、本地发行材料与测试保护增量。

正式身份本地未签名候选已从干净`bf856209b9a4cdbf28ae92fc8805fad9454c262c`构建，EXE SHA为`05a9c3487e0f972bd29da81f5337ac6c365cf01077d9539817fa0518306d0fb4`，`release:verify`通过。它的实际未安装应用目录在独立数据下运行默认原生E2E，9通过/11显式跳过；未将该安装器覆盖安装到既有正式环境。

尚未验收交互安装向导各页、管理员/多用户安装、正式appId已有数据的安装迁移；本轮仅验收当前用户的独立validation身份，不为验证而覆盖正式用户环境。后续统一入口见[发行交接](release-readiness.md)。
macOS原生设备未提供；DMG配置或跨编译成功不能替代原生安装、Keychain、退出和更新验收。
纬舟自身公开发行许可证仍待所有者决定，本轮不擅自授予开源许可。
