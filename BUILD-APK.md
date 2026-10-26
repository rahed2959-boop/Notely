# Build Notely APK from CMD

The project is an Expo React Native Android app. Build a directly installable APK with EAS using the `preview` profile.

## Requirements

Install Node.js 20+, pnpm, and Git. You also need an Expo account; the Expo/EAS CLI will open the normal browser sign-in flow and does not require credentials in source files.

## Commands

```bash
pnpm install
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

When prompted by `build:configure`, accept the generated `eas.json`. If asked for an Android package identifier, keep the existing value from `app.config.ts`.

EAS will return a build page and download URL when the remote Android build finishes. Download the `.apk` file from that page and install it on an Android device. The `preview` profile produces an installable APK; a production profile normally produces an AAB for Play Store submission.

## Local-only alternative

A local Android APK requires Android Studio, the Android SDK, Java, and a configured emulator/device. After installing those tools, run:

```bash
pnpm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The resulting APK is normally under `android/app/build/outputs/apk/release/`. EAS is recommended because the managed Expo project is already configured for cloud builds.
