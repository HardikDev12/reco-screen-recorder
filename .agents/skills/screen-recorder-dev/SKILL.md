---
name: screen-recorder-dev
description: >-
  Expert workflows and runbooks for building, testing, and packaging the Windows Electron + FFmpeg ShowMore-inspired screen recorder. Use when developing capture pipelines, audio loopback, FFmpeg process pipelines, crash recovery, and per-user installers.
---

# Screen Recorder Development & Testing Runbook

This skill provides procedures and architecture patterns for developing the Windows-first offline screen recording desktop application.

## Core Architectural Patterns

### 1. Transparent Overlay & Capture Exclusion
- **Default Launch Experience**: Direct launch into a transparent fullscreen overlay containing a draggable, resizable red-dashed recording frame.
- **Capture Exclusion**: All UI windows (overlay, toolbar, handles) MUST call `win.setContentProtection(true)` so Windows DWM (`WDA_EXCLUDEFROMCAPTURE`) prevents the recorder's own UI from appearing in the video.
- **Physical Region Cropping**: Maps the overlay frame bounds `(x, y, width, height)` with `screen.getPrimaryDisplay().scaleFactor` and crops the video stream in FFmpeg with `-vf "crop=trunc(w/2)*2:trunc(h/2)*2:x:y,format=yuv420p"`.

### 2. Instant Zero-Latency Recording & Audio Pipeline
- **Hot Pre-Warming**: Pre-initialize WebRTC desktop stream and `AudioContext({ sampleRate: 48000 })` on overlay load so pressing "Record" starts capturing audio and video instantaneously without losing the first 3 seconds.
- **Audio Quality & Limiter**: Use 48 kHz standard sample rate with a `DynamicsCompressorNode` (threshold -24dB, knee 30, ratio 12, attack 0.003s, release 0.25s) to guarantee clean, comfortable, natural voice with zero digital clipping.
- **Audio Encoding**: `-c:a aac -b:a 192k -ar 48000`.

### 3. Accurate Color Matrix & Brightness Matching
- Fix gamma/over-brightness shifts by enforcing standard sRGB color matrix in FFmpeg:
  `-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -pix_fmt yuv420p`.

### 4. FFmpeg Pipeline & Crash Recovery
- Stream into FFmpeg stdin with fragmented MP4 flags: `-movflags frag_keyframe+empty_moov+default_base_moof`.
- Clean shutdown flushes stdin and remuxes with `-movflags +faststart`.
