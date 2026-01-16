/**
 * ミニUI クラス
 * インライン要素として，ページのDOMに直接挿入される
 */

export interface MiniUIOptions {
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
}

export class MiniUI {
  private container: HTMLDivElement | null = null;
  private promptInput: HTMLTextAreaElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private errorMessage: HTMLDivElement | null = null;
  private isGenerating: boolean = false;
  private options: MiniUIOptions;

  constructor(options: MiniUIOptions) {
    this.options = options;
  }

  /**
   * ミニUIを表示
   */
  show(top: number, left: number): void {
    if (this.container) {
      this.remove();
    }

    this.createDOM(top, left);
    this.setupEventListeners();
    this.promptInput?.focus();
  }

  /**
   * DOMを作成
   */
  private createDOM(top: number, left: number): void {
    // コンテナを作成
    this.container = document.createElement('div');
    this.container.id = 'typer-ai-miniui-container';
    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;

    // HTML構造を作成
    this.container.innerHTML = this.createHTML();

    document.body.appendChild(this.container);

    // 要素を取得
    this.promptInput = this.container.querySelector('#typer-prompt-input') as HTMLTextAreaElement;
    this.submitButton = this.container.querySelector('#typer-submit-btn') as HTMLButtonElement;
    const closeButton = this.container.querySelector('#typer-close-btn') as HTMLButtonElement;
    this.errorMessage = this.container.querySelector('#typer-error-msg') as HTMLDivElement;

    // ボタンのホバー効果
    this.submitButton?.addEventListener('mouseenter', () => {
      if (this.submitButton && !this.submitButton.disabled) {
        if (this.isGenerating) {
          this.submitButton.style.background = '#8b7a9b';
          this.submitButton.style.boxShadow = '0 4px 12px rgba(139, 122, 155, 0.4)';
        } else {
          this.submitButton.style.background = 'linear-gradient(135deg, #5f70d9 0%, #6b3e91 100%)';
          this.submitButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }
      }
    });
    this.submitButton?.addEventListener('mouseleave', () => {
      if (this.submitButton && !this.submitButton.disabled) {
        if (this.isGenerating) {
          this.submitButton.style.background = '#999';
          this.submitButton.style.boxShadow = '0 2px 8px rgba(153, 153, 153, 0.3)';
        } else {
          this.submitButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          this.submitButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        }
      }
    });

    closeButton?.addEventListener('click', () => this.options.onCancel());
  }

  /**
   * HTML構造を生成
   */
  private createHTML(): string {
    return `
      <div>
        <div class="typer-header">
          <div class="typer-title">TyperAI</div>
          <button id="typer-close-btn">×</button>
        </div>

        <div id="typer-error-msg"></div>

        <div class="typer-input-group">
          <textarea 
            id="typer-prompt-input"
            placeholder="何をしたいですか？"
          ></textarea>
          <button id="typer-submit-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="typer-submit-icon" viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    this.submitButton?.addEventListener('click', () => {
      if (this.isGenerating) {
        this.options.onCancel();
      } else {
        this.handleSubmit();
      }
    });

    this.promptInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.options.onCancel();
      }
    });
  }

  /**
   * 送信処理
   */
  private handleSubmit(): void {
    const prompt = this.promptInput?.value?.trim();

    if (!prompt) {
      this.showError('プロンプトを入力してください．');
      return;
    }

    this.hideError();
    this.setLoading(true);
    this.options.onSubmit(prompt);
  }

  /**
   * ローディング状態を設定
   */
  setLoading(loading: boolean): void {
    this.isGenerating = loading;
    if (loading) {
      if (this.submitButton) {
        this.submitButton.textContent = '✕';
        this.submitButton.style.background = '#999';
        this.submitButton.style.boxShadow = '0 2px 8px rgba(153, 153, 153, 0.3)';
        this.submitButton.disabled = false;
      }
      if (this.promptInput) this.promptInput.disabled = true;
    } else {
      if (this.submitButton) {
        this.submitButton.textContent = '✈️';
        this.submitButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.submitButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        this.submitButton.disabled = false;
      }
      if (this.promptInput) this.promptInput.disabled = false;
    }
  }

  /**
   * エラーメッセージを表示
   */
  showError(message: string): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    }
  }

  /**
   * エラーメッセージを非表示
   */
  private hideError(): void {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
  }

  /**
   * ミニUIを削除
   */
  remove(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
