import { GeminiResponse } from "./utils/gemini";
import { GeminiRequest, generateText } from "./utils/gemini";
import { loadSettings } from "./utils/storage";

console.log("[TyperAI Background] Backgroundが起動しました");
/**
 * メッセージハンドラー
 * Content Script からの Gemini API リクエストを処理する
 */
chrome.runtime.onMessage.addListener(
  (
    message: { action: string; prompt?: string },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: GeminiResponse) => void
  ) => {
    if (message.action === 'generateText') {
      handleGenerateText(message.prompt || '')
        .then(sendResponse)
        .catch((error) => {
          console.error('[TyperAI Background] エラー:', error);
          sendResponse({
            success: false,
            error: '予期しないエラーが発生しました．',
          });
        });
      return true; // 非同期レスポンスを示す
    }
    return false;
  }
);

/**
 * Gemini API にテキスト生成をリクエストする
 */
async function handleGenerateText(prompt: string): Promise<GeminiResponse> {
  try {
    const settings = await loadSettings();

    if (!settings.apiKey) {
      return {
        success: false,
        error: 'APIキーが設定されていません．設定画面からAPIキーを入力してください．',
      };
    }

    const request: GeminiRequest = {
      prompt,
      apiKey: settings.apiKey,
    };

    console.log('[TyperAI Background] Gemini API リクエスト送信');
    const response = await generateText(request);

    console.log('[TyperAI Background] Gemini API レスポンス:', response.success ? '成功' : '失敗');

    return response;
  } catch (error) {
    console.error('[TyperAI Background] handleGenerateText エラー:', error);
    return {
      success: false,
      error: '予期しないエラーが発生しました．',
    };
  }
}
