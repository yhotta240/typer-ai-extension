/**
 * TyperAI の設定データ型定義
 */

/**
 * トリガー文字設定
 */
export interface TriggerSettings {
  /** トリガー文字（デフォルト: ">") */
  character: string;
  /** トリガー文字の処理方法 */
  mode: 'keep' | 'delete' | 'replace';
}

/**
 * ショートカット設定
 */
export interface ShortcutSettings {
  /** 有効/無効 */
  enabled: boolean;
  /** キーコンビネーション（デフォルト: "Ctrl+Space") */
  key: string;
}

/**
 * 挿入モード
 */
export type InsertMode = 'insert' | 'replace' | 'append';

/**
 * アプリケーション設定
 */
export interface AppSettings {
  /** 拡張機能の有効/無効 */
  enabled: boolean;
  /** Gemini API キー */
  apiKey: string;
  /** トリガー設定 */
  trigger: TriggerSettings;
  /** ショートカット設定 */
  shortcut: ShortcutSettings;
  /** 挿入モード */
  insertMode: InsertMode;
}

/**
 * デフォルト設定値
 */
export const DEFAULT_SETTINGS: AppSettings = {
  enabled: true,
  apiKey: '',
  trigger: {
    character: '!',
    mode: 'delete',
  },
  shortcut: {
    enabled: true,
    key: 'Ctrl+Space',
  },
  insertMode: 'insert',
};
