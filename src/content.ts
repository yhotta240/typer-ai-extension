import { loadSettings } from './utils/storage';
import { AppSettings } from './types/settings';
import {
  getCursorPositionFromInput,
  getCursorPositionFromContentEditable,
  insertTextIntoInput,
  insertTextIntoContentEditable,
  deleteTriggerCharacter,
  CursorPosition,
} from './utils/cursor';
import { MiniUI } from './content/miniui-ui';

class TyperAI {
  private settings: AppSettings | null = null;
  private miniUI: MiniUI | null = null;
  private targetElement: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;
  private cursorPosition: CursorPosition | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 初期化
   */
  private async initialize(): Promise<void> {
    console.log('[TyperAI Content] 初期化開始');

    // 設定を読み込む
    this.settings = await loadSettings();

    if (!this.settings.enabled) {
      console.log('[TyperAI Content] 拡張機能が無効になっています');
      return;
    }

    // イベントリスナーを設定
    this.setupEventListeners();

    console.log('[TyperAI Content] 初期化完了');
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // キー入力を監視（トリガー文字検知）
    document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);

    // ショートカットキーを監視
    document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
  }

  /**
   * キー入力ハンドラー（トリガー文字検知）
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.settings || this.miniUI) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!this.isValidInputElement(target)) {
      return;
    }

    // トリガー文字が入力されたかチェック
    const triggerChar = this.settings.trigger.character;
    if (event.key === triggerChar) {
      this.showMiniUI(target);
    }
  }

  /**
   * キーダウンハンドラー（ショートカット検知）
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.settings || !this.settings.shortcut.enabled || this.miniUI) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!this.isValidInputElement(target)) {
      return;
    }

    // ショートカットキーのチェック（Ctrl+Space）
    if (event.ctrlKey && event.code === 'Space') {
      event.preventDefault();
      this.showMiniUI(target);
    }
  }

  /**
   * 入力要素が有効かチェック
   */
  private isValidInputElement(element: HTMLElement): boolean {
    // input[type="text"] または textarea
    if (element instanceof HTMLInputElement && element.type === 'text') {
      return true;
    }
    if (element instanceof HTMLTextAreaElement) {
      return true;
    }
    // contenteditable
    if (element.isContentEditable) {
      return true;
    }
    return false;
  }

  /**
   * ミニUIを表示
   */
  private showMiniUI(element: HTMLInputElement | HTMLTextAreaElement | HTMLElement): void {
    if (!this.settings) {
      return;
    }

    this.targetElement = element;

    // カーソル位置を取得
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      this.cursorPosition = getCursorPositionFromInput(element);
    } else if (element.isContentEditable) {
      this.cursorPosition = getCursorPositionFromContentEditable(element);
    }

    if (!this.cursorPosition) {
      console.error('[TyperAI Content] カーソル位置の取得に失敗しました');
      return;
    }

    // トリガー文字を削除（設定による）
    if (this.settings.trigger.mode === 'delete') {
      deleteTriggerCharacter(element, this.settings.trigger.character);
    }

    // ミニUIを作成して表示
    this.createMiniUI();
  }

  /**
   * ミニUIを作成
   */
  private createMiniUI(): void {
    if (!this.cursorPosition) {
      return;
    }

    this.miniUI = new MiniUI({
      onSubmit: (prompt) => this.handleSubmit(prompt),
      onCancel: () => this.closeMiniUI(),
    });

    // カーソルの下の位置にミニUIを表示
    this.miniUI.show(this.cursorPosition.rect.bottom, this.cursorPosition.rect.left);
  }

  /**
   * プロンプト送信処理
   */
  private async handleSubmit(prompt: string): Promise<void> {
    if (!this.targetElement || !this.cursorPosition || !this.settings || !this.miniUI) {
      return;
    }

    try {
      this.miniUI.setLoading(true);

      // Background Script に Gemini API リクエストを送信
      const response = await chrome.runtime.sendMessage({
        action: 'generateText',
        prompt,
      });

      if (response.success && response.text) {
        // 生成されたテキストを挿入
        this.insertGeneratedText(response.text);
        this.closeMiniUI();
      } else {
        // エラーメッセージを表示
        this.miniUI.showError(response.error || '不明なエラーが発生しました．');
      }
    } catch (error) {
      console.error('[TyperAI Content] プロンプト送信エラー:', error);
      if (this.miniUI) {
        this.miniUI.showError('通信エラーが発生しました．');
      }
    }
  }

  /**
   * 生成されたテキストを挿入
   */
  private insertGeneratedText(text: string): void {
    if (!this.targetElement || !this.cursorPosition || !this.settings) {
      return;
    }

    const mode = this.settings.insertMode;

    if (this.targetElement instanceof HTMLInputElement || this.targetElement instanceof HTMLTextAreaElement) {
      insertTextIntoInput(this.targetElement, text, this.cursorPosition, mode);
    } else if (this.targetElement.isContentEditable) {
      insertTextIntoContentEditable(this.targetElement, text, mode);
    }

    // フォーカスを元の要素に戻す
    this.targetElement.focus();
  }

  /**
   * ミニUIを閉じる
   */
  private closeMiniUI(): void {
    if (this.miniUI) {
      this.miniUI.remove();
      this.miniUI = null;
    }

    // フォーカスを元の要素に戻す
    if (this.targetElement) {
      this.targetElement.focus();
      this.targetElement = null;
    }

    this.cursorPosition = null;
  }
}

// Content Script を起動
new TyperAI();