import { existsSync, readFileSync, writeFileSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const main = 'android/app/src/main';
const manifestPath = join(main, 'AndroidManifest.xml');

if (!existsSync(manifestPath)) {
  console.error('Android project not found. Run "npx cap add android" first.');
  process.exit(1);
}

let manifest = readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android.permission.VIBRATE')) {
  manifest = manifest.replace('</manifest>', '    <uses-permission android:name="android.permission.VIBRATE" />\n</manifest>');
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
console.log(`Android project patched (${copied} icons replaced).`);
