export const englishBackup: Record<string, string> = {
  工作台数据备份: 'Workspace data backup',
  '备份业务历史、交付记录与技能版本。项目代码请单独备份。':
    'Back up business history, delivery records, and skill versions. Back up project code separately.',
  '不包含项目仓库、执行目录、系统凭据或 CLI 登录。新设备需重新配置项目位置与凭据。':
    'Excludes repositories, execution directories, system credentials, and CLI logins. Configure project locations and credentials on a new device.',
  '请先结束所有任务、人工等待和技能安装；状态待确认的执行必须先核对。':
    'End running tasks, human waits, and skill installations first. Reconcile uncertain processes before proceeding.',
  '正在核对和处理数据，请保持应用运行…': 'Verifying and processing data. Keep the app running…',
  创建工作台备份: 'Create workspace backup',
  选择并检查备份: 'Choose and inspect backup',
  改选备份存放目录: 'Choose another backup destination',
  备份已完成并核对摘要: 'Backup completed and digests verified',
  '备份编号：': 'Backup ID: ',
  已核对的恢复预览: 'Verified restore preview',
  备份时间: 'Backup time',
  '项目 / 任务 / 技能': 'Projects / tasks / skills',
  '备份内核 / 数据版本': 'Backup kernel / data version',
  '恢复会切换到新工作台并重新连接内核；旧数据保留，不合并备份后的新增内容。':
    'Restore switches to a new workspace and reconnects the kernel. Previous data is retained; changes made after the backup are not merged.',
  '我已核对备份范围与时间，确认切换到此备份。':
    'I have checked the backup scope and time and approve switching to this backup.',
  恢复到新工作台: 'Restore into a new workspace',
  '已从备份启动当前工作台，旧数据仍保留。':
    'This workspace was restored from a backup. Previous data is retained.',
  '上次恢复未切换成功，已恢复原工作台。':
    'The last restore did not activate. The original workspace was reopened.',
  '上次恢复的切换未确认。当前使用位置指针指定的数据，请检查后重新选择备份；不会自动重放恢复。':
    'The previous restore was not confirmed. The saved data location remains in use. Check it before selecting a backup again; restore is not replayed automatically.',
}

export const backupErrors: Record<string, [string, string]> = {
  BACKUP_INVALID: [
    '备份清单或数据结构无效，当前数据未替换',
    'Invalid backup manifest or data. Current data was not replaced.',
  ],
  BACKUP_SIZE_LIMIT: [
    '备份文件数量或大小超出恢复上限',
    'The backup exceeds file count or size limits.',
  ],
  BACKUP_DIGEST_MISMATCH: [
    '备份文件摘要不符，当前数据未替换',
    'Backup digest mismatch. Current data was not replaced.',
  ],
  BACKUP_VERSION_INCOMPATIBLE: [
    '备份数据版本不兼容，请使用匹配内核',
    'Backup data version is incompatible. Use a matching kernel.',
  ],
  BACKUP_WORKSPACE_BUSY: [
    '请先结束在途任务、人工等待与技能安装，并核对状态待确认执行',
    'End active tasks, human waits, and skill installations, and reconcile uncertain processes first.',
  ],
  BACKUP_TARGET_INVALID: [
    '请选择数据目录与项目仓库之外的新备份位置',
    'Choose a new backup location outside workspace data and project repositories.',
  ],
  BACKUP_RESTART_REQUIRED: [
    '恢复数据已准备，需完成内核重启后继续操作',
    'Restore data is prepared. Restart the kernel before continuing.',
  ],
  BACKUP_PREVIEW_STALE: [
    '备份内容已变化或选择已过期，请重新检查备份',
    'The backup changed or the selection expired. Inspect the backup again.',
  ],
  BACKUP_ACTIVATION_UNCERTAIN: [
    '恢复切换状态待确认，请重启后检查诊断；两份数据均保留',
    'Restore activation is uncertain. Restart and inspect diagnostics. Both data directories are retained.',
  ],
  BACKUP_ACTIVATION_FAILED: [
    '恢复未激活，仍使用原数据，可重新选择备份',
    'Restore did not activate. Previous data remains active; select the backup again.',
  ],
  DATA_LOCATION_INVALID: [
    '数据位置配置无效，已阻止静默切换，请检查诊断',
    'Invalid data location configuration. Automatic fallback was blocked. Check diagnostics.',
  ],
  MAINTENANCE_BUSY: [
    '正在处理工作台数据，请等待本次操作结束',
    'Workspace maintenance is in progress. Wait for it to finish.',
  ],
}
