# Epoch Translator (Chrome Extension)

Convert Unix timestamps to human-readable times and vice versa, with both UTC and Local outputs.

## Install
1. Download or clone this folder.
2. Open Chrome and go to `chrome://extensions`.
3. Toggle "Developer mode" on.
4. Click "Load unpacked" and select the `unix-time-converter-extension` folder.

## Usage
- Select a numeric timestamp on any normal webpage, then click the extension's toolbar icon: the popup will auto-fill the Unix Timestamp field if the selection looks valid (digits/spaces/commas tolerated). If no selection is present, it will try the focused input's value.
- Two modes:
  - Timestamp → Date: paste or use the auto-filled Unix timestamp. Auto-detects seconds vs milliseconds; you can override via the Units control. Use "Now (s)" or "Now (ms)" for the current time.
  - Date → Timestamp: choose a Date and Time, and whether to interpret them as Local or UTC. Outputs Unix timestamp (seconds and milliseconds).
- Copy any output using the Copy buttons.

## Permissions
- Minimal permissions: `activeTab` and `scripting` (used only when you click the toolbar icon). No persistent host permissions.
- On restricted pages (e.g., Chrome Web Store, `chrome://` pages), the prefill script cannot run; the popup will simply not auto-fill.

## Notes
- Chrome popup sizing: Chrome can sometimes render extension popups too narrow depending on viewport constraints. This popup enforces a ~420px minimum width. If you still see sizing issues, pin the extension and click its toolbar icon to open.
- UTC uses `Date.toISOString()` and `Intl.DateTimeFormat` with `timeZone: 'UTC'`.
- Local uses a local ISO string and system default `Intl.DateTimeFormat`.

## Testing examples
- Seconds: `1733788800`
- Milliseconds: `1733788800000`
- Negative epoch: `-1234567890`
