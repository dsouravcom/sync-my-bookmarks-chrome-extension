import { fullSync } from "./syncer";

// Alarm name for the periodic sync
const SYNC_ALARM_NAME = "periodicFullSync";

// --- Periodic Full Sync Setup ---

// Setup periodic full sync alarm on extension startup
const setupPeriodicSync = () => {
  // Clear existing alarm first
  chrome.alarms.clear(SYNC_ALARM_NAME, () => {
    // Create new alarm to trigger every 5 minutes
    chrome.alarms.create(SYNC_ALARM_NAME, {
      delayInMinutes: 5, // First sync in 5 minutes
      periodInMinutes: 5, // Then repeat every 5 minutes
    });
  });
};

// Handle alarm events for periodic sync
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    try {
      await fullSync();
    } catch (error) {
      console.error("❌ Error during periodic full sync:", error);
    }
  }
});

// Initialize periodic sync when service worker starts
chrome.runtime.onStartup.addListener(() => {
  setupPeriodicSync();
});

// Also setup on install/update
chrome.runtime.onInstalled.addListener(() => {
  setupPeriodicSync();
});

// Setup immediately when script loads (for development)
setupPeriodicSync();

// Export the setup function in case it needs to be called manually
export { setupPeriodicSync };
