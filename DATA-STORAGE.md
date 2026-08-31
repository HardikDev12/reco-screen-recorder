# Local Data Storage & File Locations

This document outlines the local storage directories and file paths utilized by RECO on Windows systems.

---

## 1. Directory Structure Overview

| Data Category | Default Path | Purpose | Persistence |
|---|---|---|---|
| **Completed Recordings** | `%USERPROFILE%\Videos\Reco\` | Finalized `.mp4` video recordings | Permanent (user managed) |
| **Temporary Recording Chunks** | `%USERPROFILE%\Videos\Reco\temp_Reco_*.mp4` | Live streaming target before remuxing | Deleted upon clean stop |
| **Settings & History Database** | `%APPDATA%\reco\storage.json` | Resolution, FPS, encoder options, and library list | Persists across updates |
| **Installed Application Binaries** | `%LOCALAPPDATA%\Programs\Reco\` | Executables (`Reco.exe`), runtime assets, and bundled FFmpeg | Replaced on upgrade |

---

## 2. Windows Registry Usage
* **No Unnecessary Registry Bloat**: RECO does not write tracking keys or background services to the Windows Registry.
* **Standard Installer Keys**: The NSIS installer registers standard uninstallation metadata under `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\reco` so users can easily uninstall RECO from Windows Settings.

---

## 3. Uninstallation Behavior
When RECO is uninstalled through Windows Settings, the uninstaller removes the application binary directory (`%LOCALAPPDATA%\Programs\Reco`). **User video recordings in `%USERPROFILE%\Videos\Reco` are strictly preserved.**
