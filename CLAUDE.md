# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic Task Matrix is a task management application that combines the Eisenhower Matrix with atomic habits principles. It uses AI (Google Gemini) to break down large tasks into micro-actions, helping users overcome procrastination. All data is synced to Google Sheets in real-time.

## ⚠️ Current Project Status (2025-11-02)

### Completed Features ✅
- **Frontend Architecture**: Modularized into 12 files with 5-layer architecture
- **UI**: Brightstream theme, drag-and-drop, Focus Drawer, statistics panel, Heroicons SVG icons
- **Backend**: GAS with REST endpoints (`/tasks`, `/tasks/update`, `/tasks/{id}/complete`, `/tasks/{id}/breakdown`, `/stats/weekly`)
- **Database**: Google Sheets CRUD operations (create, read, update, delete, complete tasks)
- **Sync**: Real-time sync without localStorage
- **AI**: Gemini AI Task Breakdown using `gemini-2.0-flash` model
- **UX**: Direct AI breakdown button on task cards + Shift+A keyboard shortcut
- **Deployment**: Production-ready on Zeabur (https://task-matrix.zeabur.app/)

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
   - **Solution**: Added direct AI button on task cards + Shift+A keyboard shortcut (1-2 steps)
   - **Implementation**:
     - Task card AI button with heroicons sparkles icon
     - Global Shift+A shortcut with input field guards
     - Auto-select first subtask after breakdown completes
   - Status: ✅ Deployed to production

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
- `core/constants.js` - Status labels and color accents (16 lines)
- `core/icons.js` - Heroicons SVG library (55 lines)
- `models/Task.js` - Task data model class (62 lines)

**Layer 2: Configuration & State**
- `core/config.js` - API configuration management (24 lines)
- `core/state.js` - Global app state and DOM element references (24 lines)

**Layer 3: Services**
- `services/BackendGateway.js` - Google Apps Script API communication (178 lines)

**Layer 4: Business Logic**
- `handlers/DragDropHandler.js` - Drag & drop interaction handling (45 lines)
- `ui/Renderer.js` - UI rendering and updates (362 lines)
- `managers/TaskManager.js` - Task management core logic (268 lines)
- `monitors/ConnectionMonitor.js` - Connection status monitoring (45 lines)

**Layer 5: Application**
- `app/events.js` - Event binding (84 lines)
- `app/bootstrap.js` - Application initialization and DOM setup (64 lines)

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
1. Original task is marked as completed
2. 3-5 subtasks are created with `parent_task_id` reference
3. Subtasks inherit the original task's quadrant
4. Subtask titles include parent reference: "🔗 來自[parent] | [subtask]"

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