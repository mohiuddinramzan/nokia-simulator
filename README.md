# Retro Phone Simulator

An original classic feature-phone simulator inspired by the look and feel of early monochrome mobile phones. Vanilla JS + Vite, packaged for Android with Capacitor. No Nokia logos, firmware, icons or sounds are used; all visuals and sounds are generated in code.

## Features

- Phone body, monochrome LCD with pixel grid and glow, 21-key keypad, press animation, vibration, generated beep sounds
- Home screen: signal, battery, operator, time, date, unread-message and alarm icons
- 11-item menu with Up/Down, OK, soft keys, Back, End (number keys 1-9 jump to an item)
- Messages (inbox, sent, drafts, multi-tap typing), Contacts (add, edit, delete, search, call, message)
- Simulated calls (dial, calling, incoming, missed) and call log
- Games (Snake, Reaction test) with high scores, Calculator, Clock (stopwatch, timer), Alarm, Calendar
- Settings (display, 3 themes, sound, vibration, 12/24h, language, reset) and Profiles
- All data kept in LocalStorage; corrupt data is recovered with defaults; works offline

## Controls

| Key | Action |
|---|---|
| Soft keys | Label shown at the bottom of the screen |
| Up / Down / Left / Right, OK | Navigate and select |
| End | Back to home screen |
| Call | Open dialled numbers (home), accept call |
| `#` in text entry | Cycle Abc / abc / ABC / 123 |
| Keyboard | Arrows, Enter = OK, Esc/Backspace = back, 0-9 `*` `#`, F1/Q = left soft, F2/W = right soft, C = call, E/End = end |

Android hardware Back button goes back one screen and exits at the home screen.

## Project structure

```
nokia-simulator/
├── src/            index.html, css/, js/ (one module per feature)
├── public/         favicon
├── resources/      Android launcher icons (applied in CI)
├── scripts/        patch-android.mjs (vibration permission, portrait lock, icons)
├── .github/workflows/android-build.yml
├── capacitor.config.json, package.json, vite.config.js
```

## Development

```
npm install
npm run dev        # http://localhost:5173
npm run build      # output in dist/
npm run preview
```

## Termux (phone only, no PC)

```
pkg update
pkg upgrade
pkg install git nodejs unzip
unzip nokia-simulator-phase6.zip
cd nokia-simulator
npm install
npm run dev
```

Open `http://localhost:5173` in the phone browser. `npm run build` also works in Termux.

**Do not run in Termux:** `npx cap add android`, `npx cap sync android` and `./gradlew`. They need the Android SDK and Java, which Termux does not have. GitHub Actions does these steps.

## Push to GitHub

Create an empty repository on github.com first, then:

```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git init -b main
git add .
git commit -m "Retro Phone Simulator"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

GitHub asks for a username and a password: use a Personal Access Token (Settings, Developer settings, Personal access tokens) as the password. Alternatively `pkg install gh` and `gh auth login`.

## GitHub Actions and APK

Every push to `main` runs `.github/workflows/android-build.yml`:

1. Node 20 and JDK 17 setup
2. `npm install`, `npm run build`
3. `npx cap add android` (the `android/` folder is generated in CI)
4. `scripts/patch-android.mjs` adds the VIBRATE permission, portrait lock and icons
5. `npx cap sync android`, then `./gradlew assembleDebug`
6. Uploads `app-debug.apk` as an artifact

To get the APK: GitHub repository, **Actions** tab, open the latest run, scroll to **Artifacts**, download `retro-phone-simulator-debug-apk` (a zip), extract it and install `app-debug.apk`. Allow "Install unknown apps" for your browser or file manager.

You can also start a build manually from Actions, **Android Build**, **Run workflow**.

## Limitations

- Alarms and the countdown timer ring only while the app is open. Android pauses web apps in the background.
- Calls and SMS are simulations. No real calling, SMS or contacts permission is used.
- Language: English only.

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails in Termux | `pkg upgrade`, then `rm -rf node_modules` and retry; check free storage |
| Blank page in browser | Run `npm run dev` and open the shown URL; do not open `index.html` as a file |
| Workflow fails at `npm run build` | Open the failed step log; the first red error line shows the file |
| Workflow fails at Gradle | Re-run the job; if it repeats, copy the first `error:` line from the log |
| No Artifacts section | The run must be green; open the run page, not the repository front page |
| APK will not install | Enable installing from unknown sources; uninstall an older copy first |
| Data looks wrong | Settings, Reset app |
