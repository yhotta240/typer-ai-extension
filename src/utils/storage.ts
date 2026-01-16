/**
 * Chrome Storage 管理ユーティリティ
 */

import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

/**
 * 設定を読み込む
 */
export async function loadSettings(): Promise<AppSettings> {
  const result = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

/**
 * 設定を保存する
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await loadSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.sync.set({ settings: updated });
}

/**
 * 特定の設定項目を更新する
 */
export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await loadSettings();
  settings[key] = value;
  await chrome.storage.sync.set({ settings });
}

/**
 * 設定の変更を監視する
 */
export function watchSettings(callback: (settings: AppSettings) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.settings) {
      callback(changes.settings.newValue);
    }
  });
}
