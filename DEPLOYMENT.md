# FreeWebNovel Reader — Mobile Deployment & Setup Guide

This document provides a complete guide for exporting, compiling, configuring permissions, and deploying **FreeWebNovel Reader** to Android (and iOS) using **Capacitor**.

---

## 1. Required Mobile Permissions & Configuration

When deploying to Android, the native application requires specific network and storage permissions to enable live novel scraping (`CapacitorHttp`) and offline database storage (`@capacitor-community/sqlite`).

### Android Permissions (`android/app/src/main/AndroidManifest.xml`)

Add these permissions inside your `AndroidManifest.xml` file before the `<application>` tag:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network Permissions for Live Scraping -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <!-- Storage Permissions for Backup JSON Export/Import & SQLite DB -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBar"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>
    </application>
</manifest>
```

> **Note on `usesCleartextTraffic="true"`**: FreeWebNovel or image mirrors may occasionally serve covers over `http://`. Enabling cleartext traffic ensures images render smoothly without Android network security blocks.

---

## 2. Capacitor Configuration Reference (`capacitor.config.ts`)

The project is pre-configured with `CapacitorHttp` and `CapacitorSQLite`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.freewebnovel.reader',
  appName: 'FreeWebNovel Reader',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    }
  }
};

export default config;
```

---

## 3. Step-by-Step Android Deployment Workflow

### Prerequisites
- **Node.js**: v18+ or v20+
- **Android Studio**: Jellyfish / Koala or newer with SDK 34+
- **Java Development Kit (JDK)**: JDK 17 (recommended for Gradle 8+)

---

### Step 1: Export & Download Workspace
1. In AI Studio, click the **Settings / Export** menu in the top-right corner.
2. Select **Export to ZIP** or push to a GitHub repository.
3. Extract the ZIP on your local machine.

---

### Step 2: Install Dependencies & Build Web Assets
Open your terminal in the root project folder:

```bash
# 1. Install all npm packages
npm install

# 2. Compile React + Vite frontend into /dist
npm run build
```

> **CRITICAL**: You must run `npm run build` *before* syncing Capacitor, so that Vite produces `dist/index.html`.

---

### Step 3: Add and Sync the Android Platform

```bash
# 1. Add Android native project (run once)
npx cap add android

# 2. Sync web dist/ bundle and Capacitor plugins into Android native folder
npx cap sync android
```

---

### Step 4: Open and Build in Android Studio

```bash
# Launches Android Studio with the android/ project directory
npx cap open android
```

In Android Studio:
1. Wait for Gradle Sync to complete.
2. Connect your Android phone via USB (with **USB Debugging** enabled) or start an Android Virtual Device (AVD).
3. Click the green **Run (Play button)** or navigate to **Build → Build APK(s)** to generate a test `.apk` file.

The output APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. How Cloudflare 403 Is Resolved on Mobile

| Environment | Request Engine | Network IP Type | Cloudflare Result |
| :--- | :--- | :--- | :--- |
| **Web Preview Container** | Node.js Server Proxy | Datacenter Cloud Run IP (`34.x.x.x`) | Blocked (HTTP 403 Challenge) |
| **Native Android App** | `CapacitorHttp` (Android `OkHttp`) | Residential / Carrier IP (4G/5G/Wi-Fi) | **Allowed (HTTP 200 Success)** |

Because requests on mobile run through the user's native device network stack rather than a datacenter proxy IP, Cloudflare protection permits live HTML scraping and chapter downloads directly on mobile devices.

---

## 5. Generating a Release Signed APK / AAB for Google Play

To create a signed Release bundle for distribution:

1. Generate a keystore file:
   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release
   ```

2. Configure `android/app/build.gradle`:
   ```groovy
   android {
       ...
       signingConfigs {
           release {
               storeFile file('release-key.jks')
               storePassword 'YOUR_PASSWORD'
               keyAlias 'release'
               keyPassword 'YOUR_PASSWORD'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. Generate the Android App Bundle (AAB):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   The `.aab` bundle will be generated under `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 6. Troubleshooting Common Deployment Issues

### Issue 1: "Blank White Screen on App Launch"
- **Cause**: Incorrect asset base path in Vite configuration.
- **Fix**: Ensure `vite.config.ts` sets `base: './'`.

### Issue 2: "SQLite Table Not Created / Database Error"
- **Cause**: `@capacitor-community/sqlite` requires initialization listeners.
- **Fix**: The included `src/services/db.ts` handles auto-migrations and fallback gracefully on web and native platforms.

### Issue 3: "Network Error on Image Loading"
- **Cause**: Android blocking unencrypted `http://` cover URLs.
- **Fix**: Verify `android:usesCleartextTraffic="true"` is set in `AndroidManifest.xml`.
