/**
 * Atomic Task Matrix - Google Apps Script Backend (Updated for Gemini 2.5)
 * -------------------------------------------------------------------------
 * 修正版本：支援 Gemini 2.5 的回應格式
 * 主要更新：GeminiService.generateSubtasks 函數
 *
 * 注意：如果 gemini-2.5-flash 有問題，可以改用：
 * - gemini-2.0-flash (沒有 thinking 屬性)
 * - gemini-2.5-flash-lite (輕量版)
 */

// 配置 - 可以在這裡切換模型
const GEMINI_CONFIG = {
  // 選項 1: 使用 2.5 版本（有 thinking，但用 responseMimeType 控制）
  MODEL: 'gemini-2.5-flash',

  // 選項 2: 使用 2.0 版本（沒有 thinking 屬性，可能更穩定）
  // MODEL: 'gemini-2.0-flash',

  // 選項 3: 使用 2.5 輕量版
  // MODEL: 'gemini-2.5-flash-lite',

  MAX_RETRIES: 2
};

// 只包含更新的 GeminiService 部分
const GeminiService = {
  generateSubtasks(title) {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      Logger.log('[Gemini] No API key, using default breakdown');
      return defaultBreakdown(title);
    }

    // 更明確的 prompt，強調純 JSON 格式，避免 thinking
    const prompt = [
      '直接回答，不要思考過程。',
      '請將以下任務拆解成 3-5 個極簡單的微行動，每個行動都應在 2 分鐘內可完成。',
      `任務：「${title}」`,
      '',
      '重要指示：',
      '1. 請只回傳 JSON 陣列格式',
      '2. 不要包含任何解釋、思考過程、說明或 markdown',
      '3. 不要說明你的思考，直接給出結果',
      '4. 格式必須是：["動作1", "動作2", "動作3"]',
      '5. 每個動作要具體且可立即執行',
      '6. 不要使用 ```json``` 標記',
      '',
      '範例輸出：["穿上運動鞋", "走到門口", "打開門走出去"]'
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.MODEL}:generateContent?key=${apiKey}`;

    // 加入 responseMimeType 來強制 JSON 格式
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400,
        responseMimeType: "application/json"  // 強制 JSON 輸出
      }
    };

    Logger.log('[Gemini] Request URL: %s', url);
    Logger.log('[Gemini] Request payload: %s', JSON.stringify(payload));

    let response;
    for (let attempt = 0; attempt < GEMINI_CONFIG.MAX_RETRIES; attempt++) {
      try {
        response = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          muteHttpExceptions: true,
          payload: JSON.stringify(payload)
        });

        const code = response.getResponseCode();
        Logger.log('[Gemini] Response code: %s', code);

        if (code >= 500) {
          Logger.log('[Gemini] Server error, retrying... (attempt %s)', attempt + 1);
          Utilities.sleep(1000); // 等待 1 秒再重試
          continue;
        }

        if (code >= 400) {
          const errorText = response.getContentText();
          Logger.log('[Gemini] Client error: %s', errorText);
          throw createError('GEMINI_API_ERROR', `Gemini API 回傳 ${code}: ${errorText}`);
        }

        const raw = response.getContentText();
        Logger.log('[Gemini] Raw response: %s', raw);

        const data = JSON.parse(raw);

        // 詳細記錄回應結構
        Logger.log('[Gemini] Full data structure: %s', JSON.stringify(data));

        if (data.candidates && data.candidates[0]) {
          Logger.log('[Gemini] First candidate: %s', JSON.stringify(data.candidates[0]));

          if (data.candidates[0].content?.parts) {
            Logger.log('[Gemini] Parts array: %s', JSON.stringify(data.candidates[0].content.parts));

            // 檢查每個 part 的所有欄位
            data.candidates[0].content.parts.forEach((part, index) => {
              Logger.log('[Gemini] Part %s keys: %s', index, Object.keys(part).join(', '));
              Logger.log('[Gemini] Part %s content: %s', index, JSON.stringify(part));
            });
          }
        }

        // 提取文字內容 - 支援多種可能的欄位
        const texts = [];
        if (data?.candidates) {
          for (const candidate of data.candidates) {
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                // 嘗試各種可能的欄位
                const text = part?.text ||
                           part?.thinking ||
                           part?.reasoning ||
                           part?.output ||
                           part?.content ||
                           (typeof part === 'string' ? part : null);

                if (text) {
                  Logger.log('[Gemini] Found text in part: %s', text);
                  texts.push(text);
                }
              }
            }
          }
        }

        Logger.log('[Gemini] Extracted texts: %s', JSON.stringify(texts));

        if (texts.length === 0) {
          // 檢查是否被安全過濾器阻擋
          if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
            Logger.log('[Gemini] Blocked by safety filter');
            throw createError('GEMINI_SAFETY_BLOCK', 'Gemini 因安全審查拒絕提供內容');
          }

          // 檢查是否有其他 finishReason
          const finishReason = data?.candidates?.[0]?.finishReason;
          if (finishReason) {
            Logger.log('[Gemini] Finish reason: %s', finishReason);
          }

          Logger.log('[Gemini] No text found in response');
          throw createError('GEMINI_NO_CONTENT', 'Gemini 沒有回傳可用內容');
        }

        // 嘗試解析每個文字內容
        for (const text of texts) {
          try {
            // 直接嘗試解析為 JSON
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length > 0) {
              Logger.log('[Gemini] Successfully parsed JSON array: %s', JSON.stringify(parsed));
              return parsed.map(item => sanitizeTitle(String(item)));
            }
          } catch (err) {
            Logger.log('[Gemini] Direct JSON parse failed, trying to extract array');

            // 嘗試從文字中提取 JSON 陣列
            const match = text.match(/\[[\s\S]*?\]/);
            if (match) {
              try {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  Logger.log('[Gemini] Successfully extracted and parsed array: %s', JSON.stringify(parsed));
                  return parsed.map(item => sanitizeTitle(String(item)));
                }
              } catch (innerErr) {
                Logger.log('[Gemini] Failed to parse extracted array: %s', innerErr.toString());
              }
            }

            // 如果還是失敗，嘗試按行分割
            const lines = text.split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
              .map(line => line.replace(/^[-*·•]\s*/, '').replace(/^["']|["']$/g, ''))
              .filter(line => line.length > 0);

            if (lines.length >= 3) {
              Logger.log('[Gemini] Fallback to line splitting: %s', JSON.stringify(lines.slice(0, 5)));
              return lines.slice(0, 5).map(item => sanitizeTitle(item));
            }
          }
        }

        throw createError('GEMINI_PARSE_ERROR', 'Gemini 回傳格式無法解析');
      } catch (error) {
        Logger.log('[Gemini] Error in attempt %s: %s', attempt + 1, error.toString());
        if (attempt === GEMINI_CONFIG.MAX_RETRIES - 1) {
          throw error;
        }
      }
    }

    Logger.log('[Gemini] All attempts failed, using default breakdown');
    return defaultBreakdown(title);
  }
};

// 保持原本的 defaultBreakdown 函數
function defaultBreakdown(title) {
  return [
    `釐清「${title}」的第一步`,
    `準備執行「${title}」所需的工具`,
    `安排 10 分鐘專注處理「${title}」`
  ].map(sanitizeTitle);
}

// 保持原本的 createError 函數
function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// 保持原本的 sanitizeTitle 函數
function sanitizeTitle(text) {
  return (text || '')
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}