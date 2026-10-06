import { existsSync, readFileSync, writeFileSync, cpSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const main = 'android/app/src/main';
const manifestPath = join(main, 'AndroidManifest.xml');

if (!existsSync(manifestPath)) {
  console.error('Android project not found. Run "npx cap add android" first.');
  process.exit(1);
}

let manifest = readFileSync(manifestPath, 'utf8');
const permissions = ['VIBRATE', 'CALL_PHONE', 'SEND_SMS', 'READ_SMS'];
permissions.forEach((name) => {
  if (manifest.includes(`android.permission.${name}"`)) return;
  manifest = manifest.replace('</manifest>', `    <uses-permission android:name="android.permission.${name}" />\n</manifest>`);
});
if (!manifest.includes('android.hardware.telephony')) {
  manifest = manifest.replace('</manifest>', '    <uses-feature android:name="android.hardware.telephony" android:required="false" />\n</manifest>');
}
if (!manifest.includes('android:screenOrientation')) {
  manifest = manifest.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
}
writeFileSync(manifestPath, manifest);

const bgPath = join(main, 'res/values/ic_launcher_background.xml');
if (existsSync(bgPath)) {
  writeFileSync(bgPath, readFileSync(bgPath, 'utf8').replace(/#[0-9A-Fa-f]{6}/, '#0E1114'));
}

let copied = 0;
if (existsSync('resources/android')) {
  readdirSync('resources/android').forEach((dir) => {
    readdirSync(join('resources/android', dir)).forEach((file) => {
      const target = join(main, 'res', dir, file);
      if (!existsSync(target)) return;
      cpSync(join('resources/android', dir, file), target);
      copied += 1;
    });
  });
}
const appId = JSON.parse(readFileSync('capacitor.config.json', 'utf8')).appId;
const javaDir = join(main, 'java', ...appId.split('.'));
mkdirSync(javaDir, { recursive: true });
readdirSync('resources/android-native').forEach((file) => {
  const code = readFileSync(join('resources/android-native', file), 'utf8').replaceAll('__PACKAGE__', appId);
  writeFileSync(join(javaDir, file), code);
});

console.log(`Android project patched (${copied} icons replaced).`);
