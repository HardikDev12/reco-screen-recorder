!include "FileFunc.nsh"

!macro customUnInit
  ; Ensure Reco is not running during uninstallation to protect in-flight recordings
  ${nsProcess::FindProcess} "Reco.exe" $R0
  ${If} $R0 == 0
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "Reco is currently running. Please finish or stop any active recording and close Reco before continuing.$\n$\nClick OK to close Reco and continue uninstallation, or Cancel to abort." IDOK closeReco IDCANCEL abortUninstall
    closeReco:
      ${nsProcess::KillProcess} "Reco.exe" $R0
      Sleep 1500
      Goto doneCheck
    abortUninstall:
      Quit
    doneCheck:
  ${EndIf}
!macroend

!macro customUninstall
  ; 1. Remove RECO-owned application configuration and database in AppData
  RMDir /r "$APPDATA\reco"
  RMDir /r "$APPDATA\Reco"

  ; 2. Remove RECO-owned updater cache and local staging in LocalAppData
  RMDir /r "$LOCALAPPDATA\reco-updater"
  RMDir /r "$LOCALAPPDATA\reco-cache"

  ; 3. Clean RECO-specific registry entries
  DeleteRegKey HKCU "Software\reco"
  DeleteRegKey HKCU "Software\Hardik Prajapati\Reco"

  ; =========================================================================
  ; CRITICAL RECORDING SAFETY GUARANTEE:
  ; User recordings stored in %USERPROFILE%\Videos\Reco or any custom user
  ; directory are deliberately and strictly EXCLUDED from uninstallation.
  ; =========================================================================
!macroend
