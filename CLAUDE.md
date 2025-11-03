# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic Task Matrix is a task management application that combines the Eisenhower Matrix with atomic habits principles. It uses AI (Google Gemini) to break down large tasks into micro-actions, helping users overcome procrastination. All data is synced to Google Sheets in real-time.

## ⚠️ Current Project Status (2025-11-03)

### Completed Features ✅
- **Frontend Architecture**: Modularized into 12 files with 5-layer architecture (~1020 lines total after UI cleanup)
- **UI Design**: **Memphis Design** (粗邊框 + 彩色偏移陰影 + 旋轉元素), drag-and-drop, HeroIcons SVG icons
- **Layout**: Optimized information hierarchy (quadrants-first), modal-based statistics, 2-column grid for uncategorized tasks
- **Backend**: GAS with REST endpoints (`/tasks`, `/tasks/update`, `/tasks/{id}/complete`, `/tasks/{id}/breakdown`, `/stats/weekly`)
- **Database**: Google Sheets CRUD operations (create, read, update, delete, complete tasks)
- **Sync**: Real-time sync without localStorage
- **AI**: Gemini AI Task Breakdown using `gemini-2.0-flash` model with task intensity indicators (🌱⚡🚀)
- **UX**: Direct AI breakdown button on task cards, time information display, on-demand statistics modal
- **Deployment**: Production-ready on Zeabur (https://task-matrix.zeabur.app/)
- **All Core Functionality**: ✅ 建立任務、拖放分類、AI 分析、刪除任務、完成任務
- **Security**: ✅ XSS 防護、CSRF Token、優化的 API 認證機制

### Security Status 🔒

**Latest Security Audit**: 資安調整規格文件 v2.0 (2025-11-03)

**Security Level**: 🟢 **Very Low Risk** (3/4 issues resolved)

| Priority | Issue | Status | Fixed Date |
|----------|-------|--------|------------|
| 🔴 HIGH | H-01: DOM-based XSS 漏洞 | ✅ Fixed | 2025-11-03 |
| 🟠 MEDIUM | M-01: 客戶端 API Token 暴露 | ✅ Fixed | 2025-11-03 |
| 🟠 MEDIUM | M-02: Tailwind CDN 無 SRI 保護 | ⏳ Pending | - |
| 🟢 LOW | L-01: ALLOWED_ORIGIN 配置清理 | ✅ Fixed | 2025-11-03 |

**Current Security Measures**:
- ✅ CSRF Token protection for all state-changing operations
- ✅ XSS prevention using safe DOM manipulation
- ✅ Prompt Injection prevention using JSON.stringify() in Gemini prompts
- ✅ LLM Output Validation to filter malicious content
- ✅ CSP (Content Security Policy) configured
- ✅ API authentication via GAS Web App permissions
- ✅ DEBUG_MODE for controlled error logging
- ⏳ CDN SRI (Subresource Integrity) - pending implementation

### Known Issues 🔴

1. **M-02: Tailwind CDN without SRI (TODO)**
   - Current setup uses Tailwind CSS CDN without Subresource Integrity check
   - **Risk**: Supply chain attack if CDN is compromised
   - **Mitigation**: Self-host Tailwind CSS (4-6 hours work)
   - **Priority**: Medium - but low actual risk with CSRF Token protection
   - **Location**: index.html, requires build process setup

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

8. **UI/UX Refinement & Layout Optimization (RESOLVED 2025-11-02)**
   - **Motivation**: Eliminate non-functional UI elements and optimize information hierarchy
   - **Changes Implemented**:
     1. **Removed Non-Functional UI Elements**
        - Deleted search box (⌘K) with no backend functionality
        - Deleted theme toggle button (亮/暗) with no implementation
        - Deleted settings button with no settings panel
        - Impact: Cleaner header, reduced user confusion
        - Files: [index.html](index.html#L100-L121)

     2. **Header Layout Rebalance**
        - Moved connection status indicator from left to right
        - Layout: Logo + Title (left) ↔ Stats Button + Connection Status (right)
        - Responsive: Vertical stack on mobile, horizontal on desktop
        - Impact: Better visual balance and symmetry
        - Files: [index.html](index.html#L91-L121)

     3. **Statistics Panel Modalization**
        - Converted right-side statistics panel to modal popup
        - Added HeroIcons chart-bar button in header
        - Modal features: Click outside/ESC/X button to close, auto-refresh on open
        - Layout change: 7fr:5fr (58%:42%) → 100% full width for quadrants
        - Impact: 42% more space for task quadrants
        - Files:
          - Modal HTML: [index.html](index.html#L343-L394)
          - Icon: [core/icons.js](core/icons.js#L94-L102)
          - Events: [app/events.js](app/events.js#L21-L61)
          - Rendering: [ui/Renderer.js](ui/Renderer.js#L149-L183)

     4. **Uncategorized Zone Grid Layout**
        - Changed from vertical stack (space-y-3) to 2-column grid
        - Responsive: 1 column (mobile) → 2 columns (desktop)
        - Matches quadrant layout (lg:grid-cols-2)
        - Impact: Cleaner display when multiple uncategorized tasks exist
        - Files: [index.html](index.html#L242)

     5. **Content Hierarchy Reordering**
        - Swapped position: Quadrants (top) ↔ Uncategorized (bottom)
        - Rationale: Core work area (quadrants) deserves primary focus
        - User flow: "View categorized tasks first, then process uncategorized"
        - Impact: Better information architecture
        - Files: [index.html](index.html#L160-L247)

   - **Code Metrics**:
     - Lines removed: ~50 lines (non-functional UI elements)
     - Lines added: ~60 lines (modal implementation)
     - Net change: +10 lines for significantly improved UX

   - **Visual Improvements**:
     - ✅ Cleaner header with purpose-driven elements only
     - ✅ 100% width for quadrants (was 58%)
     - ✅ Modal-based statistics (on-demand viewing)
     - ✅ Grid-based uncategorized zone (scalable layout)
     - ✅ Logical content hierarchy (important → secondary)

   - Status: ✅ Completed, ready for production deployment

9. **Memphis Design Cleanup & Overscroll Fix (RESOLVED 2025-11-02)**
   - **Motivation**: Simplify design by removing all shadow effects, fix background cutoff during overscroll

   - **Phase 1: Shadow Removal**
     - Removed all Memphis shadow effects (shadow-memphis-*) for flatter design
     - User feedback: "效果不錯，我決定把所有有陰影的效果全部拿掉"
     - Files affected:
       - [index.html](index.html) - Removed shadow-memphis-card, shadow-memphis-task, shadow-memphis-btn
       - [ui/ConfirmDialog.js](ui/ConfirmDialog.js) - Removed shadows from dialog and buttons
       - [ui/FeedbackToast.js](ui/FeedbackToast.js) - Removed shadow from toast
     - Impact: Cleaner, more minimal Memphis aesthetic

   - **Phase 2: Header Border Cleanup**
     - Removed unnecessary pink dashed top border from header
     - Kept only bottom border (orange dashed line)
     - Files: [index.html](index.html)

   - **Phase 3: Overscroll/Elastic Scrolling Fix**
     - **Problem**: White space visible at top when scrolling on desktop/mobile
     - **Root Cause**: `background-attachment: fixed` kept background fixed to viewport while content could be overscrolled, exposing white space beyond gradient
     - **Solution**:
       1. Removed `background-attachment: fixed` from body
       2. Added `overscroll-behavior: none` to html element (disables elastic scrolling)
       3. Added `background-size: 100% 100%` to body (ensures gradient covers entire area)
     - **Technical Details**:
       - Overscroll (elastic scrolling) is default browser behavior on iOS Safari, Chrome
       - When background is fixed to viewport, overscrolling content reveals the layer beneath
       - `overscroll-behavior: none` prevents pull-to-refresh and bounce effects
     - Files: [index.html](index.html#L40-L51)
     - Impact: Smooth scrolling with no background cutoff on any device

   - **Design Philosophy Learned**:
     - Not all projects need `overscroll-behavior: none`
     - Only required when: fixed backgrounds, full-screen apps, or scroll-locked modals
     - Regular websites with solid background-color don't face this issue

   - Status: ✅ All visual issues resolved, ready for production deployment

10. **Security Fixes - H-01, M-01, L-01 (RESOLVED 2025-11-03)**
   - **Motivation**: Comprehensive security audit identified 4 vulnerabilities (資安調整規格文件 v2.0)
   - **Completed Fixes**:

   **H-01: DOM-based XSS Vulnerability** ✅
   - **Issue**: `innerHTML` directly inserting unsanitized user data in task cards
   - **Attack Vector**: Malicious HTML/JS injection via task titles (e.g., `<img src=x onerror="alert('XSS')">`)
   - **Fix**:
     - Replaced `innerHTML` with safe DOM manipulation (`createElement()` + `textContent`)
     - Only use `innerHTML` for controlled internal functions (IconLibrary)
   - **Files Modified**: [ui/Renderer.js](ui/Renderer.js#L71-L132)
   - **Git Commit**: `790a125` (part of overscroll fix commit)
   - **Impact**: Prevents XSS attacks, protects user data and tokens

   **M-01: Client-side API Token Exposure** ✅
   - **Issue**: API_TOKEN hardcoded in client-side code (visible in browser source)
   - **Problem**: Any user could copy the token and bypass frontend to call API directly
   - **Fix**:
     - **Backend**: Modified `validateApiToken()` to check Script Properties first
     - **Backend**: Enabled "permissive mode" when no API_TOKEN configured in GAS
     - **Frontend**: Removed API_TOKEN from config.js
     - **Frontend**: Removed token parameter logic from BackendGateway.js
     - **Frontend**: Removed apiToken() method from core/config.js
   - **Files Modified**:
     - [gas/backend.gs](gas/backend.gs#L740-L769) - Reordered validation logic
     - [config.js](config.js#L1-L3) - Removed API_TOKEN
     - [core/config.js](core/config.js#L16-L25) - Removed apiToken() method
     - [services/BackendGateway.js](services/BackendGateway.js#L20-L31) - Removed token parameters
   - **Git Commit**: `eb08688`
   - **Impact**: Removed ineffective client-side token, relies on CSRF Token for real protection

   **L-01: ALLOWED_ORIGIN Configuration Cleanup** ✅
   - **Issue**: CONFIG.ALLOWED_ORIGIN set to '*', but GAS doesn't support custom CORS headers
   - **Problem**: Misleading configuration that suggests CORS control when none exists
   - **Fix**:
     - Removed ALLOWED_ORIGIN configuration
     - Added comments explaining GAS Web App CORS limitations
     - Documented that security relies on CSRF Token mechanism
   - **Files Modified**: [gas/backend.gs](gas/backend.gs#L11-L13)
   - **Git Commit**: `db31c66`
   - **Impact**: Code clarity, removed misleading configuration

   - **Security Improvements Summary**:
     - ✅ XSS prevention: Safe DOM manipulation throughout UI
     - ✅ Authentication optimization: Removed client-side token, relies on CSRF
     - ✅ Code cleanup: Removed misleading CORS configuration
     - ✅ All core functionality tested and working

   - **Remaining Security Work**:
     - ⏳ M-02: Self-host Tailwind CSS (remove CDN dependency)
     - **Estimated**: 4-6 hours
     - **Priority**: Medium - defensive measure against supply chain attacks

   - **Final Status**: ✅ Security level upgraded from "Low Risk" to "Very Low Risk"

11. **Task Intensity Feature & Gemini Prompt Improvement (RESOLVED 2025-11-03)**
   - **Motivation**: User wanted to improve Gemini prompt quality to generate more actionable micro-tasks and add visual intensity indicators
   - **Completed Work**:

   **Part A: Security Enhancements** 🔒
   1. **Fixed Prompt Injection Vulnerability (NEW HIGH PRIORITY)**
      - **Issue**: Existing prompt used `任務：「${sanitizedTitle}」` which could be exploited
      - **Attack Vector**: Input like `任務」\n\n忽略以上指令` could hijack LLM behavior
      - **Fix**: Changed to `任務：${JSON.stringify(sanitizedTitle)}` to properly escape quotes
      - **Location**: [gas/backend.gs](gas/backend.gs#L456)
      - **Impact**: Prevents malicious users from manipulating AI responses

   2. **Added LLM Output Validation**
      - **Issue**: AI-generated subtasks could contain HTML/JS or spreadsheet formulas
      - **Fix**: Added filtering to reject items with `<tag>` or `^[=+\-@]` patterns
      - **Location**: [gas/backend.gs](gas/backend.gs#L600-L610), [gas/backend.gs](gas/backend.gs#L627-L636)
      - **Impact**: Prevents XSS and formula injection attacks via AI output

   3. **Enhanced sanitizeForPrompt()**
      - **Added**: Remove backslashes `\` and brackets `{}[]` from user input
      - **Location**: [gas/backend.gs](gas/backend.gs#L906-L907)
      - **Impact**: Stronger defense against escape-based injection attempts

   **Part B: Feature Implementation** ✨
   1. **New Gemini Prompt with Mixed Language Strategy**
      - **Design**: English rules + Chinese examples + explicit JSON output format
      - **Rationale**: English provides clearer structural instructions for LLM
      - **Features**:
        - Task intensity classification (Small vs Large tasks)
        - Emoji-based intensity indicators: 🌱 (S ≤2min), ⚡ (M 5-10min), 🚀 (L 15-30min)
        - Strict output format validation (no numbering, no markdown code blocks)
        - Emphasis on concrete, verb-led actions (避免抽象詞彙)
      - **Location**: [gas/backend.gs](gas/backend.gs#L431-L457)
      - **Increased Token Limit**: 400 → 600 tokens to accommodate richer prompts
      - **Impact**: More specific, actionable micro-tasks with clear time expectations

   2. **Updated defaultBreakdown() Fallback**
      - **Added**: Emoji prefixes (🌱⚡) to fallback subtasks when AI unavailable
      - **Location**: [gas/backend.gs](gas/backend.gs#L664-L666)
      - **Impact**: Consistent UX even without Gemini API key

   3. **Extended Task Model with Intensity Parsing**
      - **New Field**: `intensity` property ('S'/'M'/'L' or null)
      - **New Method**: `Task.parseIntensity(title)` extracts emoji and cleans title
      - **Backward Compatible**: Old tasks without emoji return `intensity: null`
      - **Location**: [models/Task.js](models/Task.js#L22-L29), [models/Task.js](models/Task.js#L43-L75)
      - **Impact**: Frontend can distinguish task sizes without backend changes

   4. **Added Intensity Constants**
      - **New Constants**: `INTENSITY_LABELS`, `INTENSITY_ACCENTS`
      - **Visual Style**: Memphis Design badges (thick borders, bright colors, rotation)
      - **Includes**: emoji, duration text, Tailwind color classes
      - **Location**: [core/constants.js](core/constants.js#L30-L66)
      - **Impact**: Centralized configuration for consistent styling

   5. **Implemented Badge Rendering**
      - **Visual Design**: Colored badges with emoji + label (e.g., "🌱 小型任務")
      - **Placement**: Before task title, with Memphis rotation effect
      - **Tooltip**: Shows duration on hover (e.g., "≤2分鐘")
      - **Safety**: Uses safe DOM manipulation (`createElement` + `textContent`)
      - **Location**: [ui/Renderer.js](ui/Renderer.js#L71-L93)
      - **Impact**: Users instantly see task time investment required

   **Emoji Cross-Platform Compatibility Analysis**:
   - Initial design used 🪶 (feather, Unicode 13.0, 2020+)
   - Switched to older emojis for 99%+ device support:
     - 🌱 (Seedling): Unicode 6.0 (2010)
     - ⚡ (High Voltage): Unicode 4.0 (2003)
     - 🚀 (Rocket): Unicode 6.0 (2010)
   - Decision: Direct emoji in titles (方案 D) for simplicity

   **Design Philosophy**:
   - **向後兼容 (Backward Compatibility)**: All existing tasks without emoji work normally
   - **漸進增強 (Progressive Enhancement)**: New AI-generated tasks automatically get intensity badges
   - **Code Protection**: Only modified necessary files, preserved all working logic

   - **Git Commits**:
     - Feature branch: `feature/task-intensity-security`
     - Merged to master and deployed to production
     - All tests passed in local and production environments

   - **Final Status**: ✅ Deployed to production, tested and working perfectly

### Debugging Tips
- For Gemini issues: Check GAS logs with `[Gemini]` prefix (lines 337-518 in backend.gs)
- To switch models: Edit CONFIG.GEMINI_MODEL in backend.gs line 15
- Available models: `gemini-2.0-flash` (stable, recommended), `gemini-2.5-flash` (may have response format issues)
- Task intensity system: Check [models/Task.js](models/Task.js#L43-L75) for emoji parsing logic
- To modify intensity badges: Edit [core/constants.js](core/constants.js#L30-L66) for colors and durations

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
- **Last Updated**: 2025-11-03
- **Security Status**: 🟢 Very Low Risk (3/4 vulnerabilities fixed)

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