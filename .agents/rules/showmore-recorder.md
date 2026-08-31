---
description: Coding standards and guidelines for ShowMore Recorder Windows screen recording application
globs: "**/*"
always_on: true
---

# ShowMore Recorder Architecture & Quality Standards

- **Platform Target**: Windows 10/11 x64.
- **Offline First**: Zero cloud dependencies, zero analytics/telemetry without user consent, no accounts required.
- **No Watermarks**: Free, clean, full-quality output.
- **Clean Process Management**: FFmpeg child processes must be tracked and forcefully cleaned up on crash or app termination to prevent orphaned background processes.
- **UI Philosophy**: ShowMore-inspired simplicity. Clean, modern, distraction-free visual layout with big recording triggers, crisp audio toggles, live preview, and minimal technical jargon. Avoid OBS-like scene graph complexity.
- **A/V Sync & Resilience**: Recordings must utilize fragmented MP4 during recording to prevent unplayable corrupted files on sudden power loss/crash, followed by instant faststart finalization.
