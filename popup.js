// Epoch Converter popup logic
(function () {
  const $ = (id) => document.getElementById(id);
  const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  const showError = (id, msg) => { const el = $(id); if (el) el.textContent = msg || ""; };
  const showToast = (msg) => { const t = $("toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1200); };

  // Tabs
  const tabTs = $("tab-ts");
  const tabDt = $("tab-dt");
  const panelTs = $("panel-ts");
  const panelDt = $("panel-dt");
  function activateTab(which) {
    const isTs = which === "ts";
    tabTs.classList.toggle("active", isTs);
    tabDt.classList.toggle("active", !isTs);
    tabTs.setAttribute("aria-selected", String(isTs));
    tabDt.setAttribute("aria-selected", String(!isTs));
    panelTs.classList.toggle("hidden", !isTs);
    panelDt.classList.toggle("hidden", isTs);
  }
  tabTs.addEventListener("click", () => activateTab("ts"));
  tabDt.addEventListener("click", () => activateTab("dt"));

  // Timestamp → Date
  const tsInput = $("tsInput");
  const unitsAuto = $("unitsAuto");
  const unitsSec = $("unitsSec");
  const unitsMs = $("unitsMs");
  const nowSecondsBtn = $("nowSecondsBtn");
  const nowMillisBtn = $("nowMillisBtn");

  function sanitizeTimestamp(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/[ ,]/g, "").trim();
    if (!cleaned) return null;
    if (!/^[-]?\d+$/.test(cleaned)) return null;
    try { return BigInt(cleaned); } catch { return null; }
  }
  function isMsChosen() {
    if (unitsSec.checked) return false;
    if (unitsMs.checked) return true;
    return null; // auto
  }
  function detectIsMs(valueBig) {
    // Heuristic: absolute value >= 1e12 => ms, else seconds
    const absVal = valueBig < 0 ? -valueBig : valueBig;
    const threshold = BigInt(1000000000000); // 1e12
    return absVal >= threshold;
  }
  function toLocalISO(d) {
    const pad2 = (n) => String(n).padStart(2, "0");
    const pad3 = (n) => String(n).padStart(3, "0");
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    const ms = pad3(d.getMilliseconds());
    const tzoMin = -d.getTimezoneOffset();
    const sign = tzoMin >= 0 ? "+" : "-";
    const tzoH = pad2(Math.floor(Math.abs(tzoMin) / 60));
    const tzoM = pad2(Math.abs(tzoMin) % 60);
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}${sign}${tzoH}:${tzoM}`;
  }
  function friendlyFormatUTC(d) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "long", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: "UTC"
    }).format(d);
  }
  function friendlyFormatLocal(d) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "long", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    }).format(d);
  }
  function renderTsToDate() {
    const raw = tsInput.value;
    const valueBig = sanitizeTimestamp(raw);
    if (valueBig === null) {
      showError("tsError", raw ? "Please enter only digits (optional leading minus)." : "");
      setText("utcIso", "—"); setText("utcFriendly", "—");
      setText("localIso", "—"); setText("localFriendly", "—");
      return;
    }
    showError("tsError", "");

    let msMode = isMsChosen();
    if (msMode === null) {
      msMode = detectIsMs(valueBig);
      // Ambiguity note for 11–12 digit inputs
      const len = valueBig.toString().replace("-", "").length;
      if (len === 11 || len === 12) {
        showError("tsError", `Ambiguous units (${len} digits). Auto selected ${msMode ? "milliseconds" : "seconds"}. Toggle if incorrect.`);
      }
    }
    // Convert using Number safely for typical ranges; BigInt->Number may overflow, but JS Date supports up to ±8.64e15 ms
    const asNumber = Number(valueBig);
    const msVal = msMode ? asNumber : asNumber * 1000;
    const d = new Date(msVal);
    if (isNaN(d.getTime())) {
      showError("tsError", "Out of range timestamp.");
      setText("utcIso", "—"); setText("utcFriendly", "—");
      setText("localIso", "—"); setText("localFriendly", "—");
      return;
    }
    setText("utcIso", d.toISOString());
    setText("utcFriendly", friendlyFormatUTC(d));
    setText("localIso", toLocalISO(d));
    setText("localFriendly", friendlyFormatLocal(d));
  }

  tsInput.addEventListener("input", renderTsToDate);
  [unitsAuto, unitsSec, unitsMs].forEach((el) => el.addEventListener("change", renderTsToDate));
  nowSecondsBtn.addEventListener("click", () => { tsInput.value = String(Math.floor(Date.now() / 1000)); renderTsToDate(); });
  nowMillisBtn.addEventListener("click", () => { tsInput.value = String(Date.now()); renderTsToDate(); });

  // Date → Timestamp
  const dateInput = $("dateInput");
  const timeInput = $("timeInput");
  const tzLocal = $("tzLocal");
  const tzUTC = $("tzUTC");

  function parseDateTime() {
    const dateStr = dateInput.value; // YYYY-MM-DD
    const timeStr = timeInput.value; // HH:mm[:ss]
    if (!dateStr || !timeStr) return { ok: false, msg: "Please provide both date and time." };
    const [year, month, day] = dateStr.split("-").map((x) => Number(x));
    const ts = timeStr.split(":");
    const hour = Number(ts[0] || 0);
    const minute = Number(ts[1] || 0);
    const second = Number(ts[2] || 0);
    if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) {
      return { ok: false, msg: "Invalid date/time values." };
    }
    let d;
    if (tzUTC.checked) {
      d = new Date(Date.UTC(year, (month - 1), day, hour, minute, second));
    } else {
      d = new Date(year, (month - 1), day, hour, minute, second);
    }
    if (isNaN(d.getTime())) return { ok: false, msg: "Out of range date/time." };
    return { ok: true, date: d };
  }
  function renderDateToTs() {
    const res = parseDateTime();
    if (!res.ok) {
      showError("dtError", res.msg);
      setText("tsSeconds", "—");
      setText("tsMilliseconds", "—");
      return;
    }
    showError("dtError", "");
    const ms = res.date.getTime();
    const secs = Math.floor(ms / 1000);
    setText("tsSeconds", String(secs));
    setText("tsMilliseconds", String(ms));
  }

  [dateInput, timeInput, tzLocal, tzUTC].forEach((el) => el.addEventListener("change", renderDateToTs));
  [dateInput, timeInput].forEach((el) => el.addEventListener("input", renderDateToTs));

  // Copy buttons
  document.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const copyTargetId = target.getAttribute("data-copy-target");
    if (!copyTargetId) return;
    const el = $(copyTargetId);
    if (!el) return;
    const text = el.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch (err) {
      showToast("Clipboard unavailable");
    }
  });

  // Initial render
  renderTsToDate();
  renderDateToTs();

  // Prefill from selected text on the active page (Manifest V3: activeTab + scripting)
  function prefillFromPageSelection() {
    if (!("chrome" in window) || !chrome.tabs || !chrome.scripting) return;
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        if (!tab || !tab.id) return;
        try {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                try {
                  const sel = typeof window.getSelection === "function" ? window.getSelection().toString() : "";
                  let text = sel ? sel.trim() : "";
                  if (!text) {
                    const ae = document.activeElement;
                    const val = ae && "value" in ae ? ae.value : "";
                    text = (val || "").toString().trim();
                  }
                  return text || "";
                } catch (e) {
                  return "";
                }
              }
            },
            (results) => {
              try {
                if (!results || !results.length) return;
                const raw = (results[0] && results[0].result) ? String(results[0].result) : "";
                if (!raw) return;
                const cleaned = raw.replace(/[ ,]/g, "").trim();
                const valueBig = sanitizeTimestamp(cleaned);
                if (valueBig !== null) {
                  tsInput.value = cleaned;
                  renderTsToDate();
                }
              } catch (e) {
                // fail silently
              }
            }
          );
        } catch (e) {
          // fail silently
        }
      });
    } catch (e) {
      // fail silently
    }
  }

  // Call once on startup
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prefillFromPageSelection, { once: true });
  } else {
    prefillFromPageSelection();
  }

})();
