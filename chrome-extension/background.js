// Background service worker - handles periodic sync and programmatic script registration
const API_BASE = "https://vrsadzjyugbusfazdgyi.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc2Fkemp5dWdidXNmYXpkZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE2MzgsImV4cCI6MjA4MjA4NzYzOH0.7Kd1i_-TGG0KAfF-3AtLRcLsGmCkIKxD3FydOxqiKkU";

// Register content script programmatically
async function registerContentScript() {
  try {
    try { await chrome.scripting.unregisterContentScripts({ ids: ["ezmylife-main"] }); } catch (e) {}
    
    await chrome.scripting.registerContentScripts([{
      id: "ezmylife-main",
      matches: ["<all_urls>"],
      js: ["content.js"],
      runAt: "document_idle",
      allFrames: true,
      matchOriginAsFallback: true
    }]);
    console.log("Content script registered successfully");
  } catch (err) {
    console.error("Failed to register content script:", err);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  registerContentScript();
});

chrome.runtime.onStartup.addListener(() => {
  registerContentScript();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "REGISTER_SCRIPTS") {
    registerContentScript().then(() => sendResponse({ success: true }));
    return true;
  }
  if (msg.type === "INJECT_INTO_TAB") {
    chrome.scripting.executeScript({
      target: { tabId: msg.tabId, allFrames: true },
      files: ["content.js"]
    }).then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

chrome.alarms.create("syncShortcuts", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "syncShortcuts") {
    const { accessToken } = await chrome.storage.local.get(["accessToken"]);
    if (!accessToken) return;

    try {
      const res = await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: ANON_KEY,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.shortcuts) {
          await chrome.storage.local.set({ shortcuts: data.shortcuts });
        }
      }
    } catch (err) {
      console.error("Background sync error:", err);
    }
  }
});
