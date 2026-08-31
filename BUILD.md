# RECO — Build & Distribution Guide

This document covers everything required to develop, build, and package **Reco** into a single-file Windows installer (`RECO-Setup.exe`).

---

## 1. Development Environment

- **Operating System**: Windows 10 / 11 (x64)
- **Node.js**: v20+ or v22+
- **Package Manager**: `npm` (included with Node.js)
- **FFmpeg & FFprobe**: Static x64 Windows binaries located in `bin/win64/` (bundled into production installers automatically).

---

## 2. Dependency Installation

```bash
# Clone the repository
git clone https://github.com/HardikDev12/reco-screen-recorder.git
cd reco-screen-recorder

# Install Node dependencies
npm install
```

---

## 3. Development Workflow

Run the application in live development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

---

## 4. Production Build & Bundling

To compile TypeScript, build Vite renderer multi-page apps, and bundle Electron main/preload scripts:

```bash
npm run build:electron
```

---

## 5. Single EXE Installer Generation

To package the entire application with bundled FFmpeg, assets, and icons into a single Windows installer:

```bash
npm run dist
```

### Output:
The generated installer is saved to:
```text
dist/
└── RECO-Setup.exe
```

---

## 6. How FFmpeg is Bundled

1. Static 64-bit binaries `ffmpeg.exe` and `ffprobe.exe` are placed in `bin/win64/`.
2. In `electron-builder.yml`, `extraResources` copies `bin/win64/` into the application's resources directory:
   ```yaml
   extraResources:
     - from: bin/win64
       to: bin/win64
       filter:
         - '**/*'
   ```
3. At runtime, [src/main/ffmpeg/recorder.ts](file:///d:/Personal%20Projects/recording-software/src/main/ffmpeg/recorder.ts) dynamically resolves the bundled binary:
   ```typescript
   path.join(process.resourcesPath, 'bin', 'win64', 'ffmpeg.exe')
   ```
4. **End users do NOT need to install FFmpeg or configure system PATH variables.**

---

## 7. Storage & User Data Separation

- **Application Binaries & Runtime**: Installed in `%LOCALAPPDATA%\Programs\Reco` (or `C:\Program Files\Reco` if custom directory selected).
- **User Recordings**: Saved to `%USERPROFILE%\Videos\Reco` (configurable in settings).
- **User Settings & Database**: Stored in `%APPDATA%\reco`.
- User recordings and configurations are **never overwritten or deleted** when upgrading or uninstalling the application.

---

## 8. Application Versioning

The single source of truth for versioning is [package.json](file:///d:/Personal%20Projects/recording-software/package.json):

```json
{
  "name": "reco",
  "version": "1.0.0"
}
```

Updating `"version"` in `package.json` automatically updates the installer metadata and executable versions upon running `npm run dist`.

---

## 9. Code Signing (Optional)

To sign the installer for Windows SmartScreen verification:

1. Set the certificate environment variables:
   ```bash
   export CSC_LINK="/path/to/certificate.pfx"
   export CSC_KEY_PASSWORD="your-password"
   ```
2. Run `npm run dist`.

---

## 10. Summary of Build Commands

| Command | Description |
|---|---|
| `npm run dev` | Launch local development with HMR |
| `npm run build:electron` | Compile TypeScript & Vite bundles |
| `npm run pack` | Package standalone unpacked directory (`dist/win-unpacked/Reco.exe`) |
| `npm run dist` | **Create single-file installer (`dist/RECO-Setup.exe`)** |
| `npm run dist:portable` | Create standalone single-file portable binary (`dist/RECO-Portable.exe`) |
