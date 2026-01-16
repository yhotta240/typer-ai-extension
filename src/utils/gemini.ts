/**
 * Gemini API クライアント
 */

/**
 * Gemini API リクエストパラメータ
 */
export interface GeminiRequest {
  prompt: string;
  apiKey: string;
}

/**
 * Gemini API レスポンス
 */
export interface GeminiResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Gemini API にテキスト生成をリクエストする
 */
const SYSTEM_PROMPT = 'あなたは入力支援を行うアシスタントです．簡潔で自然な日本語で応答し，不要な前置きや謝罪は省いて本文だけ出力してください．';

export async function generateText(request: GeminiRequest): Promise<GeminiResponse> {
  const { prompt, apiKey } = request;

  if (!apiKey) {
    return {
      success: false,
      error: 'APIキーが設定されていません．設定画面からAPIキーを入力してください．',
    };
  }

  if (!prompt || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'プロンプトが空です．',
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          role: 'system',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[TyperAI] Gemini API エラー:', errorData);

      if (response.status === 403) {
        return {
          success: false,
          error: 'APIキーが無効です．正しいAPIキーを設定してください．',
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'リクエスト制限に達しました．しばらく待ってから再試行してください．',
        };
      } else {
        return {
          success: false,
          error: `APIエラーが発生しました（ステータス: ${response.status}）`,
        };
      }
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const text = candidate.content.parts[0].text;
        return {
          success: true,
          text,
        };
      }
    }

    console.error('[TyperAI] 予期しないレスポンス形式:', data);
    return {
      success: false,
      error: 'AIから有効な応答が得られませんでした．',
    };

  } catch (error) {
    console.error('[TyperAI] Gemini API 呼び出しエラー:', error);
    return {
      success: false,
      error: `通信エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
    };
  }
}
