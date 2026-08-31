# RECO — Release Automation & Maintenance Runbook

This document details the release management lifecycle, semantic versioning rules, GitHub Actions release automation, and branch protection requirements for **RECO**.

---

## 1. Single Source of Truth for Versions

The authoritative version of RECO is defined in [`package.json`](../package.json):

```json
{
  "version": "1.0.0"
}
```

All compiled binaries, Windows installers, Git tags, and GitHub Release notes synchronize automatically with this version.

---

## 2. Semantic Versioning (SemVer)

RECO follows standard **Semantic Versioning (`MAJOR.MINOR.PATCH`)**:
* **`PATCH` (e.g. `1.0.1`)**: Backwards-compatible bug fixes, dependency security patches, or minor UI adjustments.
* **`MINOR` (e.g. `1.1.0`)**: Backwards-compatible new features (e.g., custom annotation tools, new output container formats).
* **`MAJOR` (e.g. `2.0.0`)**: Breaking architectural changes or substantial platform rewrites.

---

## 3. End-to-End Release Workflow

```text
1. Feature Branch / PR  ──▶ 2. Automated CI (Typecheck, Security Audit, Build)
                                      │
3. Merge PR to main     ◀─────────────┘
       │
4. Bump version in package.json
       │
5. Create & push tag: git tag v1.0.0 && git push origin v1.0.0
       │
6. GitHub Actions Release Workflow executes on windows-latest:
   - Validates Tag matches package.json
   - Runs npm ci & npm audit --omit=dev
   - Compiles Vite & Electron bundles
   - Builds dist/RECO-Setup.exe & dist/RECO-Portable.exe
   - Verifies artifact existence and size (>50 MB)
   - Computes SHA-256 Checksums (SHA256SUMS.txt)
   - Automatically publishes GitHub Release with generated release notes
       │
7. Users download RECO-Setup.exe directly from GitHub Releases!
```

---

## 4. How to Publish a Release (Step-by-Step)

### Step 1: Update Version in `package.json`
Update the version field in `package.json` and sync `package-lock.json`:
```bash
npm version 1.0.1 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): bump version to 1.0.1"
git push origin main
```

### Step 2: Create and Push Git Tag
```bash
git tag v1.0.1
git push origin v1.0.1
```

### Step 3: Automated Publishing
GitHub Actions will automatically pick up the `v1.0.1` tag, build the Windows binaries, and publish the release with all checksums to:
`https://github.com/HardikDev12/reco/releases`

---

## 5. Main Branch Protection Guidelines

To protect production code integrity, configure branch protection rules in GitHub:

1. Navigate to **GitHub Repository Settings** → **Branches** (or **Rules** → **Rulesets**).
2. Click **Add branch ruleset** (Target branch: `main`).
3. Enable the following protections:
   * :white_check_mark: **Require a pull request before merging** (Require 1 review approval).
   * :white_check_mark: **Require status checks to pass before merging** (Select: `Build & Security Validation`).
   * :white_check_mark: **Require branches to be up to date before merging**.
   * :white_check_mark: **Require conversation resolution before merging**.
   * :white_check_mark: **Block force pushes** (`Restrict force pushes`).
   * :white_check_mark: **Block branch deletion** (`Restrict deletions`).
