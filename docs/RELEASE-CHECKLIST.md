# Pre-Release Quality & Compliance Checklist

Complete all checklist items prior to tagging and publishing a public release of RECO.

---

### 1. Licensing & Legal
- [x] `LICENSE` file exists at repository root with correct copyright year (2026) and author (Hardik Prajapati).
- [x] `THIRD-PARTY-NOTICES.md` audited and up to date with all production dependencies.
- [x] `OPEN-SOURCE-COMPLIANCE.md` verified.
- [x] `PRIVACY.md` accurately reflects zero telemetry and offline-only operations.
- [x] `TERMS.md` and `DISCLAIMER.md` present.
- [x] `TRADEMARKS.md` and `RECORDING-CONSENT.md` present.

### 2. Privacy & Security
- [x] `NETWORK-AUDIT.md` confirms zero unauthorized network requests.
- [x] No sensitive API keys, private tokens, or confidential paths in repository.
- [x] Subprocess calls to FFmpeg use strict argument arrays and `windowsHide: true`.

### 3. Application Packaging & Build
- [x] `package.json` version matches release milestone.
- [x] Production build passes cleanly (`npm run build:electron`).
- [x] Bundled FFmpeg static binaries verified in `extraResources`.
- [x] Single-file installer (`dist/RECO-Setup.exe`) builds without errors.
- [x] Start Menu and Desktop shortcuts link correctly with official `.ico` icon.
- [x] Clean uninstaller registered in Windows Settings.

### 4. Functional Verification
- [x] Region selection frame resizes, moves, and transmits coordinates smoothly.
- [x] Recording starts, pauses, resumes, and stops cleanly.
- [x] Faststart MP4 remuxing produces readable, playable video files.
- [x] Microphone audio and system audio record cleanly without clipping.
