import { Capacitor, registerPlugin } from '@capacitor/core';
import { getSettings } from './storage.js';

const RetroPhone = registerPlugin('RetroPhone');
const PERMISSIONS = ['call', 'sendSms'];

export const isNative = () => Capacitor.isNativePlatform();
export const isReal = () => isNative() && Boolean(getSettings().realMode);

export const realCall = (number) => RetroPhone.call({ number });
export const realSms = (number, body) => RetroPhone.sendSms({ number, body });
export const requestPhonePermissions = () => RetroPhone.requestPermissions({ permissions: PERMISSIONS });

let lastError = '';

export function noteError(err) {
  lastError = String((err && err.message) || err || '');
}

export const getLastError = () => lastError;

export async function phoneStatus() {
  const status = { native: isNative(), plugin: '-', call: '-', sendSms: '-' };
  if (!status.native) return status;
  try {
    const perms = await RetroPhone.checkPermissions();
    Object.assign(status, { plugin: 'ok', call: perms.call, sendSms: perms.sendSms });
  } catch (err) {
    status.plugin = 'MISSING';
    noteError(err);
  }
  return status;
}
