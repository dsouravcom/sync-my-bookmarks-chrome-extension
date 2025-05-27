import { fullSync } from "./syncer";

// Alarm name for the periodic sync
const SYNC_ALARM_NAME = "periodicFullSync";

// --- Notification Function ---
function showNotification(title: string, message: string): void {
  console.log(
    `Attempting to show notification: Title="${title}", Message="${message}"`
  );
  // Use chrome.runtime.getURL to ensure the icon path is correctly resolved
  const iconPath: string = chrome.runtime.getURL("icons/icon48.png");
  const options = {
    type: "basic" as const,
    iconUrl: iconPath,
    title: title,
    message: message,
    priority: 2, // Higher priority for more important notifications
  };
  chrome.notifications.create(options, (notificationId: string) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error creating notification:",
        chrome.runtime.lastError.message
      );
    } else {
      console.log("Notification created with ID:", notificationId);
    }
  });
}

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
    console.log("✅ Periodic full sync alarm set for every 5 minutes");
  });
};

// Handle alarm events for periodic sync
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    try {
      console.log("🔄 Starting periodic full sync...");
      await fullSync();
      console.log("✅ Periodic full sync completed successfully");

      showNotification(
        "Bookmarks Synced",
        "Your bookmarks have been synced with the server."
      );
    } catch (error) {
      console.error("❌ Error during periodic full sync:", error);

      showNotification(
        "Sync Error",
        "Failed to sync bookmarks. Please check your connection."
      );
    }
  }
});

// Initialize periodic sync when service worker starts
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension starting up - setting up periodic sync");
  setupPeriodicSync();
});

// Also setup on install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated - setting up periodic sync");
  setupPeriodicSync();
});

// Setup immediately when script loads (for development)
setupPeriodicSync();

// Export the setup function in case it needs to be called manually
export { setupPeriodicSync };
