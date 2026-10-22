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
