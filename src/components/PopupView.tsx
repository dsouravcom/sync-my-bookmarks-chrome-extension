import { useState } from "react";
import { fullSync } from "../syncer";
import type { BookmarkNode, User } from "../types";

import Logo from "../../public/icons/icon16.png";

export default function PopupView({
  bookmarks,
  user,
}: {
  bookmarks: BookmarkNode[];
  user: User | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const openFullScreen = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("fullscreen.html"),
    });
  };

  const openProfile = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("fullscreen.html#/profile"),
    });
  };

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bookmark.url &&
        bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "Invalid URL";
    }
  };

  const getProtocol = (url: string) => {
    try {
      return new URL(url).protocol.replace(":", "");
    } catch {
      return "http";
    }
  };
  return (
    <div className="space-y-3 bg-gray-50 h-[440px] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3 -m-4 mb-3 flex-shrink-0">
        {" "}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-1">
            <img src={Logo} alt="logo" className="mt-1" /> Bookmarks
          </h1>
          <div className="flex items-center space-x-1">
            {user && (
              <button
                onClick={openProfile}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title={`Profile - ${user.email}`}
              >
                <span className="text-sm">👤</span>
              </button>
            )}{" "}
            <button
              onClick={() => fullSync()}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center gap-1"
              title="Sync bookmarks from server"
            >
              🔄
            </button>
            <button
              onClick={openFullScreen}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              🔍 Full Screen
            </button>
          </div>
        </div>
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-gray-50"
          />
        </div>
        {/* Stats */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>📊 {filteredBookmarks.length} bookmarks</span>
          <span>⚡ Quick access</span>
        </div>
      </div>{" "}
      {/* Bookmarks List */}
      <div className="space-y-2 flex-1 overflow-y-auto px-1 min-h-0">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center h-full min-h-[240px]">
            <div className="text-3xl mb-3">📭</div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">
              {searchTerm ? "No matches found" : "No bookmarks found"}
            </h3>
            <p className="text-xs text-gray-600">
              {searchTerm
                ? "Try different search terms"
                : "Start bookmarking your favorite websites"}
            </p>
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url || "");
            const protocol = getProtocol(bookmark.url || "");

            return (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-300"
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                      className="w-4 h-4 rounded"
                      alt="favicon"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback =
                          target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="w-4 h-4 rounded bg-blue-500 items-center justify-center text-white text-xs font-bold hidden">
                      {domain.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {bookmark.title}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <span className="text-xs">
                          {protocol === "https" ? "🔒" : "🔓"}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          🚀
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 truncate">
                        {domain}
                      </span>
                      <span className="text-xs text-green-500">🟢</span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-2 -m-4 mt-3">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>🌟 Quick Access</span>
          <span>•</span>
          <span>⚡ Fast & Secure</span>
        </div>
      </div>
    </div>
  );
}
