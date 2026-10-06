import { Capacitor, registerPlugin } from '@capacitor/core';
import { getSettings } from './storage.js';

const RetroPhone = registerPlugin('RetroPhone');
const PERMISSIONS = ['call', 'sendSms', 'readSms'];

export const isNative = () => Capacitor.isNativePlatform();
export const isReal = () => isNative() && Boolean(getSettings().realMode);

export const realCall = (number) => RetroPhone.call({ number });
export const realSms = (number, body) => RetroPhone.sendSms({ number, body });
export const requestPhonePermissions = () => RetroPhone.requestPermissions({ permissions: PERMISSIONS });

export async function readPhoneSms(box, limit = 50) {
  const result = await RetroPhone.listSms({ box, limit });
  return Array.isArray(result.messages) ? result.messages : [];
}

let lastError = '';

export function noteError(err) {
  lastError = String((err && err.message) || err || '');
}

export const getLastError = () => lastError;

export async function phoneStatus() {
  const status = { native: isNative(), plugin: '-', call: '-', sendSms: '-', readSms: '-' };
  if (!status.native) return status;
  try {
    const perms = await RetroPhone.checkPermissions();
    Object.assign(status, { plugin: 'ok', call: perms.call, sendSms: perms.sendSms, readSms: perms.readSms });
  } catch (err) {
    status.plugin = 'MISSING';
    noteError(err);
  }
  return status;
}
