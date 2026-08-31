# Release Artifact Integrity Verification

To ensure that downloaded installer binaries have not been tampered with or corrupted in transit, SHA-256 checksums are generated for each release artifact.

---

## 1. How to Verify SHA-256 Checksum on Windows

Open PowerShell in the folder containing `RECO-Setup.exe` and execute:

```powershell
Get-FileHash -Algorithm SHA256 RECO-Setup.exe
```

Compare the computed hash string with the official release hash published in GitHub Releases.

---

## 2. Generating Checksums for Releases

Developers generating release checksums run:

```powershell
Get-FileHash -Algorithm SHA256 dist\RECO-Setup.exe, dist\RECO-Portable.exe | Format-List
```
