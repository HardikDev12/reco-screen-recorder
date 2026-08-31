# Privacy Policy

**Effective Date**: January 1, 2026  
**Last Updated**: August 31, 2026

RECO ("the Application") is an offline-first desktop screen recording software developed by Hardik Prajapati. We believe your screen, audio, and camera data belong solely to you. This Privacy Policy details how data is handled by the Application.

---

## 1. Zero Cloud Data Collection & Zero Telemetry
* **No Telemetry**: RECO does not contain analytics SDKs, trackers, error-reporting beacons, or telemetry probes.
* **No Network Transmissions**: The Application performs **zero outbound network connections** during operation. It does not send user data, recording metadata, diagnostic information, or usage statistics to any external server.
* **No User Accounts**: RECO requires no account registration, login, email address, or payment collection.

---

## 2. Information Processed Locally
During active recording sessions, RECO accesses the following system inputs **exclusively in local memory on your device**:

1. **Screen Capture**: Pixels from your selected display or custom screen region are streamed directly to the local FFmpeg process.
2. **Microphone Audio**: When enabled, local microphone input is captured for voiceover and mixed locally.
3. **System Audio**: When enabled, audio played through your Windows audio output is captured via local WASAPI loopback.
4. **Camera Input**: When Picture-in-Picture webcam overlay is activated, camera video is displayed in a local preview window and captured into the recording.

---

## 3. Storage & Local Data Retention
* **Saved Recordings**: Finished recordings (`.mp4` files) are saved exclusively to your local disk, by default at `%USERPROFILE%\Videos\Reco` (or any custom directory you select in Settings).
* **Temporary Files**: During active recording, temporary chunks are written locally to your destination directory and remuxed into the final `.mp4` file upon completion.
* **Application Settings**: User preferences (framerate, encoder choice, audio toggles, output directory) and recording history metadata are stored locally in `%APPDATA%\reco`.
* **No Automatic Deletion**: RECO never deletes your recorded videos automatically without your explicit action in the Library dashboard.

---

## 4. Third-Party Services
RECO does not integrate with any third-party cloud services, advertisers, or third-party tracking APIs.

---

## 5. Children's Privacy
Because RECO operates entirely locally and does not collect personal data from any user, it does not knowingly collect personal information from children.

---

## 6. Changes to this Policy
If future versions of RECO introduce optional network features (such as opt-in update checks), this Privacy Policy will be updated accordingly with clear advance disclosure.

---

## 7. Contact
For privacy inquiries or technical questions:
* **Maintainer**: Hardik Prajapati
* **GitHub Issues**: [https://github.com/HardikDev12/reco-screen-recorder/issues](https://github.com/HardikDev12/reco-screen-recorder/issues)
