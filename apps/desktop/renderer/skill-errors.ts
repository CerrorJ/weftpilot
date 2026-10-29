export const skillErrors: Record<string, [string, string]> = {
  SKILL_PATH_INVALID: [
    '技能包含不可移植路径、覆盖冲突或符号链接',
    'The skill contains an incompatible path, collision, or symlink.',
  ],
  SKILL_SOURCE_INVALID: [
    '技能来源、固定提交、目录或许可证不完整',
    'The source, pinned commit, directory, or license is invalid.',
  ],
  SKILL_METADATA_INVALID: [
    'SKILL.md元数据无效或与目录名称不符',
    'SKILL.md metadata is invalid or does not match its directory.',
  ],
  SKILL_SIZE_LIMIT: [
    '技能文件数量或大小超出安装上限',
    'The skill exceeds file count or size limits.',
  ],
  SKILL_DIGEST_MISMATCH: [
    '技能内容摘要不匹配，已阻止安装或执行',
    'Content digest mismatch. Installation or execution was blocked.',
  ],
  SKILL_DOWNLOAD_FAILED: [
    '技能下载未完成，可核对来源后重新导入',
    'Download did not complete. Check the source and import again.',
  ],
  SKILL_DOWNLOAD_NETWORK_FAILED: [
    '技能下载网络未完成，请检查连接后手动重新导入',
    'The network request did not complete. Check connectivity and import again manually.',
  ],
  SKILL_DOWNLOAD_TIMEOUT: [
    '技能下载超时，请稍后手动重新导入',
    'The skill download timed out. Import again manually later.',
  ],
  SKILL_DOWNLOAD_DNS_FAILED: [
    '无法解析技能源域名，请检查网络与DNS',
    'The skill source hostname could not be resolved. Check connectivity and DNS.',
  ],
  SKILL_DOWNLOAD_TLS_FAILED: [
    '技能源证书校验失败，请检查系统时间与可信证书，不要关闭TLS校验',
    'The source certificate could not be verified. Check the clock and trusted certificates; keep TLS verification enabled.',
  ],
  SKILL_DOWNLOAD_RATE_LIMITED: [
    '技能源请求被限流，请稍后手动重新导入；不会自动重试',
    'The skill source rate limit was reached. Import again manually later; there is no automatic retry.',
  ],
  SKILL_DOWNLOAD_FORBIDDEN: [
    '技能源拒绝访问；当前仅支持公开仓库',
    'Access to the source was denied. Only public repositories are supported.',
  ],
  SKILL_DOWNLOAD_NOT_FOUND: [
    '未找到技能源文件或固定提交，请核对公开仓库与路径',
    'The source file or pinned commit was not found. Check the public repository and path.',
  ],
  SKILL_DOWNLOAD_SERVER_UNAVAILABLE: [
    '技能源服务暂时不可用，请稍后手动重新导入',
    'The skill source service is unavailable. Import again manually later.',
  ],
  SKILL_DOWNLOAD_HTTP_FAILED: [
    '技能源HTTP请求未成功，请核对来源后手动重新导入',
    'The source HTTP request failed. Check the source before importing again manually.',
  ],
  SKILL_PREVIEW_REQUIRED: [
    '请先查看本版本技能及许可证，再确认安装',
    'Review this version and its license before installing.',
  ],
  SKILL_NOT_AVAILABLE: [
    '角色引用的技能版本已卸载或不可用，请创建新角色版本',
    'A pinned skill is unavailable. Create a new role version.',
  ],
  SKILL_REFERENCE_INVALID: [
    '技能引用重复或格式不正确',
    'Skill references are duplicated or invalid.',
  ],
}
