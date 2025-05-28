import type { BookmarkNode, BookmarkTreeNode } from "./types";

const API_URL = "https://api.smb.sourav.dev/api/bookmarks";

// --- Notification Function ---
function showNotification(title: string, message: string): void {
  // Use chrome.runtime.getURL to ensure the icon path is correctly resolved
  const iconPath: string = chrome.runtime.getURL("icons/icon48.png");
  const options = {
    type: "basic" as const,
    iconUrl: iconPath,
    title: title,
    message: message,
    priority: 2, // Higher priority for more important notifications
  };
  chrome.notifications.create(options, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error creating notification:",
        chrome.runtime.lastError.message
      );
    }
  });
}
// ----------------------------------------------------------------------------

function getAllBookmarks(treeNodes: BookmarkTreeNode[]): BookmarkNode[] {
  const bookmarks: BookmarkNode[] = [];

  function traverse(nodes: BookmarkTreeNode[]): void {
    for (const node of nodes) {
      if (node.url) {
        // It's a bookmark
        bookmarks.push({
          id: node.id,
          parentId: node.parentId,
          title: node.title,
          url: node.url,
          dateAdded: node.dateAdded,
          type: "bookmark",
        });
      } else if (node.children) {
        // It's a folder
        bookmarks.push({
          id: node.id,
          parentId: node.parentId,
          title: node.title,
          dateAdded: node.dateAdded,
          type: "folder",
        });
        traverse(node.children); // Recurse into children
      }
    }
  }

  // Start traversal from the root nodes
  traverse(treeNodes);
  return bookmarks;
}

// --- Function to send initial bookmarks to the API ---
const sendInitialBookmarksToApi = async (data: {
  bookmarks: BookmarkNode[];
}) => {
  try {
    // Get the verificationCode from local storage
    const token = await chrome.storage.local.get("verificationCode");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.verificationCode}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      showNotification(
        "Server Not Responding!",
        `Failed to send initial bookmarks. Please try again later.`
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await response.json();
  } catch (error) {
    showNotification(
      "Bookmark Sync Failed!",
      "Could not send initial bookmarks to the server. Please check your connection."
    );
    console.error("Error sending initial bookmarks:", error);
  }
};

const sendBookmarksToApi = async () => {
  try {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error fetching bookmarks on install:",
          chrome.runtime.lastError.message
        );
        return;
      }

      const allBookmarks = getAllBookmarks(bookmarkTreeNodes);

      // Send all bookmarks to the specified API_INSTALL_ENDPOINT
      sendInitialBookmarksToApi({ bookmarks: allBookmarks });
    });
  } catch (error) {
    console.error("Error sending bookmarks:", error);
  }
};

// Listen for bookmark changes
chrome.bookmarks.onCreated.addListener(sendBookmarksToApi);
chrome.bookmarks.onRemoved.addListener(sendBookmarksToApi);
chrome.bookmarks.onChanged.addListener(sendBookmarksToApi);
chrome.bookmarks.onMoved.addListener(sendBookmarksToApi);
