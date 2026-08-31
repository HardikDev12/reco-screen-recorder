# Open-Source Compliance & Provenance

This document records the provenance, licensing, and compliance obligations for all external components utilized in the RECO project.

---

## 1. Compliance Principles
RECO is released under the permissive [MIT License](../LICENSE). In distributing RECO, the project adheres to all upstream license requirements, including preservation of copyright notices, disclaimers of warranty, and attribution requirements.

---

## 2. Inventory of External Code & Binaries

| Component | Origin / Source | License | Modification Status | Distribution Format |
|---|---|---|---|---|
| **Electron** | OpenJS Foundation / GitHub | MIT | Unmodified | Packaged runtime |
| **Chromium** | Google LLC / Chromium Authors | BSD-3-Clause / LGPL | Unmodified | Embedded in Electron |
| **React & React DOM** | Meta Platforms, Inc. | MIT | Unmodified | Bundled JavaScript |
| **Lucide Icons** | Lucide Contributors | ISC | Unmodified | Bundled SVG icons |
| **Tailwind CSS** | Tailwind Labs, Inc. | MIT | Unmodified | Build-time CSS utility |
| **Vite & Plugins** | Evan You & Vite Team | MIT | Unmodified | Build tooling |
| **FFmpeg Binary** | Gyan Doshi / FFmpeg Team | GPL v3.0 / LGPL v2.1+ | Unmodified static binary | Standalone executable in `extraResources` |
| **Plus Jakarta Sans** | Tokotype | OFL-1.1 | Unmodified | Web font / typography |

---

## 3. Subprocess Execution of FFmpeg
RECO executes FFmpeg purely as an independent standalone executable via standard Windows child process execution (`child_process.spawn`). No internal private APIs or proprietary linking is performed against FFmpeg libraries. 

Source code for FFmpeg is available under its official repository: [https://github.com/FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg).

---

## 4. No Vendored / Copied Snippets
All application logic in `src/main`, `src/preload`, `src/renderer`, and `src/shared` was authored specifically for RECO or imported through managed npm packages. No uncredited third-party code snippets or proprietary blobs exist in the repository.
