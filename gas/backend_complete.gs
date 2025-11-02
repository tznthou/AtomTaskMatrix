/**
 * Atomic Task Matrix - Google Apps Script Backend (Updated for Gemini 2.5)
 * -------------------------------------------------------------------------
 * 將此檔案貼到 GAS 專案中 (建議檔名 backend.gs)，並將 CONFIG.SPREADSHEET_ID
 * 改成你的試算表 ID。若要啟用 Gemini 拆解，請在 Script Properties 設定 GEMINI_API_KEY。
 *
 * 2025-11-01 更新：修正 Gemini 2.5 回應格式問題
 */

const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // ← 修改成自己的試算表 ID
  TASKS_SHEET_NAME: 'Tasks',
  ALLOWED_ORIGIN: '*',
  DEFAULT_STATUS: 'uncategorized',
  GEMINI_MODEL: 'gemini-2.5-flash',  // 保留原設定以相容
  MAX_GEMINI_RETRIES: 2
};

// Gemini 專用配置 - 可以在這裡切換模型
const GEMINI_CONFIG = {
  // 選項 1: 使用 2.5 版本（有 thinking，但用 responseMimeType 控制）
  MODEL: 'gemini-2.5-flash',

  // 選項 2: 使用 2.0 版本（沒有 thinking 屬性，可能更穩定）
  // MODEL: 'gemini-2.0-flash',

  // 選項 3: 使用 2.5 輕量版
  // MODEL: 'gemini-2.5-flash-lite',

  MAX_RETRIES: 2
};

const STATUS_VALUES = new Set([
  'uncategorized',
  'urgent_important',
  'not_urgent_important',
  'urgent_not_important',
  'not_urgent_not_important',
  'completed'
]);

function doGet(e) {
  return routeRequest('GET', e);
}

function doPost(e) {
  return routeRequest('POST', e);
}

function doPut(e) {
  return routeRequest('PUT', e);
}

function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function routeRequest(defaultMethod, e) {
  e = e || {};
  const params = e.parameter || {};
  const methodOverride = (params._method || params.method) || null;
  const method = (methodOverride || defaultMethod || 'GET').toUpperCase();
  const pathValue = params.path || e.pathInfo;
  const path = normalizePath(pathValue);
  const body = parseJsonBody(e);

  try {
    let payload;

    if (method === 'GET' && (path === '' || path === 'health')) {
      payload = { success: true, status: 'ok', timestamp: new Date().toISOString() };
    } else if (method === 'GET' && path === 'tasks') {
      payload = { success: true, tasks: TaskRepository.listAll() };
    } else if (method === 'POST' && path === 'tasks') {
      payload = { success: true, task: TaskService.create(body) };
    } else if (method === 'POST' && path === 'tasks/update') {
      payload = { success: true, task: TaskService.updateStatus(body?.id, body?.status) };
    } else if (method === 'POST' && path.endsWith('/complete')) {
      const taskId = path.split('/')[1];
      payload = { success: true, task: TaskService.complete(taskId) };
    } else if (method === 'POST' && path.endsWith('/breakdown')) {
      const taskId = path.split('/')[1];
      const result = TaskService.breakdown(taskId);
      payload = { success: true, ...result };
    } else if (method === 'GET' && path === 'stats/weekly') {
      payload = { success: true, stats: StatsService.weekly() };
    } else {
      return jsonError(`Unknown endpoint: ${method} ${path}`, 'NOT_FOUND');
    }

    return jsonResponse(payload);
  } catch (error) {
    return jsonError(error.message || 'Unexpected error', error.code || 'SERVER_ERROR', error);
  }
}

const TaskService = {
  create(input = {}) {
    const lock = LockService.getScriptLock();
    lock.tryLock(5000);

    try {
      const now = new Date().toISOString();
      const rawTitle = input.title ?? '';
      const cleanedTitle = sanitizeTitle(rawTitle);
      const status = normalizeStatus(input.status);

      if (!cleanedTitle) {
        throw createError('TASK_TITLE_REQUIRED', '任務標題不可為空');
      }

      const task = new Task({
        id: input.id || Task.generateId(),
        title: cleanedTitle,
        status,
        parentTaskId: normalizeString(input.parent_task_id || input.parentTaskId),
        parentTaskTitle: sanitizeTitle(input.parent_task_title || input.parentTaskTitle),
        createdAt: now,
        updatedAt: now,
        completedAt: null
      });

      TaskRepository.append(task);
      return task;
    } finally {
      lock.releaseLock();
    }
  },

  updateStatus(taskId, newStatus) {
    if (!taskId) throw createError('TASK_ID_REQUIRED', '請提供任務 ID');
    const status = normalizeStatus(newStatus);
    if (!STATUS_VALUES.has(status)) {
      throw createError('INVALID_STATUS', `不支援的狀態值: ${status}`);
    }

    const lock = LockService.getScriptLock();
    lock.tryLock(5000);

    try {
      const task = TaskRepository.getById(taskId);
      if (!task) throw createError('TASK_NOT_FOUND', `找不到任務: ${taskId}`);

      task.status = status;
      task.updated_at = new Date().toISOString();
      TaskRepository.update(task);
      return task;
    } finally {
      lock.releaseLock();
    }
  },

  complete(taskId) {
    if (!taskId) throw createError('TASK_ID_REQUIRED', '請提供任務 ID');

    const lock = LockService.getScriptLock();
    lock.tryLock(5000);

    try {
      const task = TaskRepository.getById(taskId);
      if (!task) throw createError('TASK_NOT_FOUND', `找不到任務: ${taskId}`);
      if (task.status === 'completed') return task;

      const now = new Date().toISOString();
      task.status = 'completed';
      task.updated_at = now;
      task.completed_at = now;
      TaskRepository.update(task);
      return task;
    } finally {
      lock.releaseLock();
    }
  },

  breakdown(taskId) {
    if (!taskId) throw createError('TASK_ID_REQUIRED', '請提供任務 ID');

    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
      const parentTask = TaskRepository.getById(taskId);
      if (!parentTask) throw createError('TASK_NOT_FOUND', `找不到任務: ${taskId}`);

      const originalStatus = parentTask.status;
      const subtasks = GeminiService.generateSubtasks(parentTask.title);
      const now = new Date().toISOString();

      parentTask.status = 'completed';
      parentTask.updated_at = now;
      parentTask.completed_at = now;
      TaskRepository.update(parentTask);

      const createdSubtasks = [];
      subtasks.forEach(title => {
        const task = new Task({
          title,
          status: originalStatus === 'completed' ? CONFIG.DEFAULT_STATUS : originalStatus,
          parentTaskId: parentTask.id,
          parentTaskTitle: parentTask.title
        });
        TaskRepository.append(task);
        createdSubtasks.push(task);
      });

      return {
        parent: parentTask,
        subtasks: createdSubtasks
      };
    } finally {
      lock.releaseLock();
    }
  }
};

const StatsService = {
  weekly() {
    const now = new Date();
    const range = getWeekRange(now);
    const tasks = TaskRepository.listAll();

    const createdThisWeek = tasks.filter(task => withinRange(task.created_at, range));
    const completedThisWeek = tasks.filter(task => task.completed_at && withinRange(task.completed_at, range));

    const totalCreated = createdThisWeek.length;
    const totalCompleted = completedThisWeek.length;

    let avgLifetimeDays = null;
    if (totalCompleted > 0) {
      const totalLifetimeMs = completedThisWeek.reduce((sum, task) => {
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_at).getTime();
        return sum + Math.max(0, completed - created);
      }, 0);
      avgLifetimeDays = Number((totalLifetimeMs / totalCompleted / (1000 * 60 * 60 * 24)).toFixed(1));
    }

    const completionRate = totalCreated > 0
      ? Number(((totalCompleted / totalCreated) * 100).toFixed(2))
      : 0;

    return {
      week_start: range.start.toISOString().split('T')[0],
      week_end: range.end.toISOString().split('T')[0],
      total_created: totalCreated,
      total_completed: totalCompleted,
      completion_rate: completionRate,
      avg_lifetime_days: avgLifetimeDays,
      adoption_rate: null,
      updated_at: new Date().toISOString()
    };
  }
};

const TaskRepository = {
  headers: ['id', 'title', 'status', 'parent_task_id', 'parent_task_title', 'created_at', 'updated_at', 'completed_at'],

  getSheet() {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.TASKS_SHEET_NAME);
    if (!sheet) throw createError('SHEET_NOT_FOUND', `找不到分頁: ${CONFIG.TASKS_SHEET_NAME}`);
    return sheet;
  },

  listAll() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const values = sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
    return values
      .filter(row => row[0])
      .map(row => this.rowToTask(row));
  },

  append(task) {
    const sheet = this.getSheet();
    const row = this.taskToRow(task);
    sheet.appendRow(row);
  },

  update(task) {
    const sheet = this.getSheet();
    const rowIndex = this.findRowIndexById(task.id);
    if (rowIndex === -1) throw createError('TASK_NOT_FOUND', `找不到任務: ${task.id}`);
    const row = this.taskToRow(task);
    sheet.getRange(rowIndex, 1, 1, this.headers.length).setValues([row]);
  },

  getById(taskId) {
    if (!taskId) return null;
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;

    const values = sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === taskId) {
        return this.rowToTask(values[i]);
      }
    }
    return null;
  },

  findRowIndexById(taskId) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return -1;
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === taskId) {
        return i + 2;
      }
    }
    return -1;
  },

  rowToTask(row) {
    return new Task({
      id: row[0],
      title: row[1],
      status: normalizeStatus(row[2]),
      parentTaskId: normalizeString(row[3]),
      parentTaskTitle: normalizeString(row[4]),
      createdAt: row[5],
      updatedAt: row[6],
      completedAt: row[7] || null
    });
  },

  taskToRow(task) {
    return [
      task.id,
      task.title,
      task.status,
      task.parent_task_id || '',
      task.parent_task_title || '',
      task.created_at,
      task.updated_at,
      task.completed_at || ''
    ];
  }
};

// ===== 更新的 GeminiService =====
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

    Logger.log('[Gemini] Using model: %s', GEMINI_CONFIG.MODEL);
    Logger.log('[Gemini] Request URL: %s', url);
    Logger.log('[Gemini] Request prompt: %s', prompt);

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
        Utilities.sleep(1000); // 等待再重試
      }
    }

    Logger.log('[Gemini] All attempts failed, using default breakdown');
    return defaultBreakdown(title);
  }
};

function defaultBreakdown(title) {
  return [
    `釐清「${title}」的第一步`,
    `準備執行「${title}」所需的工具`,
    `安排 10 分鐘專注處理「${title}」`
  ].map(sanitizeTitle);
}

function Task({
  id = Task.generateId(),
  title,
  status = CONFIG.DEFAULT_STATUS,
  parentTaskId = null,
  parentTaskTitle = null,
  createdAt = new Date().toISOString(),
  updatedAt = createdAt,
  completedAt = null
}) {
  this.id = id;
  this.title = title.trim();
  this.status = status;
  this.parent_task_id = parentTaskId;
  this.parent_task_title = parentTaskTitle;
  this.created_at = createdAt;
  this.updated_at = updatedAt;
  this.completed_at = completedAt;
}

Task.generateId = function () {
  return 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
};

Task.prototype.clone = function (overrides) {
  return new Task({
    id: overrides?.id ?? this.id,
    title: overrides?.title ?? this.title,
    status: overrides?.status ?? this.status,
    parentTaskId: overrides?.parent_task_id ?? overrides?.parentTaskId ?? this.parent_task_id,
    parentTaskTitle: overrides?.parent_task_title ?? overrides?.parentTaskTitle ?? this.parent_task_title,
    createdAt: overrides?.created_at ?? overrides?.createdAt ?? this.created_at,
    updatedAt: overrides?.updated_at ?? overrides?.updatedAt ?? this.updated_at,
    completedAt: overrides?.completed_at ?? overrides?.completedAt ?? this.completed_at
  });
};

function normalizePath(path) {
  if (!path) return '';
  return path.replace(/^\/+|\/+$/g, '');
}

function parseJsonBody(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  const raw = e.postData.contents;
  try {
    return JSON.parse(raw);
  } catch (error) {
    const params = parseFormEncoded(raw);
    if (params.payload) {
      try {
        return JSON.parse(params.payload);
      } catch (err) {
        throw createError('INVALID_JSON', 'payload 不是合法的 JSON');
      }
    }
    return params;
  }
}

function parseFormEncoded(raw) {
  return raw.split("&").reduce((acc, pair) => {
    const [key, value] = pair.split("=");
    if (!key) return acc;
    const decodedKey = decodeURIComponent(key.replace(/\+/g, " "));
    const decodedValue = decodeURIComponent((value || '').replace(/\+/g, " "));
    acc[decodedKey] = decodedValue;
    return acc;
  }, {});
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message, code, errorObj) {
  const payload = {
    success: false,
    message,
    code
  };
  if (errorObj) {
    payload.details = errorObj.stack || String(errorObj);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeTitle(text) {
  return (text || '')
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStatus(status) {
  const value = (status || '').toString().trim();
  if (STATUS_VALUES.has(value)) return value;
  if (value === 'unclassified' || value === 'unassigned') return 'uncategorized';
  if (value === 'q1') return 'urgent_important';
  if (value === 'q2') return 'not_urgent_important';
  if (value === 'q3') return 'urgent_not_important';
  if (value === 'q4') return 'not_urgent_not_important';
  return CONFIG.DEFAULT_STATUS;
}

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function getWeekRange(referenceDate) {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function withinRange(isoString, range) {
  if (!isoString) return false;
  const time = new Date(isoString).getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}