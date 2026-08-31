# Contributing to RECO

Thank you for your interest in contributing to RECO! We welcome code contributions, documentation improvements, and bug reports.

---

## Code of Conduct
All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/HardikDev12/reco-screen-recorder.git
   cd reco-screen-recorder
   npm install
   ```

2. **Run in Development**:
   ```bash
   npm run dev
   ```

3. **Coding Standards**:
   - Write strict TypeScript with explicit types where practical.
   - Maintain the Impeccable UI design system tokens (internal padding, 8px/16px semantic grouping).
   - Ensure all sub-windows preserve `setContentProtection(true)` to prevent self-capture loops.

4. **Testing Build & Packaging**:
   ```bash
   npm run build:electron
   npm run pack
   ```

5. **Submitting Pull Requests**:
   - Create a feature branch (`git checkout -b feature/your-feature-name`).
   - Ensure no temporary files or binary dumps are committed.
   - Submit a Pull Request describing your changes clearly with before/after context.

---

## Licensing of Contributions
By submitting a Pull Request, you agree that your contributions will be licensed under the project's [MIT License](../LICENSE).
