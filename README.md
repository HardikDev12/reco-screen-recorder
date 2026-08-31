<p align="center">
  <img src="asset/logo-verticle.png" alt="Reco Logo" width="220"/>
</p>

<h1 align="center">Reco — Modern Desktop Screen Recorder</h1>

<p align="center">
  <a href="https://github.com/HardikDev12/reco/releases"><img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square" alt="Version"/></a>
  <a href="https://github.com/HardikDev12/reco"><img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011%20x64-0078D6.svg?style=flat-square&logo=windows" alt="Platform"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License"/></a>
  <a href="docs/PRIVACY.md"><img src="https://img.shields.io/badge/privacy-100%25%20Offline%20%7C%20Zero%20Telemetry-success.svg?style=flat-square" alt="Privacy"/></a>
  <a href="https://github.com/HardikDev12"><img src="https://img.shields.io/badge/author-Hardik%20Prajapati-orange.svg?style=flat-square" alt="Author"/></a>
</p>

<p align="center">
  <strong>A high-performance, lightweight, and offline Windows screen recorder inspired by ShowMore.</strong><br>
  Engineered for zero-latency capture, arbitrary desktop regions, hardware-accelerated encoding, and studio-grade audio.
</p>

---

## 📥 Download & Installation

Reco is distributed as a self-contained, single-file Windows executable with bundled FFmpeg. No external codecs or administrator privileges required.

### Options

| Distribution | File | Description |
|---|---|---|
| **Standard Installer (Recommended)** | `RECO-Setup.exe` | Clean per-user installation (`%LOCALAPPDATA%\Programs\reco`), Start Menu & Desktop shortcuts, and full Windows *Installed Apps* registration. |
| **Portable Version** | `RECO-Portable.exe` | Single standalone executable that runs directly without installation. |

### Installing via Setup Wizard
1. Download **`RECO-Setup.exe`** from the [Latest Releases](https://github.com/HardikDev12/reco/releases).
2. Double-click **`RECO-Setup.exe`** to launch the installer.
3. Select your preferred installation directory (defaults to your user profile directory).
4. Click **Install**. Reco will automatically extract the application, register Windows shortcuts, and launch the recorder.

### Clean Uninstallation
Reco provides a clean Windows uninstaller accessible via **Windows Settings > Apps > Installed apps** or the **Control Panel**:
* **Application Removal**: Completely cleans the executable runtime, caches, logs, settings, and registry entries.
* **Recording Safety Guarantee**: Your recorded videos (`%USERPROFILE%\Videos\Reco` or any custom folder) are **never deleted or modified** when uninstalling.

---

## ✨ Key Features

- 🪟 **Interactive Transparent Frame on Launch**: Opens an interactive resizable capture box directly over your screen with pixel-perfect dimensions.
- 🎯 **Arbitrary Region & Fullscreen Capture**: Freely resize via 8 border handles or snap to fullscreen with one click.
- 🛡️ **Anti-Recursion / Zero Self-Capture**: Hardware-enforced `setContentProtection(true)` prevents Reco's own toolbar and frame handles from appearing in the output video.
- ⚡ **Zero-Latency Startup**: Audio loopback and video capture pipelines pre-warm instantly so speech at second zero is never clipped.
- 🎙️ **Studio Audio with Dynamics Limiter**: 48 kHz high-fidelity audio engine with an automatic limiter (`DynamicsCompressorNode`) to eliminate clipping, pops, and distortion.
- 🚀 **Hardware Acceleration**: Auto-detects NVIDIA NVENC (`h264_nvenc`), AMD AMF (`h264_amf`), and Intel QSV with smart x264 software fallback.
- 💾 **Crash-Resilient Fragmentation**: Streams video into fragmented MP4 (`frag_keyframe+empty_moov`), ensuring videos remain valid even if the system unexpectedly shuts down.
- 🔒 **100% Offline & Private**: Zero cloud uploads, zero telemetry, and zero network calls. All data remains exclusively on your local computer.

---

## 🖥️ System Requirements

* **Operating System**: Windows 10 (64-bit) or Windows 11 (64-bit)
* **Processor**: Intel Core i3 / AMD Ryzen 3 or higher
* **Memory**: 4 GB RAM minimum (8 GB recommended)
* **Storage**: 500 MB free disk space for installation + storage for captured recordings
* **GPU**: NVIDIA, AMD, or Intel graphics card with hardware H.264 support (optional, CPU encoding supported)

---

## 🛠️ Tech Stack & Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Reco Architecture                    │
├────────────────────────┬───────────────────────────────┤
│ Frontend Shell         │ Electron 44.0 (Chromium)      │
│ UI Framework           │ React 19 + TypeScript + Vite  │
│ Styling & Tokens       │ Tailwind CSS v4 + Lucide      │
│ Audio Pipeline         │ Web Audio API + Limiter Node  │
│ Video Encoding Engine  │ FFmpeg 8.0.1 x64 (Bundled)    │
│ Packaging & NSIS       │ electron-builder 26.15.3      │
└────────────────────────┴───────────────────────────────┘
```

---

## 🧑‍💻 Developer & Build Guide

### Prerequisites
* **Node.js**: `v20.x` or `v22.x`
* **Package Manager**: `npm` (`v10+`)
* **OS**: Windows 10/11 x64

### Getting Started

```bash
# Clone the repository
git clone https://github.com/HardikDev12/reco.git
cd reco

# Install dependencies
npm install

# Start local development mode with live HMR
npm run dev
```

### Packaging Production Binaries

```bash
# 1. Compile TypeScript & build Vite client bundles
npm run build:electron

# 2. Package standalone unpacked directory (dist/win-unpacked/Reco.exe)
npm run pack

# 3. Build single-file NSIS setup installer (dist/RECO-Setup.exe)
npm run dist

# 4. Build single-file portable executable (dist/RECO-Portable.exe)
npm run dist:portable
```

For complete packaging orchestration runbooks, see [BUILD.md](BUILD.md).

---

## 📄 Legal & Compliance Documentation

Reco is released as open-source software under the **[MIT License](LICENSE)**.

Copyright (c) 2026 **Hardik Prajapati**.

For full compliance policies and audits, refer to the [`docs/`](docs/) directory:

* 📜 **[LICENSE](LICENSE)**: Official MIT License terms.
* 📦 **[docs/THIRD-PARTY-NOTICES.md](docs/THIRD-PARTY-NOTICES.md)**: Open-source attributions (Electron, React, FFmpeg, Lucide).
* ⚖️ **[docs/COPYRIGHT.md](docs/COPYRIGHT.md)**: Scope of original copyright ownership.
* 🔒 **[docs/PRIVACY.md](docs/PRIVACY.md)**: Privacy policy & local storage guarantees.
* 📋 **[docs/TERMS.md](docs/TERMS.md)**: Terms of service and user responsibilities.
* ⚠️ **[docs/DISCLAIMER.md](docs/DISCLAIMER.md)**: Hardware, video integrity, and software disclaimers.
* 🎙️ **[docs/RECORDING-CONSENT.md](docs/RECORDING-CONSENT.md)**: Multi-party recording consent information.
* 🛡️ **[docs/SECURITY.md](docs/SECURITY.md)**: Vulnerability disclosure guidelines.
* 🏷️ **[docs/TRADEMARKS.md](docs/TRADEMARKS.md)**: Brand identity and logo usage policies.
* 🤝 **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)**: Contribution standards and workflow.
* 📜 **[docs/CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md)**: Community code of conduct.

---

## 👤 Author & Support

**Hardik Prajapati**
* GitHub: [@HardikDev12](https://github.com/HardikDev12)
* Project Repository: [https://github.com/HardikDev12/reco](https://github.com/HardikDev12/reco)
