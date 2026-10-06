# Developing Retro Phone Simulator

Vanilla JS + Vite, packaged for Android with Capacitor. The APK is built by GitHub Actions.

## Project structure

```
nokia-simulator/
├── src/            index.html, css/, js/ (one module per feature)
├── public/         favicon
├── docs/           README screenshot
├── resources/      Android launcher icons (applied in CI)
├── scripts/        patch-android.mjs (vibration permission, portrait lock, icons)
├── .github/workflows/android-build.yml
├── capacitor.config.json, package.json, vite.config.js
```

## Run locally

```
npm install
npm run dev        # http://localhost:5173
npm run build      # output in dist/
```

### Termux

```
pkg update
pkg upgrade
pkg install git nodejs unzip
npm install
npm run dev
```

Do not run `npx cap add android`, `npx cap sync android` or `./gradlew` in Termux. They need the Android SDK and Java. GitHub Actions does these steps.

## GitHub Actions and releases

`.github/workflows/android-build.yml` runs on every push to `main`, on tags starting with `v`, and manually from the Actions tab.

1. Node 20 and JDK 17, `npm install`, `npm run build`
2. `npx cap add android` (the `android/` folder is generated in CI)
3. `scripts/patch-android.mjs` adds the VIBRATE permission, portrait lock and icons
4. `npx cap sync android`, then `./gradlew assembleDebug`
5. The APK is renamed `retro-phone-simulator-vX.Y.Z.apk`, uploaded as an artifact, and published to a GitHub Release

The release tag comes from the `version` in `package.json` (for example `v1.0.0`), or from the tag name when you push a tag. If the release already exists, its APK is replaced.

### Publish a new version

```
npm version minor --no-git-tag-version
git add . && git commit -m "Release 1.1.0"
git push
```

This creates release `v1.1.0` with the new APK. Pull requests only build; they do not publish.

## Native plugin (real calls and SMS)

`resources/android-native/` holds `RetroPhonePlugin.java` (call, sendSms, permissions) and `MainActivity.java`. `scripts/patch-android.mjs` copies them into the generated Android project (replacing `__PACKAGE__` with the appId) and adds the CALL_PHONE and SEND_SMS permissions. The web side is `src/js/phone.js`; it is used only when `Capacitor.isNativePlatform()` and the `realMode` setting is on. The plugin is not testable in the browser, only on a device.

## Repository About and topics (GitHub CLI)

```
gh repo edit \
  --description "Retro feature-phone simulator for Android: monochrome screen, SMS, contacts, calls, Snake, alarm and more. Works offline." \
  --add-topic retro,feature-phone,phone-simulator,android,capacitor,vite,vanilla-javascript,snake-game,offline,github-actions
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails in Termux | `pkg upgrade`, remove `node_modules`, retry, check free storage |
| Blank page in browser | Use `npm run dev` and open the shown URL, not the file |
| Workflow fails at build | Open the failed step; the first red error line names the file |
| Workflow fails at Gradle | Re-run the job; if it repeats, copy the first `error:` line |
| Release step fails with 403 | Repository Settings, Actions, General, Workflow permissions: Read and write |
| No release appears | The run must be green and triggered by a push or tag, not a pull request |
