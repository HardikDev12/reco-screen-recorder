<p align="center">
  <img src="asset/logo-verticle.png" alt="Reco Logo" width="220"/>
</p>

<h1 align="center">Reco — Screen Recorder</h1>

<p align="center">
  <a href="https://github.com/HardikDev12/reco"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11%20x64-blue.svg" alt="Platform"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"/></a>
  <a href="https://github.com/HardikDev12"><img src="https://img.shields.io/badge/author-Hardik%20Prajapati-orange.svg" alt="Author"/></a>
</p>

<p align="center">
  <strong>A modern, lightweight, high-performance offline Windows screen recorder inspired by ShowMore.</strong>
</p>

---

## ✨ Features

- 🪟 **Transparent Overlay on Launch**: Immediately opens an interactive, transparent resizable recording frame directly over your desktop.
- 🎯 **Arbitrary Region Capture**: Freely drag and resize with 8 handles to capture any screen area without forced resolutions or aspect ratio locks.
- 🛡️ **Zero Self-Capture / Anti-Recursion**: Employs `WDA_EXCLUDEFROMCAPTURE` / `setContentProtection(true)` so Reco's own frame and toolbar are completely invisible in the final video.
- ⚡ **Zero-Latency Startup**: Pre-warmed capture and audio engine ensures you can speak immediately without missing the first few seconds.
- 🎙️ **Studio Audio with Limiter**: 48 kHz standard audio pipeline with an integrated dynamic limiter (`DynamicsCompressorNode`) to eliminate digital clipping and harshness.
- 🎨 **True-to-Life Colors**: Enforces standard BT.709 sRGB color space and gamma in FFmpeg to match what you actually see on screen.
- 💾 **Crash Resilient**: Streams into fragmented MP4 (`frag_keyframe+empty_moov`), making recorded files readable even upon sudden interruption, followed by faststart remuxing on clean finish.
- 🚀 **Hardware Acceleration**: Auto-detects NVIDIA NVENC, AMD AMF, and Intel QSV with high-performance x264 software fallback.
- 📦 **Per-User / No-Admin Installer**: Easy distribution without requiring administrator elevation.

---

## 🛠️ Tech Stack

- **Framework**: [Electron.js](https://www.electronjs.org/) (Chromium + Node.js)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Vite](https://vitejs.dev/)
- **Video Engine**: [FFmpeg](https://ffmpeg.org/) (Static x64 build with NVENC/AMF)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Packaging**: [electron-builder](https://www.electron.build/)

---

## 🚀 Getting Started

### Prerequisites

- **OS**: Windows 10 / 11 x64
- **Node.js**: v20+ / v22+

### Installation

```bash
# Clone the repository
git clone https://github.com/HardikDev12/reco.git
cd reco

# Install dependencies
npm install
```

### Development

```bash
# Run in live development mode with Hot-Module Replacement
npm run dev
```

### Building & Packaging

```bash
# Typecheck and build Electron/Vite bundles
npm run build:electron

# Package standalone unpacked application (dist/win-unpacked/Reco.exe)
npm run pack

# Create NSIS single-file installer (dist/RECO-Setup.exe)
npm run dist

# Create standalone single-file portable executable (dist/RECO-Portable.exe)
npm run dist:portable
```

For complete packaging and build orchestration details, refer to [BUILD.md](BUILD.md).

---

## 📄 Licensing & Legal Information

RECO is open-source software released under the **[MIT License](LICENSE)**.

Copyright (c) 2026 **Hardik Prajapati**.

All third-party dependencies, libraries, codecs, and bundled binaries are licensed under their respective terms. For complete documentation, see the [`docs/`](docs/) directory:

* 📜 **[LICENSE](LICENSE)**: Full MIT License text.
* 📦 **[docs/THIRD-PARTY-NOTICES.md](docs/THIRD-PARTY-NOTICES.md)**: Third-party attributions and upstream licenses.
* ⚖️ **[docs/COPYRIGHT.md](docs/COPYRIGHT.md)**: Copyright and ownership scope.
* 🔒 **[docs/PRIVACY.md](docs/PRIVACY.md)**: Privacy policy & local-only offline guarantees.
* 📋 **[docs/TERMS.md](docs/TERMS.md)**: Terms of use and user responsibilities.
* ⚠️ **[docs/DISCLAIMER.md](docs/DISCLAIMER.md)**: General software and recording disclaimer.
* 🎙️ **[docs/RECORDING-CONSENT.md](docs/RECORDING-CONSENT.md)**: Multi-party recording consent information.
* 🛡️ **[docs/SECURITY.md](docs/SECURITY.md)**: Vulnerability disclosure guidelines.
* 🏷️ **[docs/TRADEMARKS.md](docs/TRADEMARKS.md)**: Brand and logo usage guidelines.
* 🤝 **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)**: Developer contribution guidelines.
* 📜 **[docs/CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md)**: Community standards.

---

## 👤 Author

**Hardik Prajapati**  
- GitHub: [@HardikDev12](https://github.com/HardikDev12)
