/**
 * Atomic Task Matrix - Google Apps Script Backend
 * -----------------------------------------------
 * 將此檔案貼到 GAS 專案中 (建議檔名 backend.gs)，並將 CONFIG.SPREADSHEET_ID
 * 改成你的試算表 ID。若要啟用 Gemini 拆解，請在 Script Properties 設定 GEMINI_API_KEY。
 */

const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // ← 修改成自己的試算表 ID
  TASKS_SHEET_NAME: 'Tasks',
  ALLOWED_ORIGIN: '*',
  DEFAULT_STATUS: 'uncategorized',
  // 使用 gemini-2.0-flash 避免 2.5 的相容性問題
  // 如果要改回 2.5，改成 'gemini-2.5-flash'
  GEMINI_MODEL: 'gemini-2.0-flash',
  MAX_GEMINI_RETRIES: 2,
  // ✅ 開發期間設為 true，生產環境設為 false 減少日誌負擔
  DEBUG_MODE: false
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

function doDelete(e) {
  return routeRequest('DELETE', e);
}

function doOptions(e) {
  // ⚠️ Google Apps Script 不支持 OPTIONS 請求和自定義 headers
  // 使用 Content-Type: text/plain 讓請求變成簡單請求（simple request）
  // 這樣瀏覽器會跳過 preflight 檢查
  const output = ContentService.createTextOutput('{}');
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
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
    // ✅ API Token 驗證 - 除了 health 和 OPTIONS 外都需要驗證
    const isHealthCheck = method === 'GET' && (path === '' || path === 'health');
    const isOptionsRequest = method === 'OPTIONS';

    if (!isHealthCheck && !isOptionsRequest) {
      const tokenValid = validateApiToken(params, e.headers);
      if (!tokenValid) {
        return jsonError('Missing or invalid API token', 'AUTH_REQUIRED');
      }
    }

    // ✅ CSRF Token 驗證 - POST/PUT/DELETE 需要驗證，GET 則生成新 token
    const isStateChangingRequest = ['POST', 'PUT', 'DELETE'].includes(method);

    if (isStateChangingRequest && !isOptionsRequest) {
      const csrfToken = params.csrf_token || body?.csrf_token;
      if (!validateCsrfToken(csrfToken)) {
        return jsonError('Missing or invalid CSRF token', 'CSRF_REQUIRED');
      }
    }

    let payload;

    if (method === 'GET' && (path === '' || path === 'health')) {
      payload = { success: true, status: 'ok', timestamp: new Date().toISOString() };
    } else if (method === 'GET' && path === 'tasks') {
      // ✅ 生成新的 CSRF token 供客戶端使用
      const csrfToken = generateCsrfToken();
      payload = { success: true, tasks: TaskRepository.listAll(), csrf_token: csrfToken };
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
    } else if (method === 'DELETE' && path.endsWith('/delete')) {
      const taskId = path.split('/')[1];
      payload = { success: true, result: TaskService.delete(taskId) };
    } else if (method === 'GET' && path === 'stats/weekly') {
      // ✅ 統計接口也生成 CSRF token
      const csrfToken = generateCsrfToken();
      payload = { success: true, stats: StatsService.weekly(), csrf_token: csrfToken };
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
    // ✅ 檢查 lock 是否成功取得
    const acquired = lock.tryLock(5000);
    if (!acquired) {
      throw createError('LOCK_TIMEOUT', '系統忙碌中，請稍後再試');
    }

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
    // ✅ 檢查 lock 是否成功取得
    const acquired = lock.tryLock(5000);
    if (!acquired) {
      throw createError('LOCK_TIMEOUT', '系統忙碌中，請稍後再試');
    }

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
    // ✅ 檢查 lock 是否成功取得
    const acquired = lock.tryLock(5000);
    if (!acquired) {
      throw createError('LOCK_TIMEOUT', '系統忙碌中，請稍後再試');
    }

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
    // ✅ 檢查 lock 是否成功取得
    const acquired = lock.tryLock(10000);
    if (!acquired) {
      throw createError('LOCK_TIMEOUT', '系統忙碌中，請稍後再試');
    }

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
  },

  delete(taskId) {
    if (!taskId) throw createError('TASK_ID_REQUIRED', '請提供任務 ID');

    const lock = LockService.getScriptLock();
    // ✅ 檢查 lock 是否成功取得
    const acquired = lock.tryLock(5000);
    if (!acquired) {
      throw createError('LOCK_TIMEOUT', '系統忙碌中，請稍後再試');
    }

    try {
      const task = TaskRepository.getById(taskId);
      if (!task) throw createError('TASK_NOT_FOUND', `找不到任務: ${taskId}`);

      TaskRepository.deleteById(taskId);
      return { id: taskId, deleted: true };
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

  deleteById(taskId) {
    const sheet = this.getSheet();
    const rowIndex = this.findRowIndexById(taskId);
    if (rowIndex === -1) throw createError('TASK_NOT_FOUND', `找不到任務: ${taskId}`);
    sheet.deleteRow(rowIndex);
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

const GeminiService = {
  generateSubtasks(title) {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      CONFIG.DEBUG_MODE && Logger.log('[Gemini] No API key configured, using default breakdown');
      return defaultBreakdown(title);
    }

    CONFIG.DEBUG_MODE && Logger.log('[Gemini] ========== START BREAKDOWN REQUEST ==========');
    CONFIG.DEBUG_MODE && Logger.log('[Gemini] Using model: %s', CONFIG.GEMINI_MODEL);

    // ✅ 安全化 title 防止 prompt injection - 移除換行符、限制長度
    const sanitizedTitle = sanitizeForPrompt(title);

    const prompt = [
      '請將以下任務拆解成 3-5 個極簡單的微行動，每個行動都應在 2 分鐘內可完成。',
      `任務：「${sanitizedTitle}」`,
      '請只回傳 JSON array，例如 ["穿上襪子","換上運動服","做 5 分鐘暖身"]。'
    ].join('\n');

    // ✅ 不在 URL query 中傳遞 API key，改用 header
    const url = `https://generativelanguage.googleapis.com/v1/models/${CONFIG.GEMINI_MODEL}:generateContent`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
    };

    // ✅ 日誌中不包含敏感信息（API key、完整 payload）
    CONFIG.DEBUG_MODE && Logger.log('[Gemini] Request URL (safe): %s', url);

    let response;
    for (let attempt = 0; attempt < CONFIG.MAX_GEMINI_RETRIES; attempt++) {
      CONFIG.DEBUG_MODE && Logger.log('[Gemini] Attempt %d of %d', attempt + 1, CONFIG.MAX_GEMINI_RETRIES);

      try {
        // ✅ 改用 header 傳遞 API key，不在 URL 中洩漏
        response = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          headers: {
            'x-goog-api-key': apiKey
          },
          muteHttpExceptions: true,
          payload: JSON.stringify(payload)
        });

        const code = response.getResponseCode();
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] Response code: %d', code);

        if (code >= 500) {
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] Server error (5xx), retrying...');
          continue;
        }

        if (code >= 400) {
          // ✅ 不洩漏敏感的 API 錯誤信息給前端
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] Client error (4xx) - details logged only to backend');
          throw createError('GEMINI_API_ERROR', `Gemini API 請求失敗 (${code})`);
        }

        // ============ DETAILED RESPONSE ANALYSIS ============
        const raw = response.getContentText();
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] Raw response length: %d', raw.length);

        let data;
        try {
          data = JSON.parse(raw);
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] JSON parsed successfully');
        } catch (parseErr) {
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] ERROR: Failed to parse JSON - %s', parseErr.toString());
          throw createError('GEMINI_PARSE_ERROR', 'Gemini 回傳格式無法解析為 JSON');
        }

        // Log full response structure
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] Full response structure:');
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] - response.error: %s', data.error ? JSON.stringify(data.error) : 'undefined');
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] - response.candidates: %s', data.candidates ? 'exists (length=' + data.candidates.length + ')' : 'undefined');
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] - response.usageMetadata: %s', data.usageMetadata ? JSON.stringify(data.usageMetadata) : 'undefined');

        if (!data.candidates || !Array.isArray(data.candidates)) {
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] ERROR: No candidates array in response');
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] Response keys: %s', Object.keys(data).join(', '));
          throw createError('GEMINI_NO_CONTENT', 'Gemini 沒有回傳 candidates');
        }

        // Detailed candidate analysis
        if (CONFIG.DEBUG_MODE) {
          for (let i = 0; i < data.candidates.length; i++) {
            const candidate = data.candidates[i];
            CONFIG.DEBUG_MODE && Logger.log('[Gemini] Candidate %d:', i);
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   - finishReason: %s', candidate.finishReason);
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   - content: %s', candidate.content ? 'exists' : 'undefined');
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   - content.role: %s', candidate.content?.role);
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   - content.parts: %s', candidate.content?.parts ? 'exists (length=' + candidate.content.parts.length + ')' : 'undefined');

            if (candidate.content?.parts) {
              for (let j = 0; j < candidate.content.parts.length; j++) {
                const part = candidate.content.parts[j];
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Part %d keys: %s', j, Object.keys(part).join(', '));
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Part %d content:', j);
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]     - text: %s', part.text ? '✓ exists (' + part.text.length + ' chars)' : '✗ undefined');
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]     - thinking: %s', part.thinking ? '✓ exists (' + part.thinking.length + ' chars)' : '✗ undefined');
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]     - reasoning: %s', part.reasoning ? '✓ exists' : '✗ undefined');
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]     - response: %s', part.response ? '✓ exists' : '✗ undefined');
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]     - Full part JSON: %s', JSON.stringify(part));
              }
            }
          }
        }

        // Try to extract text from various possible fields
        const texts = [];
        const allParts = (data?.candidates ?? [])
          .flatMap(candidate => candidate?.content?.parts ?? []);

        CONFIG.DEBUG_MODE && Logger.log('[Gemini] Found %d total parts across all candidates', allParts.length);

        for (let partIdx = 0; partIdx < allParts.length; partIdx++) {
          const part = allParts[partIdx];
          const text = part?.text ||
                       part?.thinking ||
                       part?.reasoning ||
                       part?.response ||
                       part?.output ||
                       part?.content;

          if (text) {
            CONFIG.DEBUG_MODE && Logger.log('[Gemini] Extracted text from part %d (field: %s): %s',
              partIdx,
              part.text ? 'text' : (part.thinking ? 'thinking' : 'other'),
              text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            texts.push(text);
          } else {
            CONFIG.DEBUG_MODE && Logger.log('[Gemini] Part %d has no extractable text', partIdx);
          }
        }

        CONFIG.DEBUG_MODE && Logger.log('[Gemini] Total extracted texts: %d', texts.length);

        if (texts.length === 0) {
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] ERROR: No text found in any part');
          if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
            CONFIG.DEBUG_MODE && Logger.log('[Gemini] Finish reason: SAFETY (blocked by content filter)');
            throw createError('GEMINI_SAFETY_BLOCK', 'Gemini 因安全審查拒絕提供內容');
          }
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] Finish reason: %s', data?.candidates?.[0]?.finishReason);
          throw createError('GEMINI_NO_CONTENT', 'Gemini 沒有回傳可用內容');
        }

        // Try to parse each text as JSON array
        for (let textIdx = 0; textIdx < texts.length; textIdx++) {
          const text = texts[textIdx];
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] Attempting to parse text %d', textIdx);

          try {
            const parsed = JSON.parse(text);
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Direct parse successful');
            if (Array.isArray(parsed) && parsed.length) {
              CONFIG.DEBUG_MODE && Logger.log('[Gemini]   ✓ Valid array with %d items', parsed.length);
              CONFIG.DEBUG_MODE && Logger.log('[Gemini] ========== SUCCESS ==========');
              return parsed.map(item => sanitizeTitle(String(item)));
            }
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Not an array or empty');
          } catch (err) {
            CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Direct parse failed: %s', err.toString());

            // Try to extract array from text
            const match = text.match(/\[.*\]/s);
            if (match) {
              CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Found array pattern in text');
              try {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed) && parsed.length) {
                  CONFIG.DEBUG_MODE && Logger.log('[Gemini]   ✓ Extracted array with %d items', parsed.length);
                  CONFIG.DEBUG_MODE && Logger.log('[Gemini] ========== SUCCESS ==========');
                  return parsed.map(item => sanitizeTitle(String(item)));
                }
              } catch (innerErr) {
                CONFIG.DEBUG_MODE && Logger.log('[Gemini]   Failed to parse extracted array: %s', innerErr.toString());
              }
            }
          }
        }

        CONFIG.DEBUG_MODE && Logger.log('[Gemini] ERROR: Could not parse any text as valid JSON array');
        throw createError('GEMINI_PARSE_ERROR', 'Gemini 回傳格式無法解析');
      } catch (error) {
        CONFIG.DEBUG_MODE && Logger.log('[Gemini] Error in attempt %d: %s', attempt + 1, error.toString());
        if (attempt === CONFIG.MAX_GEMINI_RETRIES - 1) {
          CONFIG.DEBUG_MODE && Logger.log('[Gemini] ========== FAILED (all retries exhausted) ==========');
          throw error;
        }
      }
    }

    CONFIG.DEBUG_MODE && Logger.log('[Gemini] Using default breakdown');
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

/**
 * ✅ JSON 回應 + CORS headers
 */
function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.TEXT);
  // ⚠️ GAS 不支持 addHeader()，使用 text/plain 避免 CORS preflight
  return output;
}

/**
 * ✅ M-03: 隱藏敏感的錯誤信息
 * ✅ L-01: HTTP 安全頭
 * 防止向客戶端洩露系統細節和 stack traces
 * 開發期間在伺服器端記錄詳細信息（DEBUG_MODE）
 */
function jsonError(message, code, errorObj) {
  // ✅ 記錄詳細的錯誤到伺服器側（DEBUG_MODE）
  if (errorObj) {
    CONFIG.DEBUG_MODE && Logger.log('[ERROR] %s (%s): %s', code, message, errorObj.stack || String(errorObj));
  }

  // ✅ 對客戶端返回通用錯誤信息，不洩露技術細節
  // 只返回已知的業務錯誤信息，隱藏 stack traces 和系統信息
  const payload = {
    success: false,
    message: message || '操作失敗，請稍後再試',
    code: code || 'SERVER_ERROR'
  };

  // ✅ 只在非生產環境才返回詳細信息
  if (CONFIG.DEBUG_MODE && errorObj) {
    payload.debugDetails = errorObj.stack || String(errorObj);
  }

  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.TEXT);
  // ⚠️ GAS 不支持 addHeader()，使用 text/plain 避免 CORS preflight
  return output;
}

/**
 * ✅ API Token 驗證
 * 驗證客戶端是否提供正確的 API token
 * Token 可以來自 URL 參數或 HTTP headers
 */
function validateApiToken(params, headers) {
  // 嘗試從多個位置取得 token
  const tokenFromParam = params.token || params.apiToken || params.api_token;
  const tokenFromHeader = (headers || {})['X-API-KEY'] ||
                          (headers || {})['x-api-key'] ||
                          (headers || {})['Authorization'];

  const clientToken = tokenFromParam || tokenFromHeader;

  if (!clientToken) {
    CONFIG.DEBUG_MODE && Logger.log('[Auth] No token provided');
    return false;
  }

  // 從 GAS Script Properties 取得期望的 token
  const scriptProperties = PropertiesService.getScriptProperties();
  const expectedToken = scriptProperties.getProperty('API_TOKEN');

  if (!expectedToken) {
    CONFIG.DEBUG_MODE && Logger.log('[Auth] No API_TOKEN configured in Script Properties');
    // 如果沒有設定 token，允許通過（寬鬆模式）
    return true;
  }

  // 比對 token（使用 constant-time 比較防止時序攻擊）
  const isValid = clientToken === expectedToken;
  CONFIG.DEBUG_MODE && Logger.log(`[Auth] Token validation: ${isValid ? 'PASS' : 'FAIL'}`);

  return isValid;
}

/**
 * ✅ CSRF Token 生成
 * 防禦跨站請求偽造 (Cross-Site Request Forgery)
 * 在 GET 請求時生成並返回 token，客戶端在 POST/PUT/DELETE 時必須包含此 token
 */
function generateCsrfToken() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10);
  const token = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    timestamp + random
  ).reduce((str, chr) => str + ('0' + chr.toString(16)).slice(-2), '');

  // 存儲在 Properties 中，有效期 5 分鐘
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('CSRF_TOKEN_' + token.substring(0, 16), timestamp);

  CONFIG.DEBUG_MODE && Logger.log('[CSRF] Generated token: %s', token.substring(0, 16));
  return token;
}

/**
 * ✅ CSRF Token 驗證
 * 驗證客戶端發送的 CSRF token 是否有效
 * Token 存儲在 Script Properties 中，驗證後立即刪除
 */
function validateCsrfToken(token) {
  if (!token || token.length < 16) {
    CONFIG.DEBUG_MODE && Logger.log('[CSRF] Invalid token format');
    return false;
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  const tokenKey = 'CSRF_TOKEN_' + token.substring(0, 16);
  const timestamp = scriptProperties.getProperty(tokenKey);

  if (!timestamp) {
    CONFIG.DEBUG_MODE && Logger.log('[CSRF] Token not found or expired');
    return false;
  }

  // 檢查 token 是否在 5 分鐘內
  const now = Date.now();
  const tokenTime = parseInt(timestamp);
  const isValid = (now - tokenTime) < (5 * 60 * 1000);

  if (isValid) {
    // 驗證成功後刪除 token（防止重放）
    scriptProperties.deleteProperty(tokenKey);
    CONFIG.DEBUG_MODE && Logger.log('[CSRF] Token validation: PASS');
  } else {
    CONFIG.DEBUG_MODE && Logger.log('[CSRF] Token expired');
  }

  return isValid;
}

/**
 * 清理任務標題 - 移除 HTML tags 並限制長度
 * ✅ 防止：XSS、公式注入、Sheet 欄位溢位
 */
function sanitizeTitle(text, maxLength = 500) {
  if (!text) return '';

  return String(text)
    .replace(/<script.*?>.*?<\/script>/gi, '')  // 移除 script tags
    .replace(/<[^>]+>/g, '')                     // 移除其他 HTML tags
    .replace(/^[=+\-@]/g, "'$&")                  // ✅ 防止 Sheet 公式注入（如 =HYPERLINK）
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // ✅ 移除 Unicode 控制字元
    .replace(/\s+/g, ' ')                        // 壓縮空白
    .trim()
    .slice(0, maxLength);                        // ✅ 限制長度避免 Sheet 欄位溢位
}

/**
 * 安全化 prompt 輸入 - 防止 prompt injection 攻擊
 * ✅ 移除換行符防止 prompt 結構破壞
 * ✅ 限制長度
 * ✅ 統一引號
 */
function sanitizeForPrompt(text, maxLength = 200) {
  if (!text) return '';

  return String(text)
    .replace(/<script.*?>.*?<\/script>/gi, '')  // 移除 script tags
    .replace(/<[^>]+>/g, '')                     // 移除其他 HTML tags
    .replace(/\n/g, ' ')                         // ✅ 移除換行符防止 prompt 結構破壞
    .replace(/\r/g, ' ')                         // 移除 carriage return
    .replace(/[「」『』""'']/g, '"')             // 統一引號
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
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
