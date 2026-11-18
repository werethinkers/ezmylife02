// Background service worker - handles periodic sync
chrome.alarms.create("syncShortcuts", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "syncShortcuts") {
    const { accessToken } = await chrome.storage.local.get(["accessToken"]);
    if (!accessToken) return;

    try {
      const res = await fetch(
        "https://cmwnjexfpcfpoeyemxhb.supabase.co/functions/v1/sync-shortcuts",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc2Fkemp5dWdidXNmYXpkZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE2MzgsImV4cCI6MjA4MjA4NzYzOH0.7Kd1i_-TGG0KAfF-3AtLRcLsGmCkIKxD3FydOxqiKkU",
          },
        }
      );

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
