# Projecto — Mobile Deployment & Execution Guide

This document provides exact instructions for developers and evaluators to run the **Projecto React Native Mobile Application** against the backend API (both local and deployed cloud production instances).

---

## 1. Backend Endpoint Configuration (`EXPO_PUBLIC_API_URL`)

The mobile client relies on the standard `EXPO_PUBLIC_API_URL` environment variable defined in `mobile/.env`.

### Environment Scenarios:

```text
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Environment                          │ Target EXPO_PUBLIC_API_URL Value                            │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Local Android Emulator            │ http://10.0.2.2:5000/api                                    │
│ 2. Local Physical Phone (Wi-Fi LAN)  │ http://<YOUR_COMPUTER_LOCAL_IP>:5000/api                    │
│ 3. Cloud Production Deployed Backend │ https://<DEPLOYED_BACKEND_URL>/api (PENDING DEPLOYMENT)     │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

> **Note on Production URL**: Deployment to cloud hosting requires evaluator/user credentials. Until production credentials and cloud hosting are triggered, the live production URL remains **PENDING**. The local and LAN modes are 100% verified and functional.

---

## 2. Running Mobile Locally with Expo

### 2.1 Prerequisites
- **Node.js**: `>= 18.x`
- **Expo Go App**: Installed on physical iOS or Android phone, OR **Android Studio / Android SDK** for emulator testing.

### 2.2 Setup Steps
1. Navigate into `mobile/`:
   ```bash
   cd mobile
   npm install
   ```

2. Configure `mobile/.env`:
   ```env
   # For Physical Device on Wi-Fi
   EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api

   # OR for Android Emulator:
   # EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
   ```

3. Start the Expo Metro Bundler:
   ```bash
   npx expo start
   ```

4. Launch on Target Device:
   - **Physical Device**: Scan the terminal QR code with your camera (iOS) or inside the **Expo Go** app (Android). Ensure your phone and computer are on the same Wi-Fi network.
   - **Android Emulator**: Press `a` in the terminal to launch on your active emulator.

---

## 3. Building Standalone Android APK (EAS Build)

To generate a standalone APK (`.apk` binary) for direct installation on Android devices:

### 3.1 Install EAS CLI & Login
```bash
npm install -g eas-cli
eas login
```

### 3.2 Configure `eas.json` for APK Output
Create or verify `eas.json` in `mobile/`:
```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://<DEPLOYED_BACKEND_URL>/api"
      }
    },
    "production": {}
  }
}
```

### 3.3 Trigger Cloud APK Build
```bash
eas build -p android --profile preview
```
- EAS will compile the Android bundle in the cloud and provide a direct download link for the `.apk` file.
- Transfer the `.apk` file to any Android device and tap to install (enable "Install from unknown sources").

---

## 4. Mobile Architecture & User Experience Features

### 4.1 Secure Token Authentication (`expo-secure-store`)
- The mobile application uses hardware-backed encrypted storage via `expo-secure-store` to persist the JWT token.
- Tokens survive application restarts and are automatically attached to all outgoing requests via the `Authorization: Bearer <token>` header.
- Upon token expiration (`401 Unauthorized`), the secure store is sanitized and the user is redirected to the Login screen.

### 4.2 Cross-Platform Synchronization
- Because both Web and Mobile talk to the identical PostgreSQL database via the Express REST API, changes made on Web reflect instantly on Mobile (and vice-versa).

### 4.3 Native Pull-to-Refresh
- Every data-driven screen (`DashboardScreen`, `ProjectsScreen`, `ProjectDetailScreen`, `TasksScreen`) implements native `RefreshControl`.

### 4.4 Push Notification Token Registration
- The mobile client integrates device registration via `mobileApi.registerPushDevice(token, platform)` upon user authentication, securely transmitting the Expo Push Token to the backend `push_devices` table.
