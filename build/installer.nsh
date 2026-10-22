; 完全退出必须由应用核对内核/CLI结束。安装与卸载不得代用户强杀后台任务。
!macro customCheckAppRunning
  !insertmacro nsProcess::FindProcess "${APP_EXECUTABLE_FILENAME}" $R0
  !insertmacro nsProcess::Unload
  ${If} $R0 != 603
    ${IfNot} ${Silent}
      MessageBox MB_OK|MB_ICONEXCLAMATION "请先在纬舟菜单选择“完全退出”，确认任务与内核已结束，再重新运行安装或卸载。$\r$\nQuit WeftPilot completely from its menu before installing or uninstalling."
    ${EndIf}
    SetErrorLevel 32
    Quit
  ${EndIf}
!macroend
