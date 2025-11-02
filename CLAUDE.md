# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic Task Matrix is a task management application that combines the Eisenhower Matrix with atomic habits principles. It uses AI (Google Gemini) to break down large tasks into micro-actions, helping users overcome procrastination. All data is synced to Google Sheets in real-time.

## ⚠️ Current Project Status (2025-11-02)

### Completed Features ✅
- Frontend with Brightstream theme, drag-and-drop, Focus Drawer, statistics panel
- GAS backend with REST endpoints (`/tasks`, `/tasks/update`, `/tasks/{id}/complete`, `/tasks/{id}/breakdown`, `/stats/weekly`)
- Google Sheets CRUD operations (create, read, update, complete tasks)
- Real-time sync without localStorage
- **✅ Gemini AI Task Breakdown** - FIXED! Using `gemini-2.0-flash` model

### Known Issues 🔴

1. **⏳ BLOCKING: CORS Headers Not Yet Deployed (2025-11-02)**
   - **Status**: CRITICAL - DELETE functionality blocked until deployed
   - **Root Cause**: Browser CORS preflight policy requires proper headers on OPTIONS/DELETE responses
   - **Error Message**: `Refused to execute inline script... Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header`
   - **What Was Fixed in Code**:
     - ✅ Added `doDelete(e)` function (line 40-42 in backend.gs)
     - ✅ Added CORS headers to `doOptions()` (lines 50-53)
     - ✅ Added CORS headers to `jsonResponse()` (lines 611-613)
     - ✅ Added CORS headers to `jsonError()` (lines 648-650)
   - **What Still Needs to Happen**:
     - ❌ Local file `gas/backend.gs` has been updated BUT NOT deployed to Google Apps Script
     - ❌ GAS still running old version without CORS headers
     - ❌ config.js has new GAS URL, but backend code mismatch causes sync failure
   - **Next Step (MUST DO TOMORROW)**:
     1. Copy entire updated `gas/backend.gs` content
     2. Paste into Google Apps Script editor
     3. Deploy as new Web App version
     4. Copy new URL to `config.js`
   - **Related Files Modified**:
     - `gas/backend.gs` - Added CORS headers, doDelete function, proper MIME types
     - `main.js` - CSRF token routing for DELETE (line 166-168)
     - `index.html` - CSP policy updated for inline scripts (line 9)

2. **URL Deployment Sync**
   - Each GAS redeployment generates new `/exec` URL
   - Must manually update `config.js` after deployment

3. **Gemini Prompt Quality (TODO)**
   - Current prompt in `GeminiService.generateSubtasks()` (line 345-349) may need refinement
   - Sometimes generates overly verbose or unclear subtask descriptions
   - **Location to fix**: Lines 345-349 in backend.gs
   - **Note**: This is unrelated to 2025-11-02 security fixes; affects UX only

### Resolved Issues ✅

1. **Gemini AI Breakdown (RESOLVED 2025-11-02)**
   - **Root Cause**: `gemini-2.5-flash` returns response with `thinking` field instead of `text`
   - **Solution**: Switch to `gemini-2.0-flash` model (CONFIG.GEMINI_MODEL line 15)
   - **Details**: Gemini 2.5 has different response structure for thinking models; older models use standard response format
   - Status: ✅ Working - AI breakdown successfully generates subtasks

2. **Security & Functionality Fixes (2025-11-02)**
   - **✅ CSRF Token Missing from DELETE Requests**
     - Issue: DELETE requests don't have body, so CSRF token wasn't being sent
     - Fix: Modified `main.js` line 166-168 to add CSRF token to URL parameters

   - **✅ Missing doDelete Function**
     - Issue: GAS backend lacked `doDelete(e)` function for DELETE HTTP method
     - Fix: Added function at lines 40-42 in backend.gs

   - **✅ ContentService MIME Type Incompatibility**
     - Issue: `ContentService.MimeType.JSON` not supported in GAS
     - Fix: Changed to `ContentService.MimeType.TEXT`, updated frontend JSON parsing (main.js lines 207-215)

   - **✅ CSP Violation for Inline Scripts**
     - Issue: "Refused to execute inline script" error after GAS deployment
     - Fix: Updated CSP policy in index.html line 9 to include `'unsafe-inline'`

   - **✅ CORS Headers in Code (pending deployment)**
     - Issue: Browser blocks DELETE/OPTIONS due to missing CORS headers
     - Fix: Added CORS headers to `doOptions()`, `jsonResponse()`, `jsonError()` in backend.gs
     - Status: Code is correct but NOT YET DEPLOYED to Google Apps Script

### Debugging Tips
- For Gemini issues: Check GAS logs with `[Gemini]` prefix (lines 337-518 in backend.gs)
- To switch models: Edit CONFIG.GEMINI_MODEL in backend.gs line 15
- Available models: `gemini-2.0-flash` (stable, recommended), `gemini-2.5-flash` (may have response format issues)

## Core Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), single-page application in `index.html`
- **Styling**: Tailwind CSS 4.0 via CDN
- **Backend**: Google Apps Script (`gas/backend.gs`) deployed as Web App
- **Database**: Google Sheets (Tasks and Analytics sheets)
- **AI Service**: Google Gemini API for task breakdown

### Data Flow
1. Frontend makes API calls to Google Apps Script Web App endpoint
2. GAS backend handles CRUD operations on Google Sheets
3. Task breakdown optionally uses Gemini API (if API key configured)
4. All state changes sync immediately - no local storage used

## Development Commands

### Local Development
```bash
# No build process required - just serve the HTML file
# MUST use VS Code Live Server extension to open index.html
# DO NOT use other server tools (python http.server, npm serve, etc.)
# This is a mandatory requirement per development guidelines
```

### Configuration Setup
```bash
# Copy and configure API settings
cp config.example.js config.js
# Edit config.js with your Google Apps Script Web App URL
```

### Google Apps Script Deployment
1. Create a new Google Sheets document
2. Open Extensions → Apps Script
3. Copy contents of `gas/backend.gs` to the script editor
4. Update `CONFIG.SPREADSHEET_ID` with your Sheets ID
5. **For Gemini AI**: Add Script Property `GEMINI_API_KEY` in Project Settings
6. Deploy as Web App:
   - Execute as: Me
   - Access: Anyone (including anonymous)
7. Copy the Web App URL to `config.js`
8. **Important**: Every redeployment generates a new URL - always update `config.js`

### Current Production Setup
- Spreadsheet ID: `YOUR_SPREADSHEET_ID`
- Web App URL: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
- Gemini Model: `gemini-2.5-flash` (confirmed available via API, has `thinking` attribute)

## API Endpoints

All endpoints are routed through the single Google Apps Script Web App URL.

### Core Operations
- `GET /tasks` - List all tasks
- `POST /tasks` - Create new task
- `POST /tasks/update` - Update task status (drag & drop)
- `POST /tasks/{id}/complete` - Mark task as completed
- `POST /tasks/{id}/breakdown` - AI breakdown (requires Gemini API key)
- `GET /stats/weekly` - Get weekly statistics

## Key Implementation Patterns

### Task Status Flow
```
uncategorized → [urgent_important | not_urgent_important | urgent_not_important | not_urgent_not_important] → completed
```

### Drag & Drop Implementation
- Uses HTML5 native drag/drop API
- Status updates trigger immediate API sync
- Visual feedback during drag operations
- Tasks can be dragged between quadrants and back to uncategorized

### AI Task Breakdown
When a task is broken down:
1. Original task is marked as completed
2. 3-5 subtasks are created with `parent_task_id` reference
3. Subtasks inherit the original task's quadrant
4. Subtask titles include parent reference: "🔗 來自[parent] | [subtask]"

### Real-time Sync
- No localStorage - all data lives in Google Sheets
- Every operation immediately syncs to backend
- Connection status indicator shows sync state
- Optimistic UI updates with rollback on failure

## CORS Issue Deep Dive (2025-11-02)

### Why CORS is Critical for DELETE

When browser makes DELETE request, it first sends OPTIONS (preflight) request to check if server allows it:

```
Client → OPTIONS /tasks/{id}/delete → Server
Server must respond with:
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, ...
```

If server doesn't return these headers → Browser BLOCKS DELETE automatically.

### CORS Headers Added to backend.gs

**1. `doOptions()` function (lines 44-56)** - Handles preflight requests
```javascript
function doOptions(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.TEXT);

  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization');
  output.addHeader('Access-Control-Max-Age', '86400');

  return output;
}
```

**2. `jsonResponse()` function (lines 605-616)** - All successful responses include CORS headers
```javascript
output.addHeader('Access-Control-Allow-Origin', '*');
output.addHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
output.addHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization');
```

**3. `jsonError()` function (lines 643-653)** - Error responses also include CORS headers

### Why Frontend Changes Were Also Needed

Frontend in `main.js` lines 166-168:
```javascript
// ✅ 為 DELETE 請求加入 CSRF token（因為 DELETE 通常沒有 body）
if (AppState.csrfToken) {
    url.searchParams.set("csrf_token", AppState.csrfToken);
}
```

DELETE requests have no body, so CSRF token must go in URL parameters instead of request body.

### Current Blocker Explained

- ✅ Code is complete and correct in local `gas/backend.gs`
- ❌ Google Apps Script server still running OLD version without CORS headers
- ❌ Until you deploy new backend.gs → DELETE will continue to fail
- ❌ Browser console will show: "CORS policy: Response to preflight request doesn't pass access control check"

### Tomorrow's Deployment Steps

1. Open Google Apps Script editor for the deployed project
2. Select all in the script editor (Ctrl+A)
3. Delete all content
4. Copy entire content from local `/Users/tznthou/Documents/Practice/AtomTask/gas/backend.gs`
5. Paste into GAS editor
6. Click Deploy → New deployment → Web App
7. Copy the NEW URL
8. Update `config.js` with new URL
9. Test DELETE functionality - should work now

## Common Tasks

### Debugging Gemini 2.5 Response Issues
Since Gemini 2.5 models have `thinking` attribute, response structure may differ:
1. Add extensive logging in `backend.gs`:
   ```javascript
   Logger.log('[Gemini] Full response: ' + JSON.stringify(data));
   Logger.log('[Gemini] Candidates: ' + JSON.stringify(data.candidates));
   if (data.candidates?.[0]?.content?.parts) {
     Logger.log('[Gemini] Parts: ' + JSON.stringify(data.candidates[0].content.parts));
   }
   ```
2. Check for alternative fields: `.thinking`, `.reasoning`, `.thought`
3. Try explicit response format in prompt:
   ```
   請用以下JSON格式回答：
   ["子任務1", "子任務2", "子任務3"]
   ```
4. Add `responseMimeType` to API call:
   ```javascript
   generationConfig: { responseMimeType: "text/plain" }
   ```

### Adding New Task Fields
1. Update `Task` class constructor in `main.js`
2. Add field to GAS `Task` class in `backend.gs`
3. Update `TaskRepository` methods for Sheets columns
4. Add UI elements if needed

### Modifying Task Status Types
1. Update `STATUS_VALUES` in both `main.js` and `backend.gs`
2. Update `STATUS_LABELS` and `STATUS_ACCENTS` for UI
3. Add corresponding HTML dropzone if needed

### Debugging API Issues
1. Check browser console for network errors
2. View GAS execution logs: View → Executions in Apps Script editor
3. Verify Sheets permissions and API deployment settings
4. Check connection status indicator in UI

## Important Considerations

### Security
- API keys should never be committed (use `config.js`, not tracked)
- Google Apps Script handles authentication
- Sheets permissions control data access

### Performance
- Batch operations when possible to reduce API calls
- Use lock service in GAS to prevent race conditions
- Implement debouncing for rapid user actions

### Error Handling
- All API errors should show user-friendly messages
- Connection failures should be clearly indicated
- Maintain UI consistency even when operations fail

## Code Style Guidelines

### JavaScript Conventions
- Use `const`/`let`, never `var`
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Keep functions focused and under 30 lines

### CSS Classes
- Use Tailwind utility classes exclusively
- Custom styles only in style tag if absolutely necessary
- Maintain consistent color scheme via brand variables

### Error Messages
- Always in Traditional Chinese (繁體中文)
- Clear indication of what went wrong
- Actionable suggestions when possible