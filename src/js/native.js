import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { handleKey, depth } from './router.js';

export function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  App.addListener('backButton', () => {
    if (depth() > 1) handleKey('back');
    else App.exitApp();
  }).catch((err) => console.error('[native] back button unavailable', err));
}
