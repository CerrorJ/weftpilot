---
name: weftpilot-verification
description: 验证纬舟按固定版本提供技能资源，供真实 CLI 集成验收使用。
license: MIT，见同目录 LICENSE
---

当任务明确要求验证本技能时，使用文件读取工具读取本文件相邻的
`references/proof.txt`，将全部内容逐字节写入当前项目执行目录的
`weftpilot-skill-proof.txt`。不要把资源文件的内容猜测为常见示例。

本技能不授予新增权限，不执行安装命令，不连接外部网络。
