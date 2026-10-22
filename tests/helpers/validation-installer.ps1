param(
  [Parameter(Mandatory = $true)][string]$Executable,
  [Parameter(Mandatory = $true)][ValidateSet('install', 'uninstall')][string]$Action,
  [Parameter(Mandatory = $true)][string]$InstallDirectory
)
$ErrorActionPreference = 'Stop'
$resolvedDirectory = [System.IO.Path]::GetFullPath($InstallDirectory)
if ($resolvedDirectory.Contains('"')) { throw '验收路径包含非法引号' }
if ($Action -eq 'uninstall') {
  $resolvedExecutable = (Get-Item -LiteralPath $Executable).FullName
  if ($resolvedExecutable -ne (Join-Path $resolvedDirectory 'Uninstall WeftPilotValidation.exe')) {
    throw '拒绝卸载验收目录以外的应用'
  }
  $installerArguments = @('/S', '/currentuser')
} else {
  # NSIS的/D必须位于末尾且不加引号，路径由Node侧独立合成夹具归属检查。
  $installerArguments = @('/S', "/D=$resolvedDirectory")
}
$installerProcess = Start-Process -FilePath $Executable -ArgumentList $installerArguments -WindowStyle Hidden -PassThru -Wait
exit $installerProcess.ExitCode
