# M4 安装器与更新装配（开发中）

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

## 验证状态

两项装配策略测试已通过，strict/lint/format检查通过。CI已接入本机未签名验收安装器装配，但远端CI仍缺跨仓读取凭证，不能称远端已通过。
首次实际NSIS安装可完成，但启动失败：builder主目录默认过滤d.ts，遗漏锁定产物类型文件。首次V1/V2及失败合成数据保留，不能用安装成功掩盖启动失败。修复采用独立dist FileSet、仅复制锁定内核文件、afterPack校验实际集合/摘要，并新增遗漏/损坏/多余文件负例，三项策略测试通过；新实际包待重建。
图标生成也曾遇到隐藏窗口首帧UnknownVizError，改用canvas等待SVG解码后生成；构建浏览器userData限定到独立暂存目录，原创1024px图标已实际检查。
实际NSIS构建、隔离安装/启动/升级/卸载、运行中拒绝检查、原生凭据及跨进程验收正在进行，未先记通过。
macOS原生设备未提供；DMG配置或跨编译成功不能替代原生安装、Keychain、退出和更新验收。
纬舟自身公开发行许可证仍待所有者决定，本轮不擅自授予开源许可。
