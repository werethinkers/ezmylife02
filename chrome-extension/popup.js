const API_BASE = "https://vrsadzjyugbusfazdgyi.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc2Fkemp5dWdidXNmYXpkZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE2MzgsImV4cCI6MjA4MjA4NzYzOH0.7Kd1i_-TGG0KAfF-3AtLRcLsGmCkIKxD3FydOxqiKkU";

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get(["accessToken", "shortcuts"]);

  if (stored.accessToken) {
    showLoggedIn(stored.shortcuts || {});
    syncShortcuts(stored.accessToken);
  }

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("syncBtn").addEventListener("click", () => {
    chrome.storage.local.get(["accessToken"], (d) => {
      if (d.accessToken) syncShortcuts(d.accessToken);
    });
  });
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
});

async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return;

  document.getElementById("loginBtn").textContent = "Connecting...";

  try {
    const res = await fetch(`${API_BASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
      },
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
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: ANON_KEY,
      },
    });

    if (res.status === 401) {
      handleLogout();
      return;
    }

    const data = await res.json();
    if (data.shortcuts) {
      await chrome.storage.local.set({ shortcuts: data.shortcuts });
      showLoggedIn(data.shortcuts);
      // Notify content scripts
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

function showLoggedIn(shortcuts) {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("loggedInView").style.display = "block";
  document.getElementById("shortcutNum").textContent =
    Object.keys(shortcuts).length;
  document.getElementById("status").className = "status connected";
  document.getElementById("statusDot").className = "dot green";
  document.getElementById("statusText").textContent = "Connected & synced";
}

function handleLogout() {
  chrome.storage.local.remove(["accessToken", "shortcuts"]);
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("loggedInView").style.display = "none";
  document.getElementById("status").className = "status disconnected";
  document.getElementById("statusDot").className = "dot red";
  document.getElementById("statusText").textContent = "Not connected";
}
