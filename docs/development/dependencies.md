# M0 工具链与依赖

本机验证：Windows x64，Node 24.18.0，pnpm 12.3.4，Git 2.53.0。
Electron 42.0.0 的工具进程实际报告 Node 24.15.0。
Codex 0.163.0、Claude Code 2.1.308 已完成 Windows 桌面/打包真实执行、团队交接和人工处理增量验收；具体范围及失败证据见各阶段记录。
依赖版本与完整传递依赖锁在 package.json / pnpm-lock.yaml，CI 冻结安装。

| 依赖                                     | 用途、取舍                                                                | 许可         |
| ---------------------------------------- | ------------------------------------------------------------------------- | ------------ |
| Electron 42.0.0                          | 已确认桌面壳，内置 Node、Chromium、系统加密和工具进程；不另引进程宿主框架 | MIT          |
| React / React DOM 19.2.4                 | 已确认界面；替代直接 DOM 操作                                             | MIT          |
| esbuild 0.27.4                           | TS/React 与内核产物 bundle，暂不需要 Vite 开发服务器                      | MIT          |
| Zod 4.4.3                                | 消费内核运行时契约，保持与内核相同版本                                    | MIT          |
| TypeScript 5.9.3                         | strict 类型检查，选择与 typescript-eslint 8.57.1 兼容版本                 | Apache-2.0   |
| ESLint 10.0.3 / typescript-eslint 8.57.1 | 可读性、复杂度、函数与文件上限；另检查物理行                              | MIT          |
| Prettier 3.9.6                           | 格式统一                                                                  | MIT          |
| Playwright 1.58.2                        | 真实 Electron 跨进程验收；默认测试不调用付费模型                          | Apache-2.0   |
| tsx 4.23.1                               | 运行测试 TS；发行运行时不依赖它                                           | MIT          |
| @electron/packager 19.0.3                | 本机平台应用目录装配；M4 再完善安装器与更新                               | BSD-2-Clause |
| @types/node / react / react-dom          | 编译期类型声明                                                            | MIT          |

内核包来自用户指定的 Agent-Team 固定提交，package.json 声明 ISC；Zod MIT。
原始内核 bundle 保留第三方许可注释，并附带 THIRD-PARTY-NOTICES.txt。
M3内核还包含锁定MCP SDK 1.30.0、飞书SDK 1.71.1与隔离HTTP实例axios 1.18.1，均按实际bundle依赖图保存完整许可；SDK HTTP需返回正文并保留headers特例，不把裸Axios对象当作等价契约。
纬舟自身许可证仍由所有者决定，本轮没有新授予开源许可。

SQLite 使用 Node 内建 node:sqlite，在真实 Electron 工具进程中验证；不引入需重编译 ABI 的 SQLite 扩展。
系统凭据使用 Electron safeStorage，Windows 可用性已测，macOS Keychain 仍待原生验证。
托盘 PNG 为 assets/brand/mark-mono.svg 原创几何路径的 40px 栅格化副本，不含第三方素材。
