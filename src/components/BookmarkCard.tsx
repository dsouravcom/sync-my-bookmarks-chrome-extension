import { useState } from "react";
import type { BookmarkNode } from "../types";

export default function BookmarkCard({ bookmark }: { bookmark: BookmarkNode }) {
  const [imageError, setImageError] = useState(false);

  if (!bookmark.url) return null;

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

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const domain = getDomain(bookmark.url);
  const protocol = getProtocol(bookmark.url);
  const faviconUrl = getFaviconUrl(bookmark.url);

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-300"
    >
      {/* Header with favicon and domain */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            {faviconUrl && !imageError ? (
              <img
                src={faviconUrl}
                className="w-5 h-5 rounded"
                alt="favicon"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {domain.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {domain}
            </p>
            <div className="flex items-center space-x-1">
              <span className="text-xs">
                {protocol === "https" ? "🔒" : "🔓"}
              </span>
              <span className="text-xs text-gray-500 uppercase">
                {protocol}
              </span>
            </div>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-gray-400 text-xs">🔗</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2 text-sm leading-tight">
        {truncateText(bookmark.title, 50)}
      </h3>

      {/* URL Preview */}
      <div className="bg-gray-50 rounded p-2 mb-2">
        <p className="text-xs text-gray-600 font-mono leading-relaxed break-all">
          {truncateText(bookmark.url, 60)}
        </p>
      </div>

      {/* Footer with additional info */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <span className="text-xs">🟢</span>
          <span className="text-xs text-gray-500">Active</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-400 group-hover:text-blue-500 transition-colors">
          <span className="text-xs">Open</span>
          <span className="text-xs">🚀</span>
        </div>
      </div>
    </a>
  );
}
