param([Parameter(Mandatory = $true)][datetime]$StartedAt)

# 保留UTF-8 BOM，兼容Windows PowerShell 5.1和pwsh，防止中文注释误解码影响UTC筛选。
# 只查询本轮测试窗口的应用崩溃元数据；不输出消息正文、路径、凭据或内存转储。
$taskEvents = @()
try {
  $taskEvents = @(Get-WinEvent -FilterHashtable @{
    LogName = 'Application'
    ProviderName = 'Application Error'
    Id = 1000
    StartTime = $StartedAt.ToLocalTime()
  } -MaxEvents 100 -ErrorAction Stop)
} catch {
  if ($_.FullyQualifiedErrorId -notlike 'NoMatchingEventsFound*') { throw }
}
$taskReports = @()
foreach ($taskEvent in $taskEvents) {
  # 再按UTC精确核对，避免不同PowerShell/系统时区解释把旧事件混入本轮。
  if ($taskEvent.TimeCreated.ToUniversalTime() -lt $StartedAt.ToUniversalTime()) { continue }
  $taskXml = [xml]$taskEvent.ToXml()
  $taskFields = @{}
  foreach ($taskData in $taskXml.Event.EventData.Data) {
    $taskFields[$taskData.Name] = $taskData.InnerText
  }
  if ($taskFields.AppName -notin @('WeftPilot.exe', 'electron.exe')) { continue }
  $taskReports += [pscustomobject]@{
    time = $taskEvent.TimeCreated.ToUniversalTime().ToString('o')
    app = $taskFields.AppName
    module = $taskFields.ModuleName
    moduleVersion = $taskFields.ModuleVersion
    exceptionCode = $taskFields.ExceptionCode
    offset = $taskFields.FaultingOffset
    processId = $taskFields.ProcessId
    processCreated = $taskFields.ProcessCreationTime
  }
}
ConvertTo-Json -InputObject @($taskReports) -Depth 3
