import { useState } from "react";
import type { User } from "../auth";
import type { BookmarkNode } from "../types";
import BookmarkCard from "./BookmarkCard";

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

export default function BookmarksPage({
  bookmarks,
  user,
}: {
  bookmarks: BookmarkNode[];
  user: User | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Get all bookmarks for search (flattened)
  const getAllBookmarks = (nodes: BookmarkNode[]): BookmarkNode[] => {
    return nodes.reduce((acc: BookmarkNode[], node) => {
      if (node.url) {
        acc.push(node);
      }
      if (node.children) {
        acc.push(...getAllBookmarks(node.children));
      }
      return acc;
    }, []);
  };

  const allBookmarks = getAllBookmarks(bookmarks);

  const filteredBookmarks = searchTerm
    ? allBookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bookmark.url &&
            bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const totalBookmarks = allBookmarks.length;
  const totalFolders = bookmarks.filter((node) => node.children).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Stats */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalBookmarks}
              </div>
              <div className="text-sm text-blue-800">Total Bookmarks</div>
            </div>
            <div className="bg-green-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalFolders}
              </div>
              <div className="text-sm text-green-800">Folders</div>
            </div>
            <div className="bg-purple-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user ? "✅" : "❌"}
              </div>
              <div className="text-sm text-purple-800">
                {user ? "Synced" : "Not Synced"}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <span className="text-gray-400 hover:text-gray-600">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Search Results ({filteredBookmarks.length})
            </h2>
            {filteredBookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No bookmarks found
                </h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        )}

        {/* Folder Structure */}
        {!searchTerm && (
          <div className="space-y-6">
            {bookmarks.length > 0 ? (
              bookmarks.map((node) => (
                <FolderSection key={node.id} node={node} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No bookmarks found
                </h3>
                <p className="text-gray-500">
                  Start adding bookmarks to see them here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
