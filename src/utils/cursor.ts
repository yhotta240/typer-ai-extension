/**
 * カーソル位置とテキスト挿入のユーティリティ
 */

import { InsertMode } from '../types/settings';

/**
 * カーソル位置情報
 */
export interface CursorPosition {
  /** カーソル開始位置 */
  start: number;
  /** カーソル終了位置 */
  end: number;
  /** カーソル位置の画面座標 */
  rect: DOMRect;
}

/**
 * input または textarea 要素からカーソル位置を取得
 */
export function getCursorPositionFromInput(element: HTMLInputElement | HTMLTextAreaElement): CursorPosition | null {
  const start = element.selectionStart ?? 0;
  const end = element.selectionEnd ?? 0;

  // カーソル位置の画面座標を計算
  const rect = getCaretCoordinates(element, start);

  return {
    start,
    end,
    rect,
  };
}

/**
 * contenteditable 要素からカーソル位置を取得
 */
export function getCursorPositionFromContentEditable(element: HTMLElement): CursorPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.startContainer, range.startOffset);

  const start = preCaretRange.toString().length;
  const end = start + range.toString().length;

  // カーソル位置の画面座標を取得
  const rects = range.getClientRects();
  let rect: DOMRect;
  if (rects.length > 0) {
    rect = rects[rects.length - 1] as DOMRect;
  } else {
    rect = element.getBoundingClientRect();
  }

  return {
    start,
    end,
    rect,
  };
}

/**
 * input/textarea のカーソル位置の画面座標を計算
 */
function getCaretCoordinates(element: HTMLInputElement | HTMLTextAreaElement, position: number): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * input または textarea にテキストを挿入
 */
export function insertTextIntoInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  position: CursorPosition,
  mode: InsertMode
): void {
  const currentValue = element.value;
  let newValue: string;
  let newCursorPosition: number;

  switch (mode) {
    case 'insert':
      // カーソル位置に挿入
      newValue = currentValue.slice(0, position.start) + text + currentValue.slice(position.end);
      newCursorPosition = position.start + text.length;
      break;

    case 'replace':
      // 選択範囲を置換
      newValue = currentValue.slice(0, position.start) + text + currentValue.slice(position.end);
      newCursorPosition = position.start + text.length;
      break;

    case 'append':
      // 末尾に追加
      newValue = currentValue + text;
      newCursorPosition = newValue.length;
      break;

    default:
      newValue = currentValue.slice(0, position.start) + text + currentValue.slice(position.end);
      newCursorPosition = position.start + text.length;
  }

  element.value = newValue;
  element.setSelectionRange(newCursorPosition, newCursorPosition);

  // input イベントを発火（Reactなどのフレームワーク対応）
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * contenteditable にテキストを挿入
 */
export function insertTextIntoContentEditable(
  element: HTMLElement,
  text: string,
  mode: InsertMode
): void {
  element.focus();

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  console.log('Inserting text into contenteditable with mode:', range, mode);

  switch (mode) {
    case 'insert':
    case 'replace':
      // カーソル位置に挿入（選択範囲があれば置換）
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      // カーソルをテキストの末尾に移動
      range.setStart(textNode, text.length);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      break;

    case 'append':
      // 末尾に追加
      const endTextNode = document.createTextNode(text);
      element.appendChild(endTextNode);
      // カーソルを末尾に配置
      const endRange = document.createRange();
      endRange.setStart(endTextNode, text.length);
      endRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(endRange);
      break;
  }
  // フォーカスを対象要素に移動

  // input イベントを発火
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * トリガー文字を削除
 */
export function deleteTriggerCharacter(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
  triggerChar: string
): void {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const value = element.value;
    const cursorPos = element.selectionStart ?? 0;

    // カーソル直前の文字がトリガー文字の場合削除
    if (cursorPos > 0 && value[cursorPos - 1] === triggerChar) {
      element.value = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
      element.setSelectionRange(cursorPos - 1, cursorPos - 1);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
      const offset = range.startOffset;
      if (offset > 0 && textNode.textContent[offset - 1] === triggerChar) {
        const newRange = document.createRange();
        newRange.setStart(textNode, offset - 1);
        newRange.setEnd(textNode, offset);
        newRange.deleteContents();

        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}
