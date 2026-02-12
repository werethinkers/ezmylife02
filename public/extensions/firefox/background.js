// Firefox background script (event page, persistent: false)
const storageAPI = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const alarmsAPI = typeof browser !== "undefined" ? browser.alarms : chrome.alarms;

alarmsAPI.create("syncShortcuts", { periodInMinutes: 30 });

alarmsAPI.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "syncShortcuts") {
    const result = await storageAPI.local.get(["accessToken"]);
    if (!result.accessToken) return;

    try {
      const res = await fetch(
        "https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/sync-shortcuts",
        {
          headers: {
            Authorization: `Bearer ${result.accessToken}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc2Fkemp5dWdidXNmYXpkZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE2MzgsImV4cCI6MjA4MjA4NzYzOH0.7Kd1i_-TGG0KAfF-3AtLRcLsGmCkIKxD3FydOxqiKkU",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.shortcuts) {
          await storageAPI.local.set({ shortcuts: data.shortcuts });
        }
      }
    } catch (err) {
      console.error("Background sync error:", err);
    }
  }
});
