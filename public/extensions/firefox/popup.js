// Firefox-compatible popup.js
const storageAPI = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const tabsAPI = typeof browser !== "undefined" ? browser.tabs : chrome.tabs;

const API_BASE = "https://vrsadzjyugbusfazdgyi.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc2Fkemp5dWdidXNmYXpkZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE2MzgsImV4cCI6MjA4MjA4NzYzOH0.7Kd1i_-TGG0KAfF-3AtLRcLsGmCkIKxD3FydOxqiKkU";

let currentShortcuts = {};

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await storageAPI.local.get(["accessToken", "shortcuts"]);
  if (stored.accessToken) {
    currentShortcuts = stored.shortcuts || {};
    showLoggedIn(currentShortcuts);
    syncShortcuts(stored.accessToken);
  }
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("syncBtn").addEventListener("click", async () => {
    const d = await storageAPI.local.get(["accessToken"]);
    if (d.accessToken) syncShortcuts(d.accessToken);
  });
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("addBtn").addEventListener("click", handleAddShortcut);
});

window.switchTab = function (tab) {
  document.getElementById("tabList").className = tab === "list" ? "tab active" : "tab";
  document.getElementById("tabAdd").className = tab === "add" ? "tab active" : "tab";
  document.getElementById("listPanel").style.display = tab === "list" ? "block" : "none";
  document.getElementById("addPanel").style.display = tab === "add" ? "block" : "none";
};

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
      await storageAPI.local.set({ accessToken: data.access_token });
      await syncShortcuts(data.access_token);
    } else { alert(data.error_description || "Login failed"); }
  } catch (err) { alert("Connection error: " + err.message); }
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
      await storageAPI.local.set({ shortcuts: data.shortcuts });
      showLoggedIn(data.shortcuts);
      renderShortcutList(data.shortcuts);
      const tabs = await tabsAPI.query({});
      for (const tab of tabs) {
        try { tabsAPI.sendMessage(tab.id, { type: "SHORTCUTS_UPDATED", shortcuts: data.shortcuts }); } catch (e) {}
      }
    }
  } catch (err) { console.error("Sync error:", err); }
}

async function handleAddShortcut() {
  const key = document.getElementById("newKey").value.trim();
  const value = document.getElementById("newValue").value.trim();
  const category = document.getElementById("newCategory").value.trim() || "Extension";
  if (!key || !value) { alert("Please enter both a shortcut key and expansion text."); return; }
  const { accessToken } = await storageAPI.local.get(["accessToken"]);
  if (!accessToken) { alert("Not connected"); return; }
  document.getElementById("addBtn").textContent = "Adding...";
  try {
    const res = await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, category }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("newKey").value = "";
      document.getElementById("newValue").value = "";
      await syncShortcuts(accessToken);
      switchTab("list");
    } else { alert(data.error || "Failed"); }
  } catch (err) { alert("Error: " + err.message); }
  document.getElementById("addBtn").textContent = "Add Shortcut";
}

async function handleDeleteShortcut(key) {
  if (!confirm(`Delete shortcut "${key}"?`)) return;
  const { accessToken } = await storageAPI.local.get(["accessToken"]);
  if (!accessToken) return;
  try {
    await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    await syncShortcuts(accessToken);
  } catch (err) { console.error("Delete error:", err); }
}
window.handleDeleteShortcut = handleDeleteShortcut;

async function handleEditShortcut(oldKey) {
  const val = currentShortcuts[oldKey] || "";
  const container = document.getElementById("shortcutList");
  const items = container.querySelectorAll(".shortcut-item");
  for (const item of items) {
    const keyEl = item.querySelector(".key");
    if (keyEl && keyEl.textContent === oldKey) {
      item.innerHTML = `
        <div style="width:100%;">
          <label style="font-size:9px;color:#94a3b8;">Key</label>
          <input type="text" id="editKey" value="${escapeHtml(oldKey)}" style="width:100%;padding:5px 7px;border:1px solid #3b82f6;border-radius:4px;background:#0f172a;color:#e2e8f0;font-size:11px;margin-bottom:4px;">
          <label style="font-size:9px;color:#94a3b8;">Value</label>
          <input type="text" id="editVal" value="${escapeHtml(val).replace(/"/g, '&quot;')}" style="width:100%;padding:5px 7px;border:1px solid #3b82f6;border-radius:4px;background:#0f172a;color:#e2e8f0;font-size:11px;margin-bottom:6px;">
          <div style="display:flex;gap:4px;">
            <button onclick="saveEdit('${escapeHtml(oldKey).replace(/'/g, "\\'")}')" style="flex:1;padding:5px;background:#059669;color:white;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;">Save</button>
            <button onclick="cancelEdit()" style="padding:5px 8px;background:#334155;color:#94a3b8;border:none;border-radius:4px;font-size:10px;cursor:pointer;">✕</button>
          </div>
        </div>`;
      break;
    }
  }
}
window.handleEditShortcut = handleEditShortcut;

async function saveEdit(oldKey) {
  const newKey = document.getElementById("editKey").value.trim();
  const newVal = document.getElementById("editVal").value.trim();
  if (!newKey || !newVal) { alert("Both fields required"); return; }
  const { accessToken } = await storageAPI.local.get(["accessToken"]);
  if (!accessToken) return;
  try {
    await fetch(`${API_BASE}/functions/v1/sync-shortcuts`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ oldKey, newKey, newValue: newVal }),
    });
    await syncShortcuts(accessToken);
  } catch (err) { console.error("Edit error:", err); }
}
window.saveEdit = saveEdit;

function cancelEdit() {
  renderShortcutList(currentShortcuts);
}
window.cancelEdit = cancelEdit;

function renderShortcutList(shortcuts) {
  const container = document.getElementById("shortcutList");
  const entries = Object.entries(shortcuts);
  if (entries.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;font-size:11px;">No shortcuts yet.</p>';
    return;
  }
  container.innerHTML = entries.map(([key, val]) =>
    `<div class="shortcut-item"><div><div class="key">${escapeHtml(key)}</div><div class="val" title="${escapeHtml(val)}">${escapeHtml(val)}</div></div><div class="actions"><button class="edit-btn" onclick="handleEditShortcut('${escapeHtml(key).replace(/'/g, "\\'")}')">✎</button><button class="delete-btn" onclick="handleDeleteShortcut('${escapeHtml(key).replace(/'/g, "\\'")}')">✕</button></div></div>`
  ).join("");
}

function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }

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
  storageAPI.local.remove(["accessToken", "shortcuts"]);
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("loggedInView").style.display = "none";
  document.getElementById("status").className = "status disconnected";
  document.getElementById("statusDot").className = "dot red";
  document.getElementById("statusText").textContent = "Not connected";
}
