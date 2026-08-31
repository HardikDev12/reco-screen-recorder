# ShowMore Recorder — Product Requirements & POC Validation Brief

Windows-first • Offline • No watermark • No admin installation • Recording-focused UI

This is the source of truth for Antigravity to review before creating the project from zero.

## Core Definition
A simple, high-quality Windows screen recorder inspired by ShowMore's ease of use. It is not OBS and not a streaming application.

## Hard Requirements
- Windows 10/11 x64 first
- Electron.js + FFmpeg
- Offline recording
- No watermark
- Per-user/no-admin installer
- Optional portable build
- Screen, window, region capture
- Microphone + desktop audio
- Optional webcam
- 1080p30/60 primary targets
- H.264 MP4 default
- Hardware encoding when available
- Long-recording A/V synchronization
- Crash/interruption recovery
- Recording controls excluded from capture
- No virtual audio driver
- No streaming
- No account/cloud dependency

## UI Direction
The UI must be ShowMore-inspired: visual, simple, and focused. The home screen should prominently show the selected source preview, source selector, microphone/desktop audio status, optional webcam, Record button, and recent recordings. Avoid OBS-style scenes, source stacks, mixers, dense technical panels, and streaming controls.

## Meeting Recording
Google Meet, Teams, Zoom, and similar meetings are supported through ordinary screen/window capture plus Windows desktop audio and the user's microphone. No direct meeting API integration is required.

## POC Must Prove
1. Display capture
2. Window capture
3. Region capture
4. Desktop audio without a virtual driver
5. Microphone simultaneously
6. A/V sync for 30+ minutes
7. 1080p60 where hardware permits
8. H.264 MP4 output
9. Hardware encoder path
10. No orphaned FFmpeg processes
11. HUD exclusion
12. Interrupted recording recovery
13. No-admin installation
14. Offline operation

## Antigravity Must Do Before Coding
Return a requirements audit: confirmed requirements, missing requirements, technical risks, recommended architecture, POC test plan, MVP scope, deferred features, questions requiring user decisions, and implementation plan. Only after review/approval should the production project be initialized from zero.

## Development Order
Requirements audit → Windows capture POC → desktop audio + mic POC → FFmpeg/sync POC → long-recording/recovery tests → ShowMore-style UI → source preview → HUD → recordings library → webcam → hardware presets → installer/portable → signing/regression testing.