# Conflict Resolution UX Patterns for Offline-First Applications

**Research Date:** October 14, 2025
**Purpose:** Guide Phase 5 implementation of cloud sync with conflict resolution for HSA Songbook

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Conflict Resolution UI Patterns](#conflict-resolution-ui-patterns)
3. [How Major Apps Handle Conflicts](#how-major-apps-handle-conflicts)
4. [React Component Libraries for Diffs](#react-component-libraries-for-diffs)
5. [Last-Write-Wins Strategy](#last-write-wins-strategy)
6. [Sync Error Messaging Patterns](#sync-error-messaging-patterns)
7. [Progress Indicators for Background Sync](#progress-indicators-for-background-sync)
8. [CRDT Libraries for React](#crdt-libraries-for-react)
9. [Mobile vs. Desktop Considerations](#mobile-vs-desktop-considerations)
10. [Best Practices for Non-Technical Users](#best-practices-for-non-technical-users)
11. [Implementation Recommendations](#implementation-recommendations)

---

## Executive Summary

Conflict resolution in offline-first apps is a critical UX challenge that requires careful design to avoid confusing users. The research reveals several key insights:

**Key Findings:**
- **Automatic vs. Manual**: Most modern apps prefer automatic conflict resolution (CRDTs, Last-Write-Wins) over manual user intervention
- **User Understanding**: Conflict resolution UIs should be designed for people who don't understand what a "sync conflict" is
- **Mobile-First**: Conflict resolution on mobile requires simplified interfaces (no side-by-side diffs)
- **Prevention > Resolution**: Best UX is avoiding conflicts through real-time sync and optimistic UI updates

**Top Recommendations for HSA Songbook Phase 5:**
1. Use **Last-Write-Wins (LWW)** with visual indicators for most conflicts
2. Only prompt user intervention for "critical" conflicts (e.g., both devices edited same song offline for >1 hour)
3. Use **react-diff-viewer-continued** for desktop conflict comparison
4. Implement friendly error messages with actionable steps
5. Show clear sync status indicators (syncing, synced, conflict)

---

## Conflict Resolution UI Patterns

### 1. Side-by-Side Comparison with Accept/Ignore

**Example: Draft (blog platform)**
- Shows both versions in **three columns**: Local, Remote, and Differences
- Each difference has an **"Accept"** and **"Ignore"** button
- Clear visual highlighting of changes
- Best for text-heavy content like blog posts or song lyrics

**Pros:**
- Very clear what changed
- Gives user full control
- Works well on desktop

**Cons:**
- Too complex for mobile screens
- Requires users to understand conflicts
- Can overwhelm non-technical users

**When to Use:**
- Desktop-only scenarios
- Text-based conflicts (chord chart content)
- Technical users who understand versioning

---

### 2. Version Selection Interface

**Example: GitHub Web Interface**
Shows conflict with three options:
- **"Accept current changes"** - Keep local version
- **"Accept incoming changes"** - Keep server version
- **"Accept both changes"** - Merge both (if possible)

**Pros:**
- Simple, clear choices
- No need to understand diffs
- Mobile-friendly

**Cons:**
- Less granular control
- "Both" option may not make sense for all data types

**When to Use:**
- Mobile conflict resolution
- Simple data conflicts (metadata like key, tempo, etc.)
- Non-technical users

---

### 3. Automatic Merge with Undo

**Example: Google Docs, Notion**
- Automatically merges changes using Operational Transform (OT) or CRDTs
- Shows notification: "Changes merged from other device"
- Provides **undo** option if merge is incorrect
- Keeps full version history for manual rollback

**Pros:**
- Zero user friction
- Works in real-time
- Best UX for collaborative editing

**Cons:**
- Requires complex backend infrastructure
- May produce unexpected results
- Harder to implement

**When to Use:**
- Real-time collaboration features (future phase)
- Frequent, small edits
- When you have server infrastructure for OT/CRDT

---

### 4. "Keep Both" with Duplicate Creation

**Example: File sync tools (Dropbox, Google Drive)**
- Creates duplicate file: `song_1_conflict_2025-10-14.txt`
- User manually merges later
- No data loss

**Pros:**
- Safe - no data loss
- Simple to implement

**Cons:**
- Creates clutter
- Requires manual cleanup
- Confusing for non-technical users

**When to Use:**
- As a fallback when automatic merge fails
- File-based sync systems
- When data loss is unacceptable

---

### 5. Timeline/History View

**Example: Obsidian, Notion**
- Shows timeline of edits from different devices
- User can select which version to keep
- Visual diff between versions

**Pros:**
- Context-rich (when/where edit happened)
- Good for understanding conflict origin
- Works well with version history

**Cons:**
- More complex UI
- Requires storing full edit history

**When to Use:**
- Apps with built-in version history
- Desktop-primary apps
- Power users

---

## How Major Apps Handle Conflicts

### Google Docs
**Strategy:** Operational Transform (OT)

**How it Works:**
- Real-time conflict resolution - conflicts are resolved **as you type**
- All edits are represented as operations (insert text, delete text, apply style)
- Central server orders and transforms operations to maintain consistency
- Example: Alice types "Hello" at position 0, Bob types "World" at position 5 → Result is "HelloWorld" (not "WorldHello")

**UX Impact:**
- Users never see conflict dialogs
- Changes appear instantly
- Requires constant server connection (not truly offline-first)

**Best For:**
- Real-time collaboration with active internet connection
- Text editing
- Centralized server infrastructure

**Limitations for HSA Songbook:**
- OT requires server infrastructure (expensive)
- Not suitable for offline-first architecture
- Overkill for our use case (single-user editing on multiple devices)

---

### Notion
**Strategy:** CRDTs (Conflict-Free Replicated Data Types)

**How it Works:**
- Each change is a CRDT operation that can merge deterministically
- No central server required for conflict resolution
- Changes sync eventually when online
- Mathematically guaranteed to converge to same state

**UX Impact:**
- Works fully offline
- Conflicts resolve automatically when back online
- No user prompts for conflicts

**Best For:**
- Offline-first applications
- Peer-to-peer sync
- Block-based content (Notion blocks, Figma frames)

**Implementation:**
- More complex than LWW, simpler than OT
- Libraries: Yjs, Automerge, RxDB with CRDT plugin

**Suitability for HSA Songbook:**
- **Good fit** for Phase 6+ (real-time collaboration)
- Overkill for Phase 5 (simple single-user sync)
- Consider for future if we add multi-user setlist editing

---

### Obsidian
**Strategy:** diff-match-patch algorithm with auto-merge

**How it Works:**
- Uses Google's `diff-match-patch` algorithm to merge conflicting note changes
- Merges automatically in most cases
- Keeps version history for manual rollback
- For settings files (JSON), merges by applying keys

**UX Impact:**
- Usually silent - users don't see conflicts
- Occasionally produces duplicated content (bug reports)
- Users can revert via version history

**Known Issues:**
- Sometimes overwrites newer data with old
- Occasionally duplicates both old and new data in same note
- Users requested more robust conflict resolution

**Best For:**
- Text-based notes
- Simple offline sync
- Single-user editing on multiple devices

**Suitability for HSA Songbook:**
- **Very similar use case** to HSA Songbook!
- Good inspiration for Phase 5 implementation
- Consider using `diff-match-patch` for ChordPro content

---

### Figma
**Strategy:** Last-writer wins with authoritative server

**How it Works:**
- Multiplayer service is authoritative (server holds truth)
- Server handles validation, ordering, conflict resolution
- State held in-memory, checkpointed every 30-60 seconds
- "Last-writer wins" for conflicting changes

**UX Impact:**
- Real-time updates for collaborators
- Conflicts are rare (server mediates)
- When conflicts occur, latest change wins

**Known Issues:**
- Users report branch merge conflicts erase changes
- "Resolve conflicts" button sometimes doesn't work
- Frustration when local work is lost

**Best For:**
- Real-time visual collaboration
- Single source of truth architecture
- Apps with constant server connection

**Lessons for HSA Songbook:**
- LWW can lose user data (frustrating!)
- Always show clear indication of what was overwritten
- Consider undo/version history as safety net

---

### GitHub
**Strategy:** Manual conflict resolution with markers

**How it Works:**
- Detects conflicts during merge/rebase
- Shows conflict markers in file: `<<<<<<< HEAD`, `=======`, `>>>>>>>`
- User manually edits file to resolve
- Web UI now offers one-click resolution (accept theirs/yours/both)

**UX Impact:**
- Technical users are familiar with this pattern
- Very explicit control
- Can be intimidating for non-developers

**Best For:**
- Code/text files
- Technical users
- When precision is critical

**Not Suitable for HSA Songbook:**
- Too technical for musicians
- Conflict markers would break ChordPro format
- Web UI approach (accept theirs/yours) is better

---

## React Component Libraries for Diffs

### 1. react-diff-viewer-continued (RECOMMENDED)
**npm:** `react-diff-viewer-continued`
**GitHub:** https://github.com/Aeolun/react-diff-viewer-continued

**Why Recommended:**
- Actively maintained (original `react-diff-viewer` is outdated)
- React 18+ compatible
- Beautiful, GitHub-inspired UI
- Mobile-responsive

**Features:**
- Split view (side-by-side) and inline view
- Word-level diffing (highlights exact words changed)
- Line highlighting
- Syntax highlighting support via `renderContent` prop
- Highly customizable styling

**Installation:**
```bash
npm install react-diff-viewer-continued
```

**Example Usage:**
```jsx
import ReactDiffViewer from 'react-diff-viewer-continued';

function ConflictModal({ localVersion, remoteVersion }) {
  return (
    <ReactDiffViewer
      oldValue={localVersion}
      newValue={remoteVersion}
      splitView={true}
      leftTitle="Your Version"
      rightTitle="Server Version"
      showDiffOnly={false}
    />
  );
}
```

**Best For:**
- Desktop conflict resolution
- ChordPro content diffs
- Technical users (optional feature)

---

### 2. react-diff-view
**npm:** `react-diff-view`
**GitHub:** https://github.com/otakustay/react-diff-view

**Features:**
- Consumes git unified diff output
- Split and unified views
- More advanced than react-diff-viewer
- 3.3.2 (last updated 3 months ago)

**Pros:**
- More features (code review tools, comments)
- Good for git-like workflows

**Cons:**
- More complex API
- Requires git diff format (not plain text)
- Overkill for our use case

**When to Use:**
- If you're storing git-style diffs
- Advanced code review features needed
- Desktop-only

---

### 3. Monaco Diff Editor
**npm:** `@monaco-editor/react`
**Docs:** https://monaco-react.surenatoyan.com/

**Features:**
- Full-featured diff editor (VS Code's editor)
- Side-by-side and inline diff views
- Syntax highlighting
- Keyboard shortcuts
- Extremely powerful

**Installation:**
```bash
npm install @monaco-editor/react
```

**Example Usage:**
```jsx
import { DiffEditor } from '@monaco-editor/react';

function ChordProConflictEditor({ original, modified, onResolve }) {
  return (
    <DiffEditor
      height="600px"
      language="text"
      original={original}
      modified={modified}
      options={{
        renderSideBySide: true,
        readOnly: false, // Allow editing to resolve
      }}
    />
  );
}
```

**Pros:**
- Most powerful option
- Users can edit directly to resolve conflict
- Professional-grade

**Cons:**
- Large bundle size (~2MB)
- Complex for simple diffs
- Mobile performance issues

**When to Use:**
- Desktop-only advanced editor
- If you want users to manually edit conflicts
- When bundle size isn't a concern

---

### Comparison Table

| Library | Bundle Size | Mobile Support | Ease of Use | Best For |
|---------|-------------|----------------|-------------|----------|
| react-diff-viewer-continued | ~50KB | Good | Easy | General text diffs |
| react-diff-view | ~80KB | Fair | Medium | Git-style diffs |
| Monaco Diff Editor | ~2MB | Poor | Complex | Advanced editing |

**Recommendation for HSA Songbook:**
- **Phase 5 Desktop:** `react-diff-viewer-continued` for showing conflicts
- **Phase 5 Mobile:** Custom simple UI (not full diff viewer)
- **Future (Phase 6+):** Consider Monaco if we add in-app conflict editing

---

## Last-Write-Wins Strategy

### What is Last-Write-Wins (LWW)?

Last-Write-Wins is a conflict resolution mechanism where the most recent update (by timestamp) becomes the definitive version.

**How it Works:**
1. Every write operation includes a timestamp
2. When conflict is detected (same document edited on 2 devices offline), compare timestamps
3. Keep the version with the latest timestamp
4. Discard the older version

**Example:**
```
Device A (laptop): Edits song at 2:00 PM, saves to IndexedDB
Device B (phone):  Edits same song at 2:05 PM, saves to IndexedDB
Both come online and sync to Supabase

Result: Device B's version wins (2:05 PM > 2:00 PM)
Device A's changes are discarded
```

---

### Advantages of LWW

1. **Simple to Implement**
   - No complex merging logic
   - Just compare timestamps
   - Works with any data type

2. **Low Complexity**
   - No server-side merge algorithms
   - No CRDT infrastructure
   - Easy to debug

3. **Good for Certain Use Cases**
   - Single-user apps with multiple devices
   - Infrequent offline edits
   - Data where latest is usually correct (status updates, settings)

---

### Disadvantages of LWW

1. **Data Loss Risk**
   - Earlier edit is completely discarded
   - No merge attempt
   - User work can be lost

2. **Real-World Example (Shopping Cart):**
   - User adds Item A to cart on phone (2:00 PM)
   - User adds Item B to cart on laptop (2:05 PM)
   - Both devices sync
   - **Result:** Only Item B in cart (Item A lost)
   - **Ideal:** Merge both items

3. **User Frustration**
   - "I made changes and they disappeared!"
   - No warning before data loss
   - Breaks user trust

4. **Timestamp Dependency**
   - Requires accurate clocks across devices
   - Time zone issues
   - Device clock drift

---

### Mitigating LWW Data Loss

#### 1. User Communication Strategy

**Before Sync:**
```
Your changes from [Device Name] may be overwritten
Last edited: 2 hours ago on [Device]
Newer version found on [Other Device]

[View Changes] [Keep Mine] [Keep Theirs]
```

**After Sync (LWW Applied):**
```
✓ Synced from [Device Name]
Your local changes were older and replaced.

[Undo] [View History]
```

**Key Principles:**
- Show device names (not just timestamps)
- Use relative time ("2 hours ago" not "2:00 PM")
- Always offer undo/history
- Be transparent about what happened

---

#### 2. Hybrid Approach: LWW with User Prompt

**Automatic LWW for:**
- Recent conflicts (< 5 minutes apart) - likely same edit session
- Metadata-only changes (key, tempo, capo)
- Non-critical data (view counts, last opened)

**Prompt User for:**
- Old conflicts (> 1 hour apart) - likely different work sessions
- ChordPro content changes
- Critical data (entire songs, setlists)

**Example Flow:**
```javascript
async function handleConflict(local, remote) {
  const timeDiff = Math.abs(local.updatedAt - remote.updatedAt);
  const FIVE_MINUTES = 5 * 60 * 1000;

  if (timeDiff < FIVE_MINUTES) {
    // Auto-resolve with LWW
    return remote.updatedAt > local.updatedAt ? remote : local;
  } else {
    // Prompt user
    return showConflictDialog(local, remote);
  }
}
```

---

#### 3. Version History Safety Net

Always keep version history so users can recover lost data:

```javascript
// Save to history before LWW overwrites
await db.history.add({
  arrangementId: local.id,
  content: local.chordProContent,
  timestamp: local.updatedAt,
  reason: 'Replaced by newer version during sync',
});

// Then apply LWW
await db.arrangements.put(remote);
```

**UI:**
```
Settings > Version History
[Song Name] - [Arrangement]
- Current version (from Phone)
- 2 hours ago (from Laptop) [Restore]
- 1 day ago (from Laptop) [Restore]
```

---

### LWW Best Practices for HSA Songbook

**Do:**
- ✅ Use LWW for metadata conflicts (key, tempo, capo)
- ✅ Show clear notifications when LWW discards local changes
- ✅ Provide undo/restore from history
- ✅ Use device names in messaging ("from Phone", "from Laptop")
- ✅ Store version history for safety

**Don't:**
- ❌ Silently discard user changes
- ❌ Use LWW for ChordPro content (too risky)
- ❌ Rely solely on timestamps (clock drift issues)
- ❌ Skip user communication

**Recommended Implementation:**
```
Phase 5 MVP:
- LWW for metadata (key, tempo, etc.)
- User prompt for ChordPro content conflicts
- Version history for all changes
- Clear sync status indicators

Phase 6 (if needed):
- Consider diff-match-patch for auto-merging ChordPro text
- Or migrate to CRDTs (Yjs) for real-time collaboration
```

---

## Sync Error Messaging Patterns

### Principles for User-Friendly Error Messages

Based on research from Google's Open Health Stack guidelines and offline-first app design best practices:

---

### 1. Be Clear and Actionable

**Bad Example:**
```
❌ Sync failed. Error code: 500
```

**Good Example:**
```
✓ Couldn't sync your changes
Your internet connection was lost. We'll try again when you're back online.

[Try Again Now]
```

**Key Elements:**
- **What:** Explain what failed ("Couldn't sync your changes")
- **Why:** Describe the root cause ("internet connection lost")
- **How to Fix:** Provide clear next steps ("We'll try again when online")
- **Action:** Offer a button to retry or get help

---

### 2. Use Friendly, Non-Alarmist Tone

**Bad Example:**
```
❌ CRITICAL ERROR: Data synchronization failure!
Your data may be lost. Contact support immediately.
```

**Good Example:**
```
✓ Your changes are safe on this device
We couldn't sync to the cloud yet, but we'll keep trying.

[Learn More]
```

**Tone Guidelines:**
- **Reassuring:** "Your changes are safe"
- **Empowering:** "You can keep working offline"
- **Friendly:** Avoid "ERROR", "CRITICAL", "FAILURE"
- **Honest:** Don't hide issues, but frame positively

---

### 3. Provide Escalating Solutions

**Example:**
```
Step 1: Check your internet connection
→ Make sure Wi-Fi or cellular data is on

Still not working?

Step 2: Force sync
→ [Sync Now] button

Still not working?

Step 3: Get help
→ [Contact Support] or [View Troubleshooting Guide]
```

**Pattern:**
1. Simplest solution first (usually network-related)
2. Manual retry option
3. Advanced troubleshooting or support contact

---

### 4. Context-Aware Messaging

**Scenario: Offline**
```
You're offline
Your changes are saved on this device and will sync when you're back online.

[Dismiss]
```

**Scenario: Syncing**
```
Syncing 3 songs...
[Progress bar: 2/3 complete]

[Pause Sync]
```

**Scenario: Conflict Detected**
```
⚠️ Sync conflict detected
You edited "Amazing Grace" on your phone and laptop. Which version should we keep?

[View Differences] [Keep Phone Version] [Keep Laptop Version]
```

**Scenario: Sync Failed (Temporary)**
```
Sync paused
Server is temporarily unavailable. We'll retry in 5 minutes.

[Retry Now] [Stop Retrying]
```

**Scenario: Sync Failed (Permanent)**
```
Couldn't sync some changes
3 songs failed to sync due to server validation errors.

[View Details] [Skip These] [Report Issue]
```

---

### 5. Avoid Generic Error Messages

**Bad Examples:**
```
❌ "An error occurred"
❌ "Something went wrong"
❌ "Sync failed"
❌ "Network error"
```

**Good Examples:**
```
✓ "Couldn't reach server - check your internet connection"
✓ "3 songs are waiting to sync when you're back online"
✓ "Server is busy - trying again in 30 seconds"
✓ "Your account storage is full - upgrade to sync more songs"
```

---

### 6. Error Message Hierarchy

**Priority 1: Critical (User Action Required)**
```
🔴 Sync conflict - choose which version to keep
🔴 Storage full - delete songs or upgrade account
```
- Modal dialog
- Blocks other actions
- Clear call-to-action

**Priority 2: Important (User Should Know)**
```
🟡 Some songs didn't sync - tap to retry
🟡 New version available on other device
```
- Toast notification (dismissible)
- Persists in notification center
- Optional action

**Priority 3: Informational**
```
🟢 Syncing...
🟢 Synced to cloud
```
- Subtle status indicator
- Auto-dismiss after 3 seconds
- No action required

---

### Real-World Examples

#### Example 1: Network Error (Mendix Offline Apps)
```
Could not sync your data
Please check your network connection and try again.

[Retry]
```

#### Example 2: Validation Error (Field Service Mobile)
```
Some changes couldn't sync
Server rejected 2 songs due to missing required fields.

[View Details]
```

#### Example 3: Conflict (Obsidian-style)
```
Merge conflict in "Amazing Grace - John Newton.txt"
Both devices edited this song offline. We merged the changes, but please review.

[Review Changes] [Dismiss]
```

---

### Error Message Templates for HSA Songbook

**Template 1: Connection Lost**
```javascript
const ERROR_OFFLINE = {
  title: "You're offline",
  message: "Your changes are saved on this device and will sync when you're back online.",
  severity: "info",
  actions: [{ label: "Dismiss", onClick: dismiss }]
};
```

**Template 2: Sync Conflict**
```javascript
const ERROR_CONFLICT = {
  title: "Sync conflict detected",
  message: `You edited "${songTitle}" on ${device1} and ${device2}. Which version should we keep?`,
  severity: "warning",
  actions: [
    { label: "View Differences", onClick: showDiff },
    { label: `Keep ${device1} Version`, onClick: keepLocal },
    { label: `Keep ${device2} Version`, onClick: keepRemote }
  ]
};
```

**Template 3: Server Error**
```javascript
const ERROR_SERVER_UNAVAILABLE = {
  title: "Couldn't reach server",
  message: "We'll retry automatically in 30 seconds.",
  severity: "warning",
  actions: [
    { label: "Retry Now", onClick: retrySync },
    { label: "Cancel", onClick: cancelSync }
  ]
};
```

**Template 4: Success**
```javascript
const SUCCESS_SYNCED = {
  title: "Synced to cloud",
  message: `${count} song(s) synced successfully.`,
  severity: "success",
  autoDismiss: 3000 // 3 seconds
};
```

---

### Implementation Pattern

```typescript
// Error notification service
interface SyncNotification {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  actions?: Array<{ label: string; onClick: () => void }>;
  autoDismiss?: number; // milliseconds
  persistent?: boolean; // Don't auto-dismiss
}

function showSyncError(notification: SyncNotification) {
  // Use toast for auto-dismiss notifications
  if (notification.autoDismiss) {
    toast[notification.severity](notification.message, {
      duration: notification.autoDismiss
    });
  }
  // Use modal for critical errors requiring action
  else if (notification.severity === 'error' || notification.persistent) {
    openModal(<SyncErrorDialog {...notification} />);
  }
  // Use snackbar for informational messages
  else {
    showSnackbar(notification);
  }
}
```

---

### Key Takeaways

✅ **Do:**
- Explain what happened and why
- Provide clear next steps
- Use friendly, reassuring tone
- Offer escalating solutions (try again → get help)
- Show context (device names, time)

❌ **Don't:**
- Use generic messages ("error occurred")
- Use alarmist language ("CRITICAL", "FAILURE")
- Hide the problem
- Blame the user
- Show only error codes without explanation

---

## Progress Indicators for Background Sync

### Types of Progress Indicators

Based on Material UI, React documentation, and UX best practices:

---

### 1. Determinate Progress (Known Duration)

Use when you know exactly how many items need to sync.

**Example: Syncing Multiple Songs**
```jsx
import { LinearProgress } from '@mui/material';

function SyncProgress({ current, total }) {
  const progress = (current / total) * 100;

  return (
    <div>
      <p>Syncing songs: {current} of {total}</p>
      <LinearProgress variant="determinate" value={progress} />
    </div>
  );
}
```

**When to Use:**
- File uploads
- Batch sync operations (5 songs pending)
- Multi-step processes with known steps

**Best Practices:**
- Show count: "3 of 10 songs synced"
- Show percentage if total is large
- Estimate time remaining for long operations

---

### 2. Indeterminate Progress (Unknown Duration)

Use when you don't know how long sync will take.

**Example: Initial Sync**
```jsx
import { CircularProgress } from '@mui/material';

function SyncingIndicator() {
  return (
    <div>
      <CircularProgress />
      <p>Syncing to cloud...</p>
    </div>
  );
}
```

**When to Use:**
- Initial server connection
- Loading remote data (unknown size)
- Background sync (non-blocking)

**Styles:**
- Spinners (circular progress)
- Pulsing dots
- Skeleton loaders

---

### 3. Wait Time Tiers (UX Best Practices)

Different strategies based on expected wait time:

**Short Waits (1-3 seconds):**
- ✅ Spinner or skeleton screen
- ✅ No percentage needed
- ✅ Subtle, non-intrusive

**Medium Waits (3-10 seconds):**
- ✅ Progress bar with percentage
- ✅ Show current operation ("Syncing Amazing Grace...")
- ✅ Allow user to continue working

**Long Waits (10+ seconds):**
- ✅ Detailed progress with time estimate
- ✅ Show what's happening ("Uploading song 3 of 15...")
- ✅ Allow cancellation
- ✅ Engaging elements (tips, stats, illustrations)

---

### 4. Background Sync Patterns

**Pattern 1: Status Icon in Header**
```jsx
function SyncStatusIcon({ status }) {
  const icons = {
    synced: <CheckCircle color="success" />,
    syncing: <SyncIcon className="animate-spin" />,
    offline: <CloudOff color="disabled" />,
    error: <ErrorIcon color="error" />
  };

  return (
    <div className="sync-status">
      {icons[status]}
      <span>{status}</span>
    </div>
  );
}
```

**Pattern 2: Toast Notification**
```jsx
import { toast } from 'sonner'; // or react-hot-toast

// Start sync
toast.loading('Syncing to cloud...', { id: 'sync' });

// Update progress
toast.loading(`Syncing: ${current}/${total} songs`, { id: 'sync' });

// Complete
toast.success('Synced to cloud', { id: 'sync' });

// Error
toast.error('Sync failed - will retry', { id: 'sync' });
```

**Pattern 3: Persistent Snackbar (Mobile)**
```jsx
function SyncSnackbar({ visible, progress }) {
  if (!visible) return null;

  return (
    <Snackbar open={visible} autoHideDuration={null}>
      <Alert severity="info" icon={<SyncIcon className="animate-spin" />}>
        Syncing {progress.current} of {progress.total} songs
        <LinearProgress
          variant="determinate"
          value={(progress.current / progress.total) * 100}
        />
      </Alert>
    </Snackbar>
  );
}
```

---

### 5. Accessibility Considerations

**Screen Reader Support:**
```jsx
<div role="status" aria-live="polite" aria-busy="true">
  <CircularProgress aria-label="Syncing songs to cloud" />
  <span className="sr-only">Syncing 3 of 10 songs</span>
</div>
```

**ARIA Labels:**
- `aria-label`: Describe what's loading
- `aria-valuenow`: Current progress value
- `aria-valuemin` / `aria-valuemax`: Progress range
- `aria-live="polite"`: Announce updates to screen readers

**Color Contrast:**
- Ensure progress bars meet WCAG AA standards (4.5:1 contrast)
- Don't rely solely on color (use icons + text)

---

### 6. React Progress Libraries

**Material UI (MUI)**
```bash
npm install @mui/material @emotion/react @emotion/styled
```
- `<LinearProgress />` - Horizontal progress bar
- `<CircularProgress />` - Spinning circle
- Themeable, accessible
- Supports determinate/indeterminate modes

**React's Built-in `<progress>`**
```jsx
<progress value={50} max={100}>50%</progress>
```
- Native HTML element
- Lightweight
- Limited styling

**Ant Design Progress**
```bash
npm install antd
```
- `<Progress percent={50} />` - Versatile progress component
- Multiple styles (line, circle, dashboard)
- Rich customization

**Custom SVG Circular Progress**
```jsx
// Use SVG for full control
function CircularProgress({ percent }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="100" height="100">
      <circle
        cx="50" cy="50" r={radius}
        stroke="#e0e0e0" strokeWidth="10" fill="none"
      />
      <circle
        cx="50" cy="50" r={radius}
        stroke="#4caf50" strokeWidth="10" fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dy="5">
        {percent}%
      </text>
    </svg>
  );
}
```

---

### 7. Advanced Patterns

**Optimistic UI with Rollback**
```jsx
function useSyncWithProgress() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  async function syncSongs(songs) {
    setStatus('syncing');
    setProgress({ current: 0, total: songs.length });

    for (let i = 0; i < songs.length; i++) {
      try {
        await syncSongToSupabase(songs[i]);
        setProgress(prev => ({ ...prev, current: i + 1 }));
      } catch (error) {
        setStatus('error');
        // Rollback optimistic updates
        return;
      }
    }

    setStatus('synced');
  }

  return { status, progress, syncSongs };
}
```

**Queue-Based Sync with Priority**
```jsx
function SyncQueueProgress({ queue }) {
  const highPriority = queue.filter(item => item.priority === 'high');
  const completed = queue.filter(item => item.status === 'completed');

  return (
    <div>
      <p>
        Syncing: {completed.length} / {queue.length}
        {highPriority.length > 0 && ` (${highPriority.length} priority)`}
      </p>
      <LinearProgress
        variant="determinate"
        value={(completed.length / queue.length) * 100}
      />
    </div>
  );
}
```

---

### Implementation Recommendations for HSA Songbook

**Phase 5 MVP:**
1. **Header Status Icon:**
   - Show sync status always visible (syncing/synced/offline/error)
   - Use animated icon for "syncing" state
   - Click icon to open sync details modal

2. **Toast Notifications:**
   - "Syncing X songs..." when batch sync starts
   - "Synced to cloud ✓" on success
   - "Sync failed - will retry" on error

3. **Progress Bar (when syncing >3 items):**
   - Show linear progress in toast or modal
   - "Syncing 5 of 12 songs..."
   - Allow background sync (non-blocking)

**Code Example:**
```jsx
// In Header component
<SyncStatusIcon status={syncStatus} onClick={openSyncModal} />

// In sync service
async function syncPendingChanges(items) {
  toast.loading(`Syncing ${items.length} song(s)...`, { id: 'sync' });

  for (let i = 0; i < items.length; i++) {
    await syncItem(items[i]);
    toast.loading(`Syncing ${i + 1} of ${items.length}...`, { id: 'sync' });
  }

  toast.success('Synced to cloud', { id: 'sync' });
}
```

**Libraries to Use:**
- `sonner` or `react-hot-toast` for toast notifications
- Material UI or custom SVG for status icons
- Linear progress for batch operations

---

## CRDT Libraries for React

Conflict-Free Replicated Data Types (CRDTs) are data structures that automatically resolve conflicts in distributed systems. They're ideal for **real-time collaboration** and **offline-first apps**.

---

### When to Use CRDTs

**Good Fit:**
- Real-time multi-user collaboration (Google Docs-style)
- Offline-first apps with complex merge requirements
- Peer-to-peer sync (no central server)
- Apps where "eventual consistency" is acceptable

**Not Needed If:**
- Simple single-user sync (LWW is sufficient)
- You have real-time server (OT is simpler)
- Small dataset with infrequent conflicts

**For HSA Songbook:**
- ❌ Phase 5: Overkill (single-user sync, LWW + diff-match-patch is enough)
- ✅ Phase 6+: Consider if we add real-time multi-user setlist editing

---

### Top CRDT Libraries for React

#### 1. Yjs (RECOMMENDED)
**npm:** `yjs`, `y-websocket`, `y-indexeddb`
**Website:** https://yjs.dev/
**GitHub:** https://github.com/yjs/yjs

**Why Best:**
- Most popular and battle-tested CRDT library
- Excellent React ecosystem
- Used by major apps (Figma, Linear, Notion-inspired tools)
- Rich editor integrations (Quill, CodeMirror, Monaco, Slate, Lexical)
- Built-in persistence (IndexedDB, WebSocket, WebRTC)

**Features:**
- Shared data types: `Y.Map`, `Y.Array`, `Y.Text`, `Y.XmlFragment`
- Offline-first with automatic sync
- Small bundle size (~30KB core + providers)
- Provider ecosystem (WebSocket, WebRTC, IndexedDB)

**Installation:**
```bash
npm install yjs y-websocket y-indexeddb
```

**Example: Real-Time Collaborative Text**
```jsx
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useState } from 'react';

function CollaborativeEditor({ roomId }) {
  const [doc] = useState(() => new Y.Doc());
  const [text, setText] = useState('');

  useEffect(() => {
    // Connect to WebSocket server
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      doc
    );

    // Get shared text type
    const yText = doc.getText('content');

    // Listen for changes
    yText.observe(() => {
      setText(yText.toString());
    });

    return () => provider.destroy();
  }, [doc, roomId]);

  const handleChange = (newText) => {
    const yText = doc.getText('content');
    yText.delete(0, yText.length);
    yText.insert(0, newText);
  };

  return (
    <textarea
      value={text}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
```

**React Integration Examples:**
- **Yjs + React Hook:** https://github.com/yjs/yjs-demos/tree/main/react
- **Tutorial:** "Making A Simple Real-Time Collaboration App with React, Node, Express, and Yjs" (Medium)
- **CodeSandbox:** y-websocket examples with React

**Best For:**
- Real-time collaboration features
- Offline-first sync with complex data structures
- Multi-user setlist editing (future feature)

---

#### 2. Automerge
**npm:** `@automerge/automerge`
**Website:** https://automerge.org/
**GitHub:** https://github.com/automerge/automerge

**Features:**
- CRDT with JSON data model (easy to understand)
- Implemented in Rust (WebAssembly for JS)
- Time-travel debugging (view full history)
- Bindings for JavaScript, Python, Go, Rust

**Pros:**
- JSON-based API (familiar to React devs)
- Excellent documentation
- Built-in version history

**Cons:**
- Larger bundle size than Yjs (~200KB+)
- Slower performance for large documents
- Smaller ecosystem than Yjs

**Installation:**
```bash
npm install @automerge/automerge
```

**Example:**
```jsx
import * as Automerge from '@automerge/automerge';
import { useEffect, useState } from 'react';

function AutomergeDemo() {
  const [doc, setDoc] = useState(() =>
    Automerge.from({ songs: [] })
  );

  const addSong = (song) => {
    setDoc(Automerge.change(doc, (draft) => {
      draft.songs.push(song);
    }));
  };

  return (
    <div>
      <h1>Songs: {doc.songs.length}</h1>
      <button onClick={() => addSong({ title: 'Amazing Grace' })}>
        Add Song
      </button>
    </div>
  );
}
```

**Best For:**
- Apps that need full version history
- JSON-heavy data structures
- When bundle size isn't critical

---

#### 3. SyncedStore
**npm:** `@syncedstore/core`, `@syncedstore/react`
**Website:** https://syncedstore.org/
**GitHub:** https://github.com/YousefED/SyncedStore

**Why Unique:**
- Built on top of Yjs
- **Plain JavaScript objects** that sync automatically (no special APIs!)
- Best React integration (hooks, context)
- Dead simple API

**Features:**
- `syncedStore()` creates reactive store (like Zustand + Yjs)
- Automatically syncs changes
- Works with React, Vue, Svelte
- Zero boilerplate

**Installation:**
```bash
npm install @syncedstore/core @syncedstore/react
```

**Example:**
```jsx
import { syncedStore, useSyncedStore } from '@syncedstore/react';
import { WebrtcProvider } from 'y-webrtc';

// Create synced store (plain JS object!)
const store = syncedStore({
  songs: [],
  setlists: []
});

// Connect to peers via WebRTC
const provider = new WebrtcProvider('my-room-id', store.doc);

function SongList() {
  const state = useSyncedStore(store);

  const addSong = () => {
    state.songs.push({ title: 'New Song' }); // Just push! Auto-syncs!
  };

  return (
    <div>
      {state.songs.map((song, i) => (
        <div key={i}>{song.title}</div>
      ))}
      <button onClick={addSong}>Add Song</button>
    </div>
  );
}
```

**Pros:**
- Easiest API (no learning curve)
- Perfect React integration
- Built on battle-tested Yjs
- Great for rapid prototyping

**Cons:**
- Less control than raw Yjs
- Smaller community
- Limited documentation (newer library)

**Best For:**
- React apps that want simple real-time sync
- Prototyping collaborative features
- Teams new to CRDTs

---

#### 4. RxDB with CRDT Plugin
**npm:** `rxdb`
**Website:** https://rxdb.info/crdt.html
**GitHub:** https://github.com/pubkey/rxdb

**Why Different:**
- Not a CRDT library - it's a **database** with CRDT support
- Like PouchDB/Dexie but with built-in conflict resolution
- Reactive queries (RxJS)
- Offline-first, sync-enabled database

**Features:**
- CRDT operations stored as JSON
- Deterministic conflict resolution
- Works with Supabase, GraphQL, WebSocket
- Schema-based (like Mongoose)

**CRDT Example:**
```javascript
// CRDT operations stored with document
{
  id: 'song_1',
  title: 'Amazing Grace',
  _crdtOperations: [
    { op: 'set', path: 'title', value: 'Amazing Grace', timestamp: 1729123456 },
    { op: 'set', path: 'key', value: 'G', timestamp: 1729123460 }
  ]
}

// On conflict, merge operations deterministically
```

**Pros:**
- Full database solution (not just sync)
- Schema validation
- Query engine
- Works with existing backends (Supabase)

**Cons:**
- More complex than pure CRDTs
- Larger bundle size
- Steeper learning curve

**Best For:**
- Apps that need full database features + conflict resolution
- Replacing IndexedDB with reactive database
- Complex data relationships

---

### CRDT Comparison Table

| Library | Bundle Size | React Support | Ease of Use | Best For |
|---------|-------------|---------------|-------------|----------|
| Yjs | ~30KB | Good (community hooks) | Medium | Real-time collaboration |
| Automerge | ~200KB | Fair (manual integration) | Medium | Version history, JSON data |
| SyncedStore | ~40KB | Excellent (official hooks) | **Easy** | React apps, rapid prototyping |
| RxDB | ~100KB+ | Good (RxJS integration) | Complex | Full database with CRDTs |

---

### Recommendations for HSA Songbook

**Phase 5 (Cloud Sync MVP):**
- ❌ **Don't use CRDTs** - Too complex for single-user sync
- ✅ Use **Last-Write-Wins** + **diff-match-patch** for text merging

**Phase 6 (Real-Time Collaboration):**
- ✅ Use **Yjs** if we add multi-user setlist editing
- ✅ Use **SyncedStore** if we want easiest React integration

**Example: Yjs for Multi-User Setlist**
```jsx
// Future Phase 6 feature
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function CollaborativeSetlist({ setlistId }) {
  const [doc] = useState(() => new Y.Doc());

  useEffect(() => {
    // Connect to Yjs server
    const provider = new WebsocketProvider(
      'wss://your-yjs-server.com',
      `setlist-${setlistId}`,
      doc
    );

    // Shared setlist array
    const ySongs = doc.getArray('songs');

    // Observe changes from other users
    ySongs.observe(() => {
      console.log('Someone added/removed a song!');
      // Update UI
    });

    return () => provider.destroy();
  }, [doc, setlistId]);

  const addSongToSetlist = (song) => {
    const ySongs = doc.getArray('songs');
    ySongs.push([song]); // Auto-syncs to all users!
  };

  return (
    <div>
      {/* Setlist UI */}
    </div>
  );
}
```

---

### Resources

**Yjs:**
- Docs: https://docs.yjs.dev/
- React Tutorial: https://medium.com/@ethanryan/making-a-simple-real-time-collaboration-app-with-react-node-express-and-yjs-a261597fdd44
- Examples: https://github.com/yjs/yjs-demos

**Automerge:**
- Docs: https://automerge.org/docs/quickstart/
- React Example: https://github.com/automerge/automerge/tree/main/examples/react

**SyncedStore:**
- Docs: https://syncedstore.org/docs/
- React Guide: https://syncedstore.org/docs/react

**RxDB:**
- CRDT Plugin Docs: https://rxdb.info/crdt.html
- Conflict Resolution: https://rxdb.info/conflict-resolution.html

---

## Mobile vs. Desktop Considerations

### Key Differences

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Screen Space** | Large (>1024px) | Small (320-428px) |
| **Interaction** | Mouse + Keyboard | Touch + limited keyboard |
| **Network** | Usually stable | Often unstable (cellular) |
| **Multi-tasking** | Easy (multiple windows) | Limited (single app focus) |
| **Conflict Resolution** | Can show detailed diffs | Must simplify to fit screen |

---

### Mobile-Specific Challenges

#### 1. Screen Space Constraints

**Desktop:**
```
[Local Version]  |  [Remote Version]
─────────────────┼─────────────────
Line 1: Hello    |  Line 1: Hi
Line 2: World    |  Line 2: World
Line 3: Test     |  Line 3: Testing

[Keep Local] [Keep Remote]
```

**Mobile:**
```
⚠️ Conflict in "Amazing Grace"

Your phone (2 hours ago):
  [Preview of your version...]

Laptop (1 hour ago):
  [Preview of other version...]

[View Full Diff]
[Keep Phone] [Keep Laptop]
```

**Solution:**
- Use **stacked layout** instead of side-by-side
- Show **previews** instead of full content
- Provide **"View Full Diff"** button that opens full-screen modal

---

#### 2. Touch Interaction

**Problems:**
- No hover states
- Fat fingers (larger tap targets needed)
- No keyboard shortcuts
- Harder to scroll through long diffs

**Solutions:**
```jsx
// Larger touch targets (min 44px height)
<Button
  className="min-h-[44px] px-6 text-base"
  onClick={keepLocalVersion}
>
  Keep My Version
</Button>

// Swipe gestures for navigation
<SwipeableModal onSwipeDown={close}>
  <DiffView />
</SwipeableModal>

// Bottom sheet instead of dropdown
<BottomSheet>
  <ConflictResolution />
</BottomSheet>
```

---

#### 3. Network Instability

Mobile users often have:
- Intermittent connectivity
- Slow cellular data
- Airplane mode
- Battery saving mode (restricts background sync)

**Design Implications:**
- More frequent sync conflicts (devices offline longer)
- Need better offline indicators
- Background sync may not work
- Manual sync trigger important

**Mobile UI Pattern:**
```jsx
function MobileSyncStatus() {
  return (
    <div className="sticky top-0 bg-yellow-50 p-2">
      <div className="flex items-center gap-2">
        <WifiOff size={16} />
        <span className="text-sm">Offline - 3 songs waiting to sync</span>
        <button className="ml-auto text-blue-600">
          Sync Now
        </button>
      </div>
    </div>
  );
}
```

---

### Mobile Conflict Resolution Patterns

#### Pattern 1: Bottom Sheet with Simple Choice

```jsx
import { Sheet, SheetContent } from '@/components/ui/sheet';

function MobileConflictSheet({ song, localVersion, remoteVersion, onResolve }) {
  return (
    <Sheet open={true}>
      <SheetContent side="bottom" className="h-[80vh]">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">
            Sync Conflict: {song.title}
          </h2>

          <p className="text-sm text-gray-600">
            This song was edited on your phone and laptop while offline.
            Choose which version to keep.
          </p>

          {/* Local Version Preview */}
          <div className="border rounded p-3 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={16} />
              <span className="font-medium">Your Phone</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <pre className="text-xs line-clamp-5">{localVersion}</pre>
          </div>

          {/* Remote Version Preview */}
          <div className="border rounded p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <Laptop size={16} />
              <span className="font-medium">Your Laptop</span>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
            <pre className="text-xs line-clamp-5">{remoteVersion}</pre>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full h-12"
              onClick={() => onResolve('local')}
            >
              Keep Phone Version
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => onResolve('remote')}
            >
              Keep Laptop Version
            </Button>
            <Button
              variant="ghost"
              className="w-full h-12"
              onClick={() => showFullDiff()}
            >
              View Full Differences
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

#### Pattern 2: Full-Screen Diff (Mobile)

```jsx
function MobileFullDiff({ local, remote, onResolve }) {
  const [view, setView] = useState('split'); // 'split' | 'local' | 'remote'

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" onClick={onClose}>
          <X size={20} />
        </Button>
        <h1 className="font-bold">View Differences</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* View Toggle */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 ${view === 'local' ? 'bg-blue-50' : ''}`}
          onClick={() => setView('local')}
        >
          Phone Version
        </button>
        <button
          className={`flex-1 py-3 ${view === 'remote' ? 'bg-green-50' : ''}`}
          onClick={() => setView('remote')}
        >
          Laptop Version
        </button>
        <button
          className={`flex-1 py-3 ${view === 'split' ? 'bg-gray-50' : ''}`}
          onClick={() => setView('split')}
        >
          Differences
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {view === 'split' ? (
          // Use simplified diff view (not full side-by-side)
          <SimpleDiffView local={local} remote={remote} />
        ) : view === 'local' ? (
          <pre className="text-sm">{local}</pre>
        ) : (
          <pre className="text-sm">{remote}</pre>
        )}
      </div>

      {/* Actions (sticky bottom) */}
      <div className="border-t p-4 space-y-2 bg-white">
        <Button
          className="w-full h-12"
          onClick={() => onResolve('local')}
        >
          Keep Phone Version
        </Button>
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => onResolve('remote')}
        >
          Keep Laptop Version
        </Button>
      </div>
    </div>
  );
}
```

---

#### Pattern 3: Inline Diff (Mobile-Optimized)

Instead of side-by-side, show changes inline:

```jsx
function MobileInlineDiff({ changes }) {
  return (
    <div className="space-y-1 text-sm font-mono">
      {changes.map((change, i) => (
        <div
          key={i}
          className={
            change.type === 'added' ? 'bg-green-100 text-green-900' :
            change.type === 'removed' ? 'bg-red-100 text-red-900' :
            'bg-gray-50'
          }
        >
          <span className="inline-block w-8 text-gray-500">
            {change.lineNumber}
          </span>
          <span className="px-2">{change.content}</span>
        </div>
      ))}
    </div>
  );
}
```

---

### Desktop Conflict Resolution Patterns

Desktop has more space for sophisticated UI:

```jsx
function DesktopConflictModal({ song, local, remote, onResolve }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resolve Conflict: {song.title}</DialogTitle>
          <DialogDescription>
            Choose which version to keep, or manually merge the changes.
          </DialogDescription>
        </DialogHeader>

        {/* Side-by-side diff */}
        <div className="flex-1 overflow-auto">
          <ReactDiffViewer
            oldValue={local}
            newValue={remote}
            splitView={true}
            leftTitle="Your Local Version (2 hours ago)"
            rightTitle="Server Version (1 hour ago)"
            showDiffOnly={false}
            useDarkTheme={false}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onResolve('local')}>
            Keep Local Version
          </Button>
          <Button variant="outline" onClick={() => onResolve('remote')}>
            Keep Server Version
          </Button>
          <Button onClick={() => openManualEditor()}>
            Manually Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Best Practices by Platform

**Mobile:**
- ✅ Use bottom sheets for conflict UI
- ✅ Show previews (truncated), not full content
- ✅ Stacked layout (not side-by-side)
- ✅ Larger touch targets (44px minimum)
- ✅ Swipe gestures for dismissing modals
- ✅ Full-screen diff as optional (not default)
- ✅ Sticky action buttons at bottom

**Desktop:**
- ✅ Use modals with side-by-side diff
- ✅ Keyboard shortcuts (arrows, Esc, Enter)
- ✅ Full-featured diff viewer (react-diff-viewer)
- ✅ Allow manual editing to resolve conflict
- ✅ Show metadata (timestamps, device names)

**Both:**
- ✅ Clear device names ("Phone", "Laptop" not "Device A", "Device B")
- ✅ Relative timestamps ("2 hours ago" not "2:00 PM")
- ✅ Visual icons (phone icon, laptop icon)
- ✅ Always offer undo/version history
- ✅ Explain what happened in plain language

---

## Best Practices for Non-Technical Users

Musicians and worship leaders aren't developers. The UI must be simple, clear, and forgiving.

---

### 1. Use Plain Language

**Bad:**
```
❌ "Merge conflict detected in arrangement_23.txt"
❌ "Remote HEAD diverged from local branch"
❌ "Conflict resolution required for SHA-256 mismatch"
```

**Good:**
```
✓ "You edited this song on two devices"
✓ "Which version should we keep?"
✓ "This song was updated on your laptop"
```

**Rules:**
- No technical jargon (SHA, merge, branch, commit, HEAD)
- Use familiar terms (phone, laptop, tablet, not "Device A")
- Explain WHY conflict happened ("You edited offline on two devices")

---

### 2. Show Context, Not Data

**Bad:**
```
❌ Conflict at line 23, column 45
❌ Hash: 7f8a9b2c
❌ Modified: 2025-10-14T14:32:18.472Z
```

**Good:**
```
✓ Last edited: 2 hours ago on your Phone
✓ Newer version: 1 hour ago on your Laptop
✓ [Preview of the actual chord chart]
```

**Include:**
- Device name with icon (📱 Phone, 💻 Laptop)
- Relative time ("2 hours ago" not timestamp)
- Preview of actual content (chords, lyrics)
- Visual highlights of what changed

---

### 3. Minimize Decisions

**Bad: Too Many Choices**
```
❌ Which conflict resolution strategy?
   [ ] Last-write-wins
   [ ] Three-way merge
   [ ] Operational transform
   [ ] Manual resolution
```

**Good: Simple Choice**
```
✓ Which version should we keep?
   [Keep Phone Version] [Keep Laptop Version]

   Not sure? [View Differences]
```

**Guidelines:**
- Max 2-3 options
- Use action-oriented buttons ("Keep Phone Version" not "Option A")
- Provide escape hatch ("Not sure? View differences")
- Default to safest option (usually keep newest)

---

### 4. Make It Reversible

Users need confidence they can undo mistakes.

**Example:**
```jsx
function ConflictResolution({ onResolve }) {
  const handleResolve = async (choice) => {
    // Save to version history before applying
    await saveToHistory(currentVersion);

    // Apply resolution
    await onResolve(choice);

    // Show success with undo option
    toast.success(
      'Conflict resolved - kept laptop version',
      {
        action: {
          label: 'Undo',
          onClick: () => restoreFromHistory()
        }
      }
    );
  };

  return (
    // UI...
  );
}
```

**Key Elements:**
- Auto-save to version history before any conflict resolution
- Show "Undo" button in success notification
- Provide "Version History" page (Settings > Version History)
- Keep at least 30 days of history

---

### 5. Educate Gently

**First-Time Conflict:**
Show explanation modal:
```
🤔 What's a sync conflict?

When you edit the same song on two devices while offline,
we need your help to choose which version to keep.

This happens rarely - usually we sync automatically!

[Got it, show me the conflict]
[Don't show this again]
```

**In-Context Help:**
```jsx
function ConflictModal({ showHelp }) {
  return (
    <div>
      <h2>Sync Conflict</h2>
      {showHelp && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You edited this song on your phone and laptop while offline.
            Choose which version to keep, or view the differences to compare.
          </AlertDescription>
        </Alert>
      )}
      {/* Rest of UI */}
    </div>
  );
}
```

---

### 6. Prevent Conflicts When Possible

**Real-Time Indicators:**
```jsx
function SongEditor({ songId }) {
  const { otherDevices } = useActiveSessions(songId);

  return (
    <div>
      {otherDevices.length > 0 && (
        <Banner variant="warning">
          ⚠️ This song is open on your {otherDevices[0]}
          - save there first to avoid conflicts
        </Banner>
      )}
      <ChordProEditor />
    </div>
  );
}
```

**Optimistic Sync:**
- Sync frequently in background (every 30 seconds when online)
- Show "Syncing..." indicator so users know it's working
- Prioritize recent edits (don't wait for batch)

---

### 7. Visual Feedback

**Device Icons:**
```jsx
const DEVICE_ICONS = {
  phone: <Smartphone className="w-4 h-4" />,
  tablet: <Tablet className="w-4 h-4" />,
  laptop: <Laptop className="w-4 h-4" />,
  desktop: <Monitor className="w-4 h-4" />
};

function DeviceLabel({ deviceType, deviceName }) {
  return (
    <div className="flex items-center gap-2">
      {DEVICE_ICONS[deviceType]}
      <span>{deviceName}</span>
    </div>
  );
}
```

**Color Coding:**
- 🟢 Green: Your current device
- 🔵 Blue: Your other device
- 🔴 Red: Content being removed/replaced
- 🟡 Yellow: Warning/conflict state

**Highlighting Changes:**
```jsx
function ChangePreview({ original, modified }) {
  const diff = computeDiff(original, modified);

  return (
    <div>
      {diff.map((part, i) => (
        <span
          key={i}
          className={
            part.added ? 'bg-green-100 text-green-900' :
            part.removed ? 'bg-red-100 text-red-900' :
            ''
          }
        >
          {part.value}
        </span>
      ))}
    </div>
  );
}
```

---

### 8. Graceful Degradation

**What if user ignores conflict?**

Don't block them - save both versions:
```javascript
async function handleIgnoredConflict(local, remote) {
  // Keep remote as main version (LWW)
  await db.arrangements.put(remote);

  // Save local as backup
  await db.history.add({
    arrangementId: local.id,
    content: local.chordProContent,
    timestamp: local.updatedAt,
    reason: 'Conflict - auto-resolved to remote version',
    canRestore: true
  });

  // Notify user
  toast.info(
    'Conflict auto-resolved - your local changes are saved in history',
    {
      action: { label: 'View History', onClick: openHistory }
    }
  );
}
```

---

### Example: Complete Non-Technical Flow

**Scenario:** User edited "Amazing Grace" on phone while offline, then on laptop.

**Step 1: Detection**
```
[Background] Sync detects conflict
[System] Saves both versions to history
[UI] Shows notification: "Sync conflict in Amazing Grace - tap to resolve"
```

**Step 2: Notification**
```
╔═══════════════════════════════════╗
║ 🔔 Sync Conflict                  ║
║ Amazing Grace - John Newton       ║
║                                   ║
║ You edited this song on two       ║
║ devices. Tap to choose which      ║
║ version to keep.                  ║
║                                   ║
║ [Resolve Now]  [Later]            ║
╚═══════════════════════════════════╝
```

**Step 3: Simple Choice (Mobile)**
```
╔═══════════════════════════════════╗
║ ⚠️ Choose Version to Keep         ║
╟───────────────────────────────────╢
║                                   ║
║ 📱 Your Phone (2 hours ago)       ║
║ ┌─────────────────────────────┐   ║
║ │ {title: Amazing Grace}      │   ║
║ │ {key: G}                    │   ║
║ │ {tempo: 90}                 │   ║
║ │                             │   ║
║ │ [G]Amazing [C]grace...      │   ║
║ └─────────────────────────────┘   ║
║                                   ║
║ 💻 Your Laptop (1 hour ago)       ║
║ ┌─────────────────────────────┐   ║
║ │ {title: Amazing Grace}      │   ║
║ │ {key: A}  ← Different!      │   ║
║ │ {tempo: 95} ← Different!    │   ║
║ │                             │   ║
║ │ [A]Amazing [D]grace...      │   ║
║ └─────────────────────────────┘   ║
║                                   ║
║ [Keep Phone Version]              ║
║ [Keep Laptop Version]             ║
║ [View Full Differences]           ║
║                                   ║
╚═══════════════════════════════════╝
```

**Step 4: Confirmation**
```
╔═══════════════════════════════════╗
║ ✅ Conflict Resolved              ║
║                                   ║
║ Kept laptop version (key: A).     ║
║ Your phone version is saved in    ║
║ version history if you need it.   ║
║                                   ║
║ [Undo]  [View History]  [Done]    ║
╚═══════════════════════════════════╝
```

---

### Checklist for Non-Technical UX

- [ ] Uses plain language (no "merge", "SHA", "conflict resolution strategy")
- [ ] Shows device names with icons (📱 Phone, 💻 Laptop)
- [ ] Uses relative time ("2 hours ago" not "14:32:18")
- [ ] Previews actual content (not just metadata)
- [ ] Limits choices to 2-3 options
- [ ] Provides "View Differences" for uncertainty
- [ ] Always allows undo/restore from history
- [ ] Auto-resolves when possible (LWW for metadata)
- [ ] Only prompts for critical conflicts (content changes)
- [ ] Shows gentle education on first conflict
- [ ] Highlights what changed (green added, red removed)
- [ ] Doesn't block user workflow (save both if ignored)

---

## Implementation Recommendations

Based on all research findings, here's the recommended approach for **HSA Songbook Phase 5**:

---

### Phase 5 MVP: Cloud Sync with Conflict Resolution

**Tech Stack:**
- **Backend:** Supabase (Postgres + Real-time + Auth)
- **Sync Strategy:** Last-Write-Wins (LWW) with user prompts for critical conflicts
- **Text Merging:** `diff-match-patch` for auto-merging ChordPro content when possible
- **Diff UI (Desktop):** `react-diff-viewer-continued`
- **Diff UI (Mobile):** Custom bottom sheet with inline diff
- **Progress Indicators:** `sonner` toast notifications + sync status icon
- **Version History:** Store all versions in Supabase for 30 days

---

### Conflict Resolution Strategy (Detailed)

#### 1. Automatic Resolution (No User Prompt)

**When:**
- Metadata-only conflicts (key, tempo, capo, time signature)
- Recent conflicts (< 5 minutes apart)
- Arrangement settings (display preferences)

**How:**
- Use Last-Write-Wins (newest timestamp wins)
- Show toast notification: "Synced from [Device] - key changed to A"
- Save old version to history (with undo)

**Code:**
```typescript
async function autoResolveMetadataConflict(local: Arrangement, remote: Arrangement) {
  const winner = remote.updatedAt > local.updatedAt ? remote : local;
  const loser = winner === remote ? local : remote;

  // Save loser to history
  await saveToHistory(loser, 'Auto-resolved metadata conflict');

  // Apply winner
  await db.arrangements.put(winner);

  // Notify user
  toast.success(`Synced from ${winner.deviceName}`, {
    description: `Key: ${winner.key}, Tempo: ${winner.tempo}`,
    action: { label: 'Undo', onClick: () => restoreFromHistory(loser.id) }
  });
}
```

---

#### 2. Smart Auto-Merge (Attempt, Fallback to User Prompt)

**When:**
- ChordPro content conflicts
- Changes are in different parts of the file

**How:**
- Use Google's `diff-match-patch` library to auto-merge
- If merge succeeds, apply and notify user
- If merge fails (overlapping changes), prompt user

**Installation:**
```bash
npm install diff-match-patch
npm install @types/diff-match-patch --save-dev
```

**Code:**
```typescript
import DiffMatchPatch from 'diff-match-patch';

async function attemptAutoMerge(local: string, remote: string, ancestor: string) {
  const dmp = new DiffMatchPatch();

  // Create patches from ancestor to both versions
  const patchesLocal = dmp.patch_make(ancestor, local);
  const patchesRemote = dmp.patch_make(ancestor, remote);

  // Try to apply both patches to ancestor
  const [mergedLocal, resultsLocal] = dmp.patch_apply(patchesLocal, remote);
  const [mergedRemote, resultsRemote] = dmp.patch_apply(patchesRemote, local);

  // Check if merge succeeded
  const localSuccess = resultsLocal.every(r => r === true);
  const remoteSuccess = resultsRemote.every(r => r === true);

  if (localSuccess || remoteSuccess) {
    const merged = localSuccess ? mergedLocal : mergedRemote;

    // Save both originals to history
    await saveToHistory(local, 'Auto-merged conflict');
    await saveToHistory(remote, 'Auto-merged conflict');

    // Apply merge
    return { success: true, merged };
  } else {
    // Merge failed - prompt user
    return { success: false };
  }
}
```

---

#### 3. User Prompt (Manual Resolution)

**When:**
- Auto-merge failed
- Conflicts are old (> 1 hour apart)
- Critical content (entire song, setlist)

**Desktop UI:**
```jsx
import ReactDiffViewer from 'react-diff-viewer-continued';

function DesktopConflictModal({
  song,
  localVersion,
  remoteVersion,
  localDevice,
  remoteDevice,
  onResolve
}) {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resolve Conflict: {song.title}</DialogTitle>
          <DialogDescription>
            You edited this song on {localDevice.name} and {remoteDevice.name}
            while offline. Choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <ReactDiffViewer
            oldValue={localVersion.chordProContent}
            newValue={remoteVersion.chordProContent}
            splitView={true}
            leftTitle={`${localDevice.icon} ${localDevice.name} (${formatRelativeTime(localVersion.updatedAt)})`}
            rightTitle={`${remoteDevice.icon} ${remoteDevice.name} (${formatRelativeTime(remoteVersion.updatedAt)})`}
            showDiffOnly={false}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onResolve('local')}
          >
            Keep {localDevice.name} Version
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve('remote')}
          >
            Keep {remoteDevice.name} Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Mobile UI:**
```jsx
function MobileConflictSheet({
  song,
  localVersion,
  remoteVersion,
  localDevice,
  remoteDevice,
  onResolve
}) {
  return (
    <Sheet open={true}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Choose Version to Keep</SheetTitle>
          <SheetDescription>{song.title}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Local Version Preview */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              {localDevice.icon}
              <span className="font-medium">{localDevice.name}</span>
              <Badge variant="secondary">
                {formatRelativeTime(localVersion.updatedAt)}
              </Badge>
            </div>
            <pre className="text-xs overflow-auto max-h-32 line-clamp-6">
              {localVersion.chordProContent}
            </pre>
          </div>

          {/* Remote Version Preview */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              {remoteDevice.icon}
              <span className="font-medium">{remoteDevice.name}</span>
              <Badge variant="secondary">
                {formatRelativeTime(remoteVersion.updatedAt)}
              </Badge>
            </div>
            <pre className="text-xs overflow-auto max-h-32 line-clamp-6">
              {remoteVersion.chordProContent}
            </pre>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <Button
            className="w-full h-12"
            onClick={() => onResolve('local')}
          >
            Keep {localDevice.name} Version
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => onResolve('remote')}
          >
            Keep {remoteDevice.name} Version
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12"
            onClick={() => showFullScreenDiff()}
          >
            View Full Differences
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Sync Status Indicators

**Header Icon (Always Visible):**
```jsx
function SyncStatusIcon() {
  const { status, pendingCount } = useSyncStatus();

  const icons = {
    synced: <CloudCheck className="text-green-600" />,
    syncing: <CloudUpload className="text-blue-600 animate-pulse" />,
    offline: <CloudOff className="text-gray-400" />,
    error: <CloudAlert className="text-red-600" />,
    conflict: <AlertTriangle className="text-yellow-600" />
  };

  return (
    <button
      onClick={openSyncModal}
      className="relative"
      aria-label="Sync status"
    >
      {icons[status]}
      {pendingCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full">
          {pendingCount}
        </Badge>
      )}
    </button>
  );
}
```

**Toast Notifications (During Sync):**
```tsx
// Start sync
toast.loading('Syncing 5 songs...', { id: 'sync', duration: Infinity });

// Update progress
toast.loading('Syncing 3 of 5 songs...', { id: 'sync' });

// Success
toast.success('Synced to cloud', { id: 'sync' });

// Error
toast.error('Sync failed - will retry', {
  id: 'sync',
  action: { label: 'Retry Now', onClick: retrySync }
});
```

---

### Version History

**Database Schema:**
```sql
CREATE TABLE arrangement_history (
  id UUID PRIMARY KEY,
  arrangement_id UUID NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  device_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  reason TEXT, -- 'manual_save', 'conflict_resolved', 'auto_merge', etc.
  can_restore BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-delete after 30 days
CREATE INDEX idx_history_timestamp ON arrangement_history(timestamp);
```

**UI:**
```jsx
function VersionHistoryPage({ arrangementId }) {
  const { history } = useArrangementHistory(arrangementId);

  return (
    <div>
      <h1>Version History</h1>
      <p className="text-sm text-gray-600">
        Versions are kept for 30 days
      </p>

      <div className="space-y-2 mt-4">
        {history.map(version => (
          <Card key={version.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(version.deviceName)}
                  <span>{version.deviceName}</span>
                </div>
                <Badge variant="outline">
                  {formatRelativeTime(version.timestamp)}
                </Badge>
              </div>
              {version.reason && (
                <p className="text-xs text-gray-500">{version.reason}</p>
              )}
            </CardHeader>
            <CardContent>
              <pre className="text-xs line-clamp-3">
                {version.content}
              </pre>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => restoreVersion(version)}
              >
                Restore This Version
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => viewVersion(version)}
              >
                View Full Content
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### Error Messaging Templates

**Offline:**
```tsx
toast.info("You're offline - changes saved locally", {
  description: "We'll sync when you're back online",
  icon: <CloudOff />
});
```

**Syncing:**
```tsx
toast.loading("Syncing 3 songs...", {
  id: 'sync',
  description: "This may take a moment"
});
```

**Conflict:**
```tsx
toast.warning("Sync conflict detected", {
  description: "Tap to resolve",
  action: {
    label: 'Resolve',
    onClick: () => openConflictModal()
  }
});
```

**Success:**
```tsx
toast.success("Synced to cloud", {
  description: "All changes saved",
  icon: <CloudCheck />
});
```

**Error:**
```tsx
toast.error("Couldn't sync", {
  description: "Check your internet connection",
  action: {
    label: 'Retry',
    onClick: retrySync
  }
});
```

---

### Summary: Phase 5 Implementation Checklist

**Backend (Supabase):**
- [ ] Set up Supabase project
- [ ] Create tables: `arrangements`, `songs`, `setlists`, `arrangement_history`
- [ ] Enable Row Level Security (RLS) policies
- [ ] Set up real-time subscriptions (optional for Phase 6)

**Sync Logic:**
- [ ] Install `diff-match-patch` for auto-merge
- [ ] Implement LWW for metadata conflicts
- [ ] Implement auto-merge for ChordPro content
- [ ] Fallback to user prompt when auto-merge fails
- [ ] Save all versions to history before resolving

**Conflict UI:**
- [ ] Install `react-diff-viewer-continued` for desktop
- [ ] Build custom mobile bottom sheet for conflicts
- [ ] Add device name/icon to sync status
- [ ] Implement version history page

**Progress Indicators:**
- [ ] Install `sonner` for toast notifications
- [ ] Add sync status icon to header
- [ ] Show progress during batch sync
- [ ] Offline indicator in header

**Error Handling:**
- [ ] User-friendly error messages (no jargon)
- [ ] Retry logic for failed syncs
- [ ] Undo functionality for all conflict resolutions

---

### Future Enhancements (Phase 6+)

**CRDTs for Real-Time Collaboration:**
- If we add multi-user setlist editing, migrate to Yjs
- Implement WebSocket server for real-time sync
- Use `SyncedStore` for easy React integration

**Advanced Conflict Resolution:**
- Allow manual editing to resolve conflicts (Monaco diff editor)
- Three-way merge (ancestor + local + remote)
- Merge strategies per data type (songs vs. setlists)

**Performance:**
- Delta sync (only sync changed fields, not full documents)
- Incremental sync (track which items need sync)
- Background sync service worker

---

## Resources & References

### Documentation
- **Google's Design Guidelines for Offline/Sync:** https://developers.google.com/open-health-stack/design/offline-sync-guideline
- **A List Apart - Offline-First Web Apps:** https://alistapart.com/article/offline-first/
- **Hasura - Offline-First App Design Guide:** https://hasura.io/blog/design-guide-to-offline-first-apps

### Libraries
- **react-diff-viewer-continued:** https://github.com/Aeolun/react-diff-viewer-continued
- **Monaco Editor React:** https://github.com/suren-atoyan/monaco-react
- **diff-match-patch:** https://github.com/google/diff-match-patch
- **Yjs:** https://github.com/yjs/yjs
- **Automerge:** https://github.com/automerge/automerge
- **SyncedStore:** https://github.com/YousefED/SyncedStore

### Examples
- **Yjs + React Tutorial:** https://medium.com/@ethanryan/making-a-simple-real-time-collaboration-app-with-react-node-express-and-yjs-a261597fdd44
- **GitHub Conflict Resolution UI:** https://github.blog/changelog/2025-10-02-one-click-merge-conflict-resolution-now-in-the-web-interface/
- **Material UI Progress Components:** https://mui.com/material-ui/react-progress/

### Research Articles
- **Operational Transform (OT):** https://en.wikipedia.org/wiki/Operational_transformation
- **CRDTs Explained:** https://crdt.tech/
- **Last-Write-Wins Conflict Resolution:** https://dev.to/danyson/last-write-wins-a-conflict-resolution-strategy-2al6

---

## Conclusion

**Key Takeaways:**

1. **Automatic > Manual**: Users prefer conflicts resolved automatically (LWW, CRDTs, diff-match-patch)
2. **Mobile-First**: Design for small screens first, enhance for desktop
3. **Plain Language**: No technical jargon - use device names and relative time
4. **Always Reversible**: Version history + undo is critical for user trust
5. **Prevent When Possible**: Frequent background sync reduces conflicts

**Recommended Stack for HSA Songbook Phase 5:**
- **Conflict Strategy:** Last-Write-Wins + diff-match-patch + user prompts
- **Desktop Diff:** react-diff-viewer-continued
- **Mobile Diff:** Custom bottom sheet with inline diff
- **Progress:** sonner toast + sync status icon
- **History:** 30-day version history in Supabase

**Next Steps:**
1. Set up Supabase backend
2. Implement sync service with LWW + diff-match-patch
3. Build conflict resolution modals (desktop + mobile)
4. Add version history feature
5. User testing with real musicians

---

**Document End**