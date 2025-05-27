// Syncer module for Chrome Extension Bookmark Manager
//
// This module provides sync functions that prioritize pure chronological order
// based on dateAdded timestamps. Items (folders and bookmarks) are created in
// the order they were originally added, with smart dependency resolution to
// ensure parent folders exist before their child items.
//
// Key features:
// - firstSync(): Smart duplicate detection and import
// - fullSync(): Complete reset and reimport with chronological ordering
// - syncBookmarksToApi(): Upload current Chrome bookmarks to API

import { getAuthToken } from "./auth";
import type { BookmarkNode } from "./types";

const API_URL = "http://localhost:3000/api/bookmarks";

const getDefaultTitle = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.length > 20 ? `${url.substring(0, 20)}...` : url;
  }
};

// Helper function to get all existing bookmarks from Chrome
const getExistingChromeBookmarks = (): Promise<BookmarkNode[]> => {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error fetching existing bookmarks:",
          chrome.runtime.lastError.message
        );
        resolve([]);
        return;
      }

      const bookmarks: BookmarkNode[] = [];

      function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[]): void {
        for (const node of nodes) {
          // Skip the default system folders (0, 1, 2)
          if (["0", "1", "2"].includes(node.id)) {
            if (node.children) {
              traverse(node.children);
            }
            continue;
          }

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
            traverse(node.children);
          }
        }
      }

      traverse(bookmarkTreeNodes);
      resolve(bookmarks);
    });
  });
};

// Helper function to send all bookmarks to API (like in background.ts)
const syncBookmarksToApi = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error("No auth token found for syncing to API");
      return;
    }

    const allBookmarks = await getExistingChromeBookmarks();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookmarks: allBookmarks }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await response.json();
  } catch (error) {
    console.error("❌ Error syncing bookmarks to API:", error);
  }
};

export const firstSync = async () => {
  try {
    // Step 1: Get existing bookmarks from Chrome browser
    const existingBookmarks = await getExistingChromeBookmarks();
    const existingUrls = new Set(
      existingBookmarks
        .filter((bookmark) => bookmark.type === "bookmark" && bookmark.url)
        .map((bookmark) => bookmark.url!)
    );

    // Step 2: Get bookmarks from API
    const token = await getAuthToken();
    if (!token) {
      console.error("❌ No auth token found");
      return;
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result: { bookmarks: BookmarkNode[] } = await response.json();
    const apiBookmarks: BookmarkNode[] = result.bookmarks || [];

    // Filter out system folders (0, 1, 2) from API response
    const filteredBookmarks = apiBookmarks.filter(
      (node) => !["0", "1", "2"].includes(node.id)
    );

    // Step 3: Check if there are existing user bookmarks
    if (existingUrls.size === 0) {
      // Create a map of all nodes for easy lookup
      const nodeMap = new Map<string, BookmarkNode>();
      filteredBookmarks.forEach((node: BookmarkNode) => {
        nodeMap.set(node.id, node);
      }); // Create a mapping between API folder IDs and Chrome folder IDs
      const folderMapping = new Map<string, string>();

      // Map the root folders - API uses "1" and "2" as parentId for top-level items
      folderMapping.set("1", "1"); // Bookmarks bar
      folderMapping.set("2", "2"); // Other bookmarks

      // Sort ALL items by dateAdded for pure chronological order
      const allItems = [...filteredBookmarks].sort((a, b) => {
        const aDate = a.dateAdded || 0;
        const bDate = b.dateAdded || 0;
        return aDate - bDate;
      });

      // Process items in chronological order with dependency resolution
      const processedItems = new Set<string>();

      // Helper function to ensure parent folder exists
      const ensureParentExists = async (
        item: BookmarkNode
      ): Promise<boolean> => {
        const parentId = item.parentId;

        // If parent is a root folder (1 or 2), it always exists
        if (!parentId || parentId === "1" || parentId === "2") {
          return true;
        }

        // If parent folder already exists in our mapping, we're good
        if (folderMapping.has(parentId)) {
          return true;
        }

        // Find the parent folder in our API data
        const parentFolder = nodeMap.get(parentId);
        if (!parentFolder || parentFolder.type !== "folder") {
          // Parent doesn't exist or isn't a folder, default to root
          return true;
        }

        // If parent hasn't been processed yet, we need to create it first
        if (!processedItems.has(parentId)) {
          // Recursively ensure the parent's parent exists
          const parentCanBeCreated = await ensureParentExists(parentFolder);
          if (!parentCanBeCreated) {
            return false;
          }

          // Create the parent folder
          try {
            const grandparentChromeId =
              folderMapping.get(parentFolder.parentId || "1") || "1";

            const chromeFolder = await chrome.bookmarks.create({
              parentId: grandparentChromeId,
              title: parentFolder.title || "Unnamed Folder",
            });

            folderMapping.set(parentFolder.id, chromeFolder.id);
            processedItems.add(parentFolder.id);

            return true;
          } catch (error) {
            console.error(
              `❌ Failed to create parent folder: ${parentFolder.title}`,
              error
            );
            return false;
          }
        }

        return true;
      };

      // Process items in chronological order
      for (const item of allItems) {
        try {
          // Ensure parent folder exists before creating this item
          const canCreate = await ensureParentExists(item);
          if (!canCreate) {
            console.warn(
              `⚠️ Skipping item due to missing parent: ${item.title}`
            );
            continue;
          }

          const parentChromeId = folderMapping.get(item.parentId || "1") || "1";

          if (item.type === "folder") {
            // Create folder
            const chromeFolder = await chrome.bookmarks.create({
              parentId: parentChromeId,
              title: item.title || "Unnamed Folder",
            });

            folderMapping.set(item.id, chromeFolder.id);
            processedItems.add(item.id);
          } else if (item.type === "bookmark" && item.url) {
            // Create bookmark
            await chrome.bookmarks.create({
              parentId: parentChromeId,
              title: item.title || getDefaultTitle(item.url),
              url: item.url,
            });

            processedItems.add(item.id);
          }
        } catch (error) {
          console.error(`❌ Failed to create item: ${item.title}`, error);
        }
      }
    } else {
      // Step 4: Compare and add only non-duplicate bookmarks
      const bookmarksToAdd = filteredBookmarks.filter((apiBookmark) => {
        if (apiBookmark.type !== "bookmark" || !apiBookmark.url) {
          return false; // Skip folders for now, we'll handle them separately
        }

        // Check if URL already exists
        const isDuplicate = existingUrls.has(apiBookmark.url);
        if (isDuplicate) {
          return false;
        }

        return true;
      });

      const sortedBookmarksToAdd = [...bookmarksToAdd].sort((a, b) => {
        const aDate = a.dateAdded || 0;
        const bDate = b.dateAdded || 0;
        return aDate - bDate;
      });

      for (const bookmark of sortedBookmarksToAdd) {
        try {
          await chrome.bookmarks.create({
            parentId: "1", // Add to Bookmarks bar by default
            title: bookmark.title || getDefaultTitle(bookmark.url || ""),
            url: bookmark.url,
          });
        } catch (error) {
          console.error(
            `❌ Failed to create bookmark: ${bookmark.title}`,
            error
          );
        }
      }
    }

    // Step 5: Sync all current bookmarks back to API
    await syncBookmarksToApi();
  } catch (error) {
    console.error("❌ Error during first sync:", error);
  }
};

// Helper function to delete all user bookmarks from Chrome
const deleteAllChromeBookmarks = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error fetching bookmarks for deletion:",
          chrome.runtime.lastError.message
        );
        resolve();
        return;
      }

      const bookmarksToDelete: string[] = [];

      function collectBookmarks(
        nodes: chrome.bookmarks.BookmarkTreeNode[]
      ): void {
        for (const node of nodes) {
          // Skip the default system folders (0, 1, 2) but traverse their children
          if (["0", "1", "2"].includes(node.id)) {
            if (node.children) {
              collectBookmarks(node.children);
            }
            continue;
          }

          // Collect this bookmark/folder for deletion
          bookmarksToDelete.push(node.id);

          // Don't traverse children since deleting parent will delete children
        }
      }

      collectBookmarks(bookmarkTreeNodes);

      // Delete all bookmarks/folders
      for (const bookmarkId of bookmarksToDelete) {
        try {
          await chrome.bookmarks.removeTree(bookmarkId);
        } catch (error) {
          console.error(
            `❌ Failed to delete bookmark/folder ${bookmarkId}:`,
            error
          );
        }
      }
      resolve();
    });
  });
};

// Full sync: Delete all bookmarks and reimport from API
export const fullSync = async (): Promise<void> => {
  try {
    // Step 1: Delete all existing bookmarks
    await deleteAllChromeBookmarks();

    // Step 2: Get bookmarks from API
    const token = await getAuthToken();
    if (!token) {
      console.error("❌ No auth token found");
      return;
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: { bookmarks: BookmarkNode[] } = await response.json();
    const apiBookmarks: BookmarkNode[] = result.bookmarks || [];

    // Filter out system folders (0, 1, 2) from API response
    const filteredBookmarks = apiBookmarks.filter(
      (node) => !["0", "1", "2"].includes(node.id)
    );

    if (filteredBookmarks.length === 0) {
      return;
    }

    // Step 3: Create a map of all nodes for easy lookup
    const nodeMap = new Map<string, BookmarkNode>();
    filteredBookmarks.forEach((node: BookmarkNode) => {
      nodeMap.set(node.id, node);
    }); // Step 4: Create a mapping between API folder IDs and Chrome folder IDs
    const folderMapping = new Map<string, string>();

    // Map the root folders - API uses "1" and "2" as parentId for top-level items
    folderMapping.set("1", "1"); // Bookmarks bar
    folderMapping.set("2", "2"); // Other bookmarks

    // Step 5: Sort ALL items by dateAdded for pure chronological order
    const allItems = [...filteredBookmarks].sort((a, b) => {
      const aDate = a.dateAdded || 0;
      const bDate = b.dateAdded || 0;
      return aDate - bDate;
    }); // Step 6: Process items in chronological order with dependency resolution
    const processedItems = new Set<string>();

    // Helper function to ensure parent folder exists
    const ensureParentExists = async (item: BookmarkNode): Promise<boolean> => {
      const parentId = item.parentId;

      // If parent is a root folder (1 or 2), it always exists
      if (!parentId || parentId === "1" || parentId === "2") {
        return true;
      }

      // If parent folder already exists in our mapping, we're good
      if (folderMapping.has(parentId)) {
        return true;
      }

      // Find the parent folder in our API data
      const parentFolder = nodeMap.get(parentId);
      if (!parentFolder || parentFolder.type !== "folder") {
        // Parent doesn't exist or isn't a folder, default to root
        return true;
      }

      // If parent hasn't been processed yet, we need to create it first
      if (!processedItems.has(parentId)) {
        // Recursively ensure the parent's parent exists
        const parentCanBeCreated = await ensureParentExists(parentFolder);
        if (!parentCanBeCreated) {
          return false;
        }

        // Create the parent folder
        try {
          const grandparentChromeId =
            folderMapping.get(parentFolder.parentId || "1") || "1";

          const chromeFolder = await chrome.bookmarks.create({
            parentId: grandparentChromeId,
            title: parentFolder.title || "Unnamed Folder",
          });

          folderMapping.set(parentFolder.id, chromeFolder.id);
          processedItems.add(parentFolder.id);

          return true;
        } catch (error) {
          console.error(
            `❌ Failed to create parent folder: ${parentFolder.title}`,
            error
          );
          return false;
        }
      }

      return true;
    };

    // Process items in chronological order
    for (const item of allItems) {
      try {
        // Ensure parent folder exists before creating this item
        const canCreate = await ensureParentExists(item);
        if (!canCreate) {
          continue;
        }

        const parentChromeId = folderMapping.get(item.parentId || "1") || "1";

        if (item.type === "folder") {
          // Create folder
          const chromeFolder = await chrome.bookmarks.create({
            parentId: parentChromeId,
            title: item.title || "Unnamed Folder",
          });

          folderMapping.set(item.id, chromeFolder.id);
          processedItems.add(item.id);
        } else if (item.type === "bookmark" && item.url) {
          // Create bookmark
          await chrome.bookmarks.create({
            parentId: parentChromeId,
            title: item.title || getDefaultTitle(item.url),
            url: item.url,
          });

          processedItems.add(item.id);
        }
      } catch (error) {
        console.error(`❌ Failed to create item: ${item.title}`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error during full sync:", error);
  }
};
