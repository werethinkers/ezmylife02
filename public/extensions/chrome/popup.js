const API_BASE = "https://vrsadzjyugbusfazdgyi.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc2Fkemp5dWdidXNmYXpkZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE2MzgsImV4cCI6MjA4MjA4NzYzOH0.7Kd1i_-TGG0KAfF-3AtLRcLsGmCkIKxD3FydOxqiKkU";

let currentShortcuts = {};

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get(["accessToken", "shortcuts"]);

  if (stored.accessToken) {
    currentShortcuts = stored.shortcuts || {};
    showLoggedIn(currentShortcuts);
    syncShortcuts(stored.accessToken);
  }

  // Check site status
  checkSiteStatus();

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("syncBtn").addEventListener("click", () => {
    chrome.storage.local.get(["accessToken"], (d) => {
      if (d.accessToken) syncShortcuts(d.accessToken);
    });
  });
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("addBtn").addEventListener("click", handleAddShortcut);
  document.getElementById("enableBtn").addEventListener("click", handleEnablePermission);
});

// Tab switching
function switchTab(tab) {
  document.getElementById("tabList").className = tab === "list" ? "tab active" : "tab";
  document.getElementById("tabAdd").className = tab === "add" ? "tab active" : "tab";
  document.getElementById("listPanel").style.display = tab === "list" ? "block" : "none";
  document.getElementById("addPanel").style.display = tab === "add" ? "block" : "none";
}

document.querySelectorAll("[data-tab]").forEach(el => {
  el.addEventListener("click", () => switchTab(el.getAttribute("data-tab")));
});

// ---- Site health check ----
async function checkSiteStatus() {
  const siteStatusEl = document.getElementById("siteStatus");
  const siteDot = document.getElementById("siteDot");
  const siteText = document.getElementById("siteStatusText");
  const enableEl = document.getElementById("enablePermission");

  siteStatusEl.style.display = "flex";
  siteStatusEl.className = "site-status checking";
  siteDot.className = "dot yellow";
  siteText.textContent = "Checking this page...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url) {
      setSiteInactive("Cannot check this page");
      return;
    }

    // Skip chrome:// and other restricted URLs
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("about:")) {
      siteStatusEl.className = "site-status inactive";
      siteDot.className = "dot yellow";
      siteText.textContent = "Extensions can't run on this page";
      enableEl.style.display = "none";
      return;
    }

    // Try to ping content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
      if (response && response.type === "PONG") {
        siteStatusEl.className = "site-status active";
        siteDot.className = "dot green";
        siteText.textContent = "✓ Active on this site";
        enableEl.style.display = "none";
        return;
      }
    } catch (e) {
      // Content script not injected
    }

    // Not active — check if we have permission
    const hasPermission = await chrome.permissions.contains({ origins: ["<all_urls>"] });
    if (hasPermission) {
      // We have permission but script isn't injected yet — inject now
      try {
        await chrome.runtime.sendMessage({ type: "INJECT_INTO_TAB", tabId: tab.id });
        // Wait and re-check
        await new Promise(r => setTimeout(r, 500));
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
          if (response && response.type === "PONG") {
            siteStatusEl.className = "site-status active";
            siteDot.className = "dot green";
            siteText.textContent = "✓ Active on this site";
            enableEl.style.display = "none";
            return;
          }
        } catch (e) {}
      } catch (e) {}
      setSiteInactive("Script couldn't load — try refreshing the page");
    } else {
      setSiteInactive("Not enabled on this site");
      enableEl.style.display = "block";
    }
  } catch (err) {
    setSiteInactive("Could not check status");
  }

  function setSiteInactive(msg) {
    siteStatusEl.className = "site-status inactive";
    siteDot.className = "dot yellow";
    siteText.textContent = msg;
  }
}

// ---- Permission request ----
async function handleEnablePermission() {
  const btn = document.getElementById("enableBtn");
  btn.textContent = "Requesting...";

  try {
    const granted = await chrome.permissions.request({ origins: ["<all_urls>"] });
    if (granted) {
      // Register content scripts via background
      await chrome.runtime.sendMessage({ type: "REGISTER_SCRIPTS" });

      // Inject into current tab immediately
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        await chrome.runtime.sendMessage({ type: "INJECT_INTO_TAB", tabId: tab.id });
      }

      document.getElementById("enablePermission").style.display = "none";
      // Re-check status
      await new Promise(r => setTimeout(r, 500));
      checkSiteStatus();
    } else {
      btn.textContent = "🔓 Enable on All Websites";
    }
  } catch (err) {
    btn.textContent = "🔓 Enable on All Websites";
    console.error("Permission request error:", err);
  }
}

// ---- Auth & Sync (unchanged logic) ----
async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return;

  document.getElementById("loginBtn").textContent = "Connecting...";

  try {
    const res = await fetch(`${API_BASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.access_token) {
      await chrome.storage.local.set({ accessToken: data.access_token });
      await syncShortcuts(data.access_token);
    } else {
      alert(data.error_description || "Login failed");
    }
  } catch (err) {
    alert("Connection error: " + err.message);
  }
  document.getElementById("loginBtn").textContent = "Connect & Sync";
}

async function syncShortcuts(token) {
  try {
    const res = await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
      headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
    });

    if (res.status === 401) { handleLogout(); return; }

    const data = await res.json();
    if (data.shortcuts) {
      currentShortcuts = data.shortcuts;
      await chrome.storage.local.set({ shortcuts: data.shortcuts });
      showLoggedIn(data.shortcuts);
      renderShortcutList(data.shortcuts);
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            type: "SHORTCUTS_UPDATED",
            shortcuts: data.shortcuts,
          }).catch(() => {});
        }
      });
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function handleAddShortcut() {
  const key = document.getElementById("newKey").value.trim();
  const value = document.getElementById("newValue").value.trim();
  const category = document.getElementById("newCategory").value.trim() || "Extension";

  if (!key || !value) { alert("Please enter both a shortcut key and expansion text."); return; }

  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  if (!accessToken) { alert("Not connected"); return; }

  document.getElementById("addBtn").textContent = "Adding...";

  try {
    const res = await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value, category }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("newKey").value = "";
      document.getElementById("newValue").value = "";
      await syncShortcuts(accessToken);
      switchTab("list");
    } else {
      alert(data.error || "Failed to add shortcut");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
  document.getElementById("addBtn").textContent = "Add Shortcut";
}

async function handleDeleteShortcut(key) {
  if (!confirm(`Delete shortcut "${key}"?`)) return;

  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  if (!accessToken) return;

  try {
    await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });
    await syncShortcuts(accessToken);
  } catch (err) {
    console.error("Delete error:", err);
  }
}

function renderShortcutList(shortcuts) {
  const container = document.getElementById("shortcutList");
  const entries = Object.entries(shortcuts);

  if (entries.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;font-size:11px;">No shortcuts yet. Add one!</p>';
    return;
  }

  container.innerHTML = entries
    .map(
      ([key, val]) =>
        `<div class="shortcut-item">
          <div>
            <div class="key">${escapeHtml(key)}</div>
            <div class="val" title="${escapeHtml(val)}">${escapeHtml(val)}</div>
          </div>
          <div class="actions">
            <button class="delete-btn" data-key="${escapeHtml(key)}">✕</button>
          </div>
        </div>`
    )
    .join("");

  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => handleDeleteShortcut(btn.getAttribute("data-key")));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showLoggedIn(shortcuts) {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("loggedInView").style.display = "block";
  document.getElementById("shortcutNum").textContent = Object.keys(shortcuts).length;
  document.getElementById("status").className = "status connected";
  document.getElementById("statusDot").className = "dot green";
  document.getElementById("statusText").textContent = "Connected & synced";
  renderShortcutList(shortcuts);
}

function handleLogout() {
  chrome.storage.local.remove(["accessToken", "shortcuts"]);
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("loggedInView").style.display = "none";
  document.getElementById("status").className = "status disconnected";
  document.getElementById("statusDot").className = "dot red";
  document.getElementById("statusText").textContent = "Not connected";
}
