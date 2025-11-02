# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic Task Matrix is a task management application that combines the Eisenhower Matrix with atomic habits principles. It uses AI (Google Gemini) to break down large tasks into micro-actions, helping users overcome procrastination. All data is synced to Google Sheets in real-time.

## ⚠️ Current Project Status (2025-11-02)

### Completed Features ✅
- **Frontend Architecture**: Modularized into 12 files with 5-layer architecture (1056 lines total)
- **UI**: **Memphis Design** (粗邊框 + 彩色偏移陰影 + 旋轉元素), drag-and-drop, statistics panel, Heroicons SVG icons
- **Backend**: GAS with REST endpoints (`/tasks`, `/tasks/update`, `/tasks/{id}/complete`, `/tasks/{id}/breakdown`, `/stats/weekly`)
- **Database**: Google Sheets CRUD operations (create, read, update, delete, complete tasks)
- **Sync**: Real-time sync without localStorage
- **AI**: Gemini AI Task Breakdown using `gemini-2.0-flash` model
- **UX**: Direct AI breakdown button on task cards, time information display on cards
- **Deployment**: Production-ready on Zeabur (https://task-matrix.zeabur.app/)
- **All Core Functionality**: ✅ 建立任務、拖放分類、AI 分析、刪除任務、完成任務

### Known Issues 🔴

1. **Gemini Prompt Quality (TODO)**
   - Current prompt in `GeminiService.generateSubtasks()` (line 345-349 in backend.gs) may need refinement
   - Sometimes generates overly verbose or unclear subtask descriptions
   - **Location to fix**: Lines 345-349 in backend.gs
   - **Priority**: Low - affects UX only, not functionality

### Resolved Issues ✅

1. **Main.js Modularization (RESOLVED 2025-11-02)**
   - **Challenge**: 1107-line monolithic file difficult to maintain
   - **Solution**: Refactored into 12 modules with 5-layer architecture
   - **Benefits**: Clear separation of concerns, easier testing, better maintainability
   - **Files Created**:
     - Layer 1: `core/constants.js`, `core/icons.js`, `models/Task.js`
     - Layer 2: `core/config.js`, `core/state.js`
     - Layer 3: `services/BackendGateway.js`
     - Layer 4: `handlers/DragDropHandler.js`, `ui/Renderer.js`, `managers/TaskManager.js`, `monitors/ConnectionMonitor.js`
     - Layer 5: `app/events.js`, `app/bootstrap.js`
   - Status: ✅ Deployed to production, all features working

2. **DELETE Functionality & CORS (RESOLVED 2025-11-02)**
   - **✅ CSRF Token Missing from DELETE Requests**
     - Issue: DELETE requests don't have body, so CSRF token wasn't being sent
     - Fix: Modified `services/BackendGateway.js` to add CSRF token to URL parameters

   - **✅ Missing doDelete Function**
     - Issue: GAS backend lacked `doDelete(e)` function for DELETE HTTP method
     - Fix: Added function at lines 40-42 in backend.gs

   - **✅ CORS Headers**
     - Issue: Browser blocks DELETE/OPTIONS due to missing CORS headers
     - Fix: Added CORS headers to `doOptions()`, `jsonResponse()`, `jsonError()` in backend.gs
     - Status: ✅ Deployed to GAS, DELETE functionality working in production

   - **✅ ContentService MIME Type Incompatibility**
     - Issue: `ContentService.MimeType.JSON` not supported in GAS
     - Fix: Changed to `ContentService.MimeType.TEXT`, updated frontend JSON parsing

   - **✅ CSP Violation for Inline Scripts**
     - Issue: "Refused to execute inline script" error after GAS deployment
     - Fix: Updated CSP policy in index.html line 9 to include `'unsafe-inline'`

3. **Gemini AI Breakdown (RESOLVED 2025-11-02)**
   - **Root Cause**: `gemini-2.5-flash` returns response with `thinking` field instead of `text`
   - **Solution**: Switch to `gemini-2.0-flash` model (CONFIG.GEMINI_MODEL line 15)
   - **Details**: Gemini 2.5 has different response structure for thinking models; older models use standard response format
   - Status: ✅ Working - AI breakdown successfully generates subtasks

4. **UX Improvement: AI Breakdown Access (RESOLVED 2025-11-02)**
   - **Issue**: Required clicking "Focus" before accessing AI breakdown (3 steps total)
   - **Solution**: Added direct AI button on task cards (1 step)
   - **Implementation**:
     - Task card AI button with heroicons sparkles icon
     - Time information (created/updated/completed) directly on task cards
   - Status: ✅ Deployed to production

5. **Memphis Design Implementation (RESOLVED 2025-11-02)**
   - **Motivation**: User requested bold design update: "我覺得應該連整個UX都要大修改...設計可以大膽一點"
   - **Design Phase**: Created 3 mockups (Memphis, Neumorphism, Art Deco)
   - **User Selection**: Final choice - Pure Memphis Design
   - **Implementation**:
     - Updated `tailwind-config.js` with Memphis color system and shadows
     - Applied 150+ CSS class changes to `index.html` while preserving HTML structure
     - Result: Thick black borders (4-5px), geometric elements, color-shifted shadows, rotated elements
   - **Status**: ✅ Fully implemented and deployed to production

6. **Memphis Design Production Deployment & Debugging (RESOLVED 2025-11-02)**
   - **Initial Issue**: Frontend rendered successfully but connection indicator showed 🔴 "尚未連線"
   - **Root Causes Found & Fixed**:
     1. **Renderer.js DOM Selector Mismatch**
        - Problem: HTML template class changed from `font-semibold` to `font-bold`, but selector wasn't updated
        - Fix: Updated selector in `Renderer.js:60` to match HTML template
        - Impact: Task cards couldn't render, blocking all initialization

     2. **Script Loading Race Condition**
        - Problem: Using `defer` attribute on scripts caused non-deterministic loading order
        - Fix: Removed `defer` to ensure sync sequential loading
        - Impact: BackendGateway loaded after TaskManager, causing "BackendGateway is not defined"

     3. **BackendGateway.js Syntax Error**
        - Problem: Missing comma between `request()` and `_parseResponse()` methods
        - Fix: Added comma separator in object literal (line 77)
        - Impact: Module parsing failed completely

     4. **CSRF Token Missing on POST Requests**
        - Problem: Async initialization meant CSRF token wasn't acquired before user action
        - Fix: Added auto-fetch mechanism - POST requests without token automatically fetch one first
        - Impact: All POST operations (create, update, delete, breakdown) now work reliably

   - **Diagnostic Tools Created**:
     - `test-fetch.html` - Direct API endpoint testing
     - `DEBUGGING.md` - Comprehensive troubleshooting guide

   - **Improvements Made**:
     - Enhanced error diagnostics in BackendGateway with detailed console logging
     - Improved ConnectionMonitor startup to handle initialization failures gracefully
     - Added fallback CSRF token acquisition mechanism

   - **Final Status**: ✅ All functionality working - 建立任務、拖放、AI分析、刪除、完成

7. **Focus Panel Removal (RESOLVED 2025-11-02)**
   - **Motivation**: Focus panel added unnecessary complexity - users preferred seeing all info directly on task cards
   - **Changes**:
     - Removed entire Focus Panel right-side drawer
     - Removed "專注" button from task cards
     - Removed Shift+A keyboard shortcut (AI button now directly accessible)
     - Removed Header/Footer keyboard shortcut hints
     - Added time information display directly on task cards
   - **Code Impact**: Reduced codebase by 264 lines (-20%)
     - [ui/Renderer.js](ui/Renderer.js): 362 → 263 lines (-99 lines)
     - [managers/TaskManager.js](managers/TaskManager.js): 268 → 219 lines (-49 lines)
     - [app/events.js](app/events.js): 84 → 38 lines (-46 lines)
     - [app/bootstrap.js](app/bootstrap.js): 64 → 52 lines (-12 lines)
     - [core/state.js](core/state.js): Removed `selectedTaskId` state
     - [index.html](index.html): Removed Focus Panel HTML and templates
   - Status: ✅ Deployed to production, tested and working

### Debugging Tips
- For Gemini issues: Check GAS logs with `[Gemini]` prefix (lines 337-518 in backend.gs)
- To switch models: Edit CONFIG.GEMINI_MODEL in backend.gs line 15
- Available models: `gemini-2.0-flash` (stable, recommended), `gemini-2.5-flash` (may have response format issues)

## Core Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), modularized into 12 files with 5-layer architecture
- **Styling**: Tailwind CSS 4.0 via CDN
- **Icons**: Heroicons (inline SVG)
- **Backend**: Google Apps Script (`gas/backend.gs`) deployed as Web App
- **Database**: Google Sheets (Tasks and Analytics sheets)
- **AI Service**: Google Gemini API for task breakdown
- **Deployment**: Zeabur (https://task-matrix.zeabur.app/)

### Frontend Module Architecture

**Layer 1: Foundation (No Dependencies)**
- `core/constants.js` - Status labels and color accents (28 lines)
- `core/icons.js` - Heroicons SVG library (63 lines)
- `models/Task.js` - Task data model class (62 lines)

**Layer 2: Configuration & State**
- `core/config.js` - API configuration management (36 lines)
- `core/state.js` - Global app state and DOM element references (27 lines)

**Layer 3: Services**
- `services/BackendGateway.js` - Google Apps Script API communication (179 lines)

**Layer 4: Business Logic**
- `handlers/DragDropHandler.js` - Drag & drop interaction handling (45 lines)
- `ui/Renderer.js` - UI rendering and updates (263 lines)
- `managers/TaskManager.js` - Task management core logic (219 lines)
- `monitors/ConnectionMonitor.js` - Connection status monitoring (44 lines)

**Layer 5: Application**
- `app/events.js` - Event binding (38 lines)
- `app/bootstrap.js` - Application initialization and DOM setup (52 lines)

**Total**: 1056 lines (reduced from 1320 lines after Focus Panel removal)

**Key Design Principles**:
- Single-direction dependency flow (lower layers never depend on higher layers)
- No circular dependencies
- Each module has clear responsibility
- Global objects declared with `window.*` prefix for clarity
- Elements initialized in bootstrap to avoid null references
- No build process required - direct script loading

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
- **Frontend**: https://task-matrix.zeabur.app/
- **Spreadsheet ID**: `YOUR_SPREADSHEET_ID`
- **GAS Web App URL**: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
- **Gemini Model**: `gemini-2.0-flash` (stable, recommended)
- **Last Updated**: 2025-11-02

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
1. User clicks the AI button directly on the task card
2. Original task is marked as completed
3. 3-5 subtasks are created with `parent_task_id` reference
4. Subtasks inherit the original task's quadrant
5. Subtask titles include parent reference with heroicons link icon: "🔗 來自[parent] | [subtask]"
6. Subtasks are immediately visible on the board

### Real-time Sync
- No localStorage - all data lives in Google Sheets
- Every operation immediately syncs to backend
- Connection status indicator shows sync state
- Optimistic UI updates with rollback on failure

## Module Loading Order

The application follows a strict loading order defined in [index.html](index.html:367-387):

```html
<!-- Layer 1: Foundation -->
<script src="core/constants.js" defer></script>
<script src="core/icons.js" defer></script>
<script src="models/Task.js" defer></script>

<!-- Layer 2: Configuration & State -->
<script src="core/config.js" defer></script>
<script src="core/state.js" defer></script>

<!-- Layer 3: Services -->
<script src="services/BackendGateway.js" defer></script>

<!-- Layer 4: Business Logic -->
<script src="handlers/DragDropHandler.js" defer></script>
<script src="ui/Renderer.js" defer></script>
<script src="managers/TaskManager.js" defer></script>
<script src="monitors/ConnectionMonitor.js" defer></script>

<!-- Layer 5: Application -->
<script src="app/events.js" defer></script>
<script src="app/bootstrap.js" defer></script>
```

**Critical**: This order ensures each module's dependencies are loaded before the module itself.

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
1. Update `Task` class constructor in `models/Task.js`
2. Add field to GAS `Task` class in `backend.gs`
3. Update `TaskRepository` methods for Sheets columns in `backend.gs`
4. Add UI rendering logic in `ui/Renderer.js` if needed

### Modifying Task Status Types
1. Update `STATUS_VALUES` in `backend.gs`
2. Update `STATUS_LABELS` and `STATUS_ACCENTS` in `core/constants.js`
3. Add corresponding HTML dropzone in `index.html` if needed

### Adding New Features
When adding new features, follow the module architecture:
- **New API endpoint**: Add to `services/BackendGateway.js`
- **New UI component**: Add to `ui/Renderer.js`
- **New business logic**: Add to `managers/TaskManager.js` or create new manager
- **New interaction**: Add to `handlers/` directory
- **New configuration**: Add to `core/config.js` or `core/constants.js`

### Task Card Time Display
Task cards show time information directly:
- **Created time**: Displayed as relative time (e.g., "建立於 2 小時前")
- **Updated time**: Displayed as relative time (e.g., "更新於 15 分鐘前")
- **Completed time**: Only shown for completed tasks (e.g., "完成於 1 天前")
- Time formatting handled by `Renderer.formatRelativeTime()` in [ui/Renderer.js](ui/Renderer.js:325-349)

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