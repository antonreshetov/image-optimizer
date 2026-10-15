!include WinMessages.nsh

# PATH is edited by PowerShell rather than ReadRegStr/WriteRegExpandStr:
# NSIS strings are capped at NSIS_MAX_STRLEN (1024), so a long user PATH would
# be truncated on write. The value is read without expanding %VARS% and written
# back as REG_EXPAND_SZ to keep the user's other entries intact. The directory
# and the action are passed via environment variables to avoid quoting issues.
# Keep the command below NSIS_MAX_STRLEN; every PowerShell `$` is escaped as `$$`.
!macro imageOptimizerUpdateUserPath ACTION
  Push $0
  System::Call 'kernel32::SetEnvironmentVariable(t "IMAGE_OPTIMIZER_CLI_DIR", t "$INSTDIR\resources\bin")'
  System::Call 'kernel32::SetEnvironmentVariable(t "IMAGE_OPTIMIZER_CLI_ACTION", t "${ACTION}")'
  nsExec::ExecToLog `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -Command "\
    $$d = $$env:IMAGE_OPTIMIZER_CLI_DIR.TrimEnd('\'); \
    $$k = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment'); \
    $$p = [string]$$k.GetValue('Path', '', 'DoNotExpandEnvironmentNames'); \
    $$e = @($$p.Split(';') | Where-Object { $$_ -and $$_.TrimEnd('\') -ne $$d }); \
    if ($$env:IMAGE_OPTIMIZER_CLI_ACTION -eq 'add') { $$e += $$d }; \
    if ($$e.Count) { $$k.SetValue('Path', ($$e -join ';'), 'ExpandString') } \
    else { $$k.DeleteValue('Path', $$false) }"`
  Pop $0
  DetailPrint "Update user PATH (${ACTION}): exit code $0"
  Pop $0
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
!macroend

!macro customInstall
  !insertmacro imageOptimizerUpdateUserPath add
!macroend

# Also runs when an update uninstalls the previous version; customInstall of
# the new version adds the entry back afterwards.
!macro customUnInstall
  !insertmacro imageOptimizerUpdateUserPath remove
!macroend
