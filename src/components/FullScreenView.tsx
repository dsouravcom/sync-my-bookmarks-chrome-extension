import { useState } from "react";
import type { User } from "../auth";
import type { BookmarkNode } from "../types";
import BookmarkCard from "./BookmarkCard";

import Logo from "../../public/logo-48.svg";

function FolderSection({
  node,
  level = 0,
}: {
  node: BookmarkNode;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  if (!node.children) return null;
  const folderColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
  ];

  const folderColor = folderColors[level % folderColors.length];
  const bookmarksCount = node.children.filter((child) => child.url).length;
  const foldersCount = node.children.filter((child) => child.children).length;
  return (
    <div className={`mb-6 ${level > 0 ? "ml-3" : ""}`}>
      <div
        className={`${folderColor} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 rounded-md p-1.5">
              <span className="text-lg">📁</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {node.title}
              </h2>
              <p className="text-white/80 text-xs">
                📄 {bookmarksCount} bookmarks{" "}
                {foldersCount > 0 && `• 📂 ${foldersCount} folders`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 rounded-full px-2 py-1">
              <span className="text-white text-xs font-medium">
                {bookmarksCount + foldersCount}
              </span>
            </div>
            <span className="text-white text-sm">
              {isExpanded ? "🔽" : "▶️"}
            </span>
          </div>
        </div>
      </div>{" "}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Render bookmarks first */}
          {node.children.filter((child) => child.url).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {node.children
                .filter((child) => child.url)
                .map((child) => (
                  <BookmarkCard key={child.id} bookmark={child} />
                ))}
            </div>
          )}

          {/* Render subfolders */}
          {node.children
            .filter((child) => child.children)
            .map((child) => (
              <FolderSection key={child.id} node={child} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FullScreenView({
  bookmarks,
  user,
}: {
  bookmarks: BookmarkNode[];
  user: User | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const openProfile = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("profile.html"),
    });
  };

  // Log user information for debugging
  console.log("user", user);

  // Function to recursively search through bookmarks and folders
  const searchBookmarks = (
    nodes: BookmarkNode[],
    term: string
  ): BookmarkNode[] => {
    return nodes
      .map((node) => {
        if (node.children) {
          // For folders, filter children and keep folder if it has matching children
          const filteredChildren = searchBookmarks(node.children, term);
          const hasMatchingChildren = filteredChildren.some(
            (child) =>
              child.url || (child.children && child.children.length > 0)
          );

          if (
            hasMatchingChildren ||
            node.title.toLowerCase().includes(term.toLowerCase())
          ) {
            return { ...node, children: filteredChildren };
          }
          return null;
        } else if (node.url) {
          // For bookmarks, check title and URL
          if (
            node.title.toLowerCase().includes(term.toLowerCase()) ||
            node.url.toLowerCase().includes(term.toLowerCase())
          ) {
            return node;
          }
        }
        return null;
      })
      .filter((node): node is BookmarkNode => node !== null);
  };

  const filteredBookmarks = searchTerm
    ? searchBookmarks(bookmarks, searchTerm)
    : bookmarks;

  const totalBookmarks = bookmarks.reduce((count, node) => {
    const countBookmarks = (n: BookmarkNode): number => {
      let total = n.url ? 1 : 0;
      if (n.children) {
        total += n.children.reduce(
          (sum, child) => sum + countBookmarks(child),
          0
        );
      }
      return total;
    };
    return count + countBookmarks(node);
  }, 0);

  const filteredCount = filteredBookmarks.reduce((count, node) => {
    const countBookmarks = (n: BookmarkNode): number => {
      let total = n.url ? 1 : 0;
      if (n.children) {
        total += n.children.reduce(
          (sum, child) => sum + countBookmarks(child),
          0
        );
      }
      return total;
    };
    return count + countBookmarks(node);
  }, 0);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <img src={Logo} alt="logo" className="size-8 mt-1" />
                Sync My Bookmarks
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                📚 Organize and access your {totalBookmarks} bookmarks
                efficiently
              </p>
            </div>{" "}
            <div className="flex items-center space-x-3">
              {user && (
                <button
                  onClick={openProfile}
                  className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-2"
                  title={`Profile - ${user.email}`}
                >
                  <span className="text-sm">👤</span>
                  <span className="text-sm font-medium text-gray-700">
                    {user.email.split("@")[0]}
                  </span>
                </button>
              )}
              <div className="bg-blue-500 rounded-lg px-3 py-1.5">
                <span className="text-white text-sm font-medium">
                  📊 {totalBookmarks} Total
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative ">
              <input
                type="text"
                placeholder="🔍 Search bookmarks and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-gray-50"
              />
            </div>
            {searchTerm && (
              <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                <span>📊 {filteredCount} matching bookmarks</span>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                >
                  ✖️ Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-6 shadow-sm max-w-sm mx-auto">
              <div className="text-4xl mb-3">{searchTerm ? "🔍" : "📭"}</div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                {searchTerm ? "No matches found" : "No bookmarks found"}
              </h3>
              <p className="text-gray-600 text-sm">
                {searchTerm
                  ? "Try different search terms or clear the search"
                  : "Start bookmarking your favorite websites to see them here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookmarks.map((root) => (
              <FolderSection key={root.id} node={root} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
