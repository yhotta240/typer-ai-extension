import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { PopupPanel } from './popup/panel';
import { dateTime } from './utils/date';
import { clickURL } from './utils/dom';
import { getSiteAccessText } from './utils/permissions';
import { loadSettings, saveSettings } from './utils/storage';
import { AppSettings } from './types/settings';
import meta from '../public/manifest.meta.json';

class PopupManager {
  private panel: PopupPanel;
  private enabled: boolean = false;
  private enabledElement: HTMLInputElement | null;
  private manifestData: chrome.runtime.Manifest;
  private manifestMetadata: { [key: string]: any } = (meta as any) || {};

  constructor() {
    this.panel = new PopupPanel();
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();
    this.manifestMetadata = (meta as any) || {};

    this.loadInitialState();
    this.addEventListeners();
  }

  private async loadInitialState(): Promise<void> {
    // 拡張機能の有効/無効状態を読み込み
    if (this.enabledElement) {
      const settings = await loadSettings();
      this.enabled = settings.enabled;
      this.enabledElement.checked = this.enabled;
    }

    // 設定値の読み込み
    await this.loadSettings();

    this.showMessage(`${this.manifestData.short_name} が起動しました`);
  }

  private async loadSettings(): Promise<void> {
    const settings = await loadSettings();

    // APIキー
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    if (apiKeyInput) {
      apiKeyInput.value = settings.apiKey || '';
    }

    // トリガー文字
    const triggerCharInput = document.getElementById('trigger-char') as HTMLInputElement;
    if (triggerCharInput) {
      triggerCharInput.value = settings.trigger.character;
    }

    // トリガー文字の処理方法
    const triggerModeRadio = document.querySelector(`input[name="trigger-mode"][value="${settings.trigger.mode}"]`) as HTMLInputElement;
    if (triggerModeRadio) {
      triggerModeRadio.checked = true;
    }

    // ショートカット
    const shortcutEnabledCheckbox = document.getElementById('shortcut-enabled') as HTMLInputElement;
    if (shortcutEnabledCheckbox) {
      shortcutEnabledCheckbox.checked = settings.shortcut.enabled;
    }

    // 挿入モード
    const insertModeSelect = document.getElementById('insert-mode') as HTMLSelectElement;
    if (insertModeSelect) {
      insertModeSelect.value = settings.insertMode;
    }
  }

  private addEventListeners(): void {
    // 拡張機能の有効/無効切り替え
    if (this.enabledElement) {
      this.enabledElement.addEventListener('change', async (event) => {
        this.enabled = (event.target as HTMLInputElement).checked;
        await saveSettings({ enabled: this.enabled });
        this.showMessage(this.enabled ? `${this.manifestData.short_name} は有効になっています` : `${this.manifestData.short_name} は無効になっています`);
      });
    }

    this.setupSettingsListeners();
    this.initializeUI();
  }

  private setupSettingsListeners(): void {
    // APIキー
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    if (apiKeyInput) {
      apiKeyInput.addEventListener('change', async (event) => {
        const value = (event.target as HTMLInputElement).value;
        await saveSettings({ apiKey: value });
        this.showMessage('APIキーを保存しました');
      });
    }

    // トリガー文字
    const triggerCharInput = document.getElementById('trigger-char') as HTMLInputElement;
    if (triggerCharInput) {
      triggerCharInput.addEventListener('change', async (event) => {
        const value = (event.target as HTMLInputElement).value;
        if (value) {
          const settings = await loadSettings();
          settings.trigger.character = value;
          await saveSettings({ trigger: settings.trigger });
          this.showMessage(`トリガー文字を「${value}」に変更しました`);
        }
      });
    }

    // トリガー文字の処理方法
    const triggerModeRadios = document.querySelectorAll('input[name="trigger-mode"]');
    triggerModeRadios.forEach(radio => {
      radio.addEventListener('change', async (event) => {
        const value = (event.target as HTMLInputElement).value as 'keep' | 'delete' | 'replace';
        const settings = await loadSettings();
        settings.trigger.mode = value;
        await saveSettings({ trigger: settings.trigger });
        this.showMessage(`トリガー文字の処理方法を変更しました`);
      });
    });

    // ショートカット
    const shortcutEnabledCheckbox = document.getElementById('shortcut-enabled') as HTMLInputElement;
    if (shortcutEnabledCheckbox) {
      shortcutEnabledCheckbox.addEventListener('change', async (event) => {
        const checked = (event.target as HTMLInputElement).checked;
        const settings = await loadSettings();
        settings.shortcut.enabled = checked;
        await saveSettings({ shortcut: settings.shortcut });
        this.showMessage(`ショートカットを${checked ? '有効' : '無効'}にしました`);
      });
    }

    // 挿入モード
    const insertModeSelect = document.getElementById('insert-mode') as HTMLSelectElement;
    if (insertModeSelect) {
      insertModeSelect.addEventListener('change', async (event) => {
        const value = (event.target as HTMLSelectElement).value as 'insert' | 'replace' | 'append';
        await saveSettings({ insertMode: value });

        const modeNames: { [key: string]: string } = {
          insert: 'カーソル位置に挿入',
          replace: '選択範囲を置換',
          append: '末尾に追加',
        };
        this.showMessage(`挿入モードを「${modeNames[value]}」に変更しました`);
      });
    }
  }

  private initializeUI(): void {
    const short_name = this.manifestData.short_name || this.manifestData.name;
    const title = document.getElementById('title');
    if (title) {
      title.textContent = short_name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      titleHeader.textContent = short_name;
    }
    const enabledLabel = document.getElementById('enabled-label');
    if (enabledLabel) {
      enabledLabel.textContent = `${short_name} を有効にする`;
    }
    const newTabButton = document.getElementById('new-tab-button');
    if (newTabButton) {
      newTabButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'popup.html' });
      });
    }

    this.setupInfoTab();
  }

  private setupInfoTab(): void {
    const extensionLink = document.getElementById('extension_link') as HTMLAnchorElement;
    if (extensionLink) {
      extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
      clickURL(extensionLink);
    }

    clickURL(document.getElementById('issue-link'));
    clickURL(document.getElementById('store_link'));
    clickURL(document.getElementById('github-link'));

    const extensionId = document.getElementById('extension-id');
    if (extensionId) {
      extensionId.textContent = chrome.runtime.id;
    }
    const extensionName = document.getElementById('extension-name');
    if (extensionName) {
      extensionName.textContent = this.manifestData.name;
    }
    const extensionVersion = document.getElementById('extension-version');
    if (extensionVersion) {
      extensionVersion.textContent = this.manifestData.version;
    }
    const extensionDescription = document.getElementById('extension-description');
    if (extensionDescription) {
      extensionDescription.textContent = this.manifestData.description ?? '';
    }

    chrome.permissions.getAll((result) => {
      const permissionInfo = document.getElementById('permission-info');
      const permissions = result.permissions;
      if (permissionInfo && permissions) {
        permissionInfo.textContent = permissions.join(', ');
      }

      const siteAccess = getSiteAccessText(result.origins);
      const siteAccessElement = document.getElementById('site-access');
      if (siteAccessElement) {
        siteAccessElement.innerHTML = siteAccess;
      }
    });

    chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
      const incognitoEnabled = document.getElementById('incognito-enabled');
      if (incognitoEnabled) {
        incognitoEnabled.textContent = isAllowedAccess ? '有効' : '無効';
      }
    });

    const languageMap: { [key: string]: string } = { 'en': '英語', 'ja': '日本語' };
    const language = document.getElementById('language') as HTMLElement;
    const languages = this.manifestMetadata.languages;
    language.textContent = languages.map((lang: string) => languageMap[lang]).join(', ');

    const publisherName = document.getElementById('publisher-name') as HTMLElement;
    const publisher = this.manifestMetadata.publisher || '不明';
    publisherName.textContent = publisher;

    const developerName = document.getElementById('developer-name') as HTMLElement;
    const developer = this.manifestMetadata.developer || '不明';
    developerName.textContent = developer;

    const githubLink = document.getElementById('github-link') as HTMLAnchorElement;
    githubLink.href = this.manifestMetadata.github_url;
    githubLink.textContent = this.manifestMetadata.github_url;
  }

  private showMessage(message: string, timestamp: string = dateTime()) {
    this.panel.messageOutput(message, timestamp);
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());