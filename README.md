# Reco — Screen Recorder

[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11%20x64-blue.svg)](https://github.com/HardikDev12/reco)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Author](https://img.shields.io/badge/author-Hardik%20Prajapati-orange.svg)](https://github.com/HardikDev12)

> A simple, high-quality, lightweight offline Windows screen recorder inspired by ShowMore.

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
- **FFmpeg**: Installed and available on system PATH

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

# Create NSIS per-user installer
npm run dist

# Create standalone single-file portable executable
npm run dist:portable
```

---

## 👤 Author

**Hardik Prajapati**  
- GitHub: [@HardikDev12](https://github.com/HardikDev12)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
