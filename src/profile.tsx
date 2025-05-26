import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { AuthService, type User } from "./auth";
import "./index.css";

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const authData = await AuthService.getAuthData();

      if (!authData.isAuthenticated || !authData.token) {
        setMessage(
          "You are not logged in. Please login through the extension."
        );
        setLoading(false);
        return;
      }

      const result = await AuthService.getUserProfile(authData.token);

      if (result.success && result.user) {
        setUser(result.user);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage("Failed to load profile.");
      console.error("Error loading profile:", error);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setMessage("Logged out successfully! You can close this tab.");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Your Profile
                </h1>
                <p className="text-gray-600">Bookmark Manager Account</p>
              </div>
            </div>
            <button
              onClick={() => window.close()}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  👤 Account Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📧 Email Address
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🆔 User ID
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm">
                      {user.id}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📅 Member Since
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {user.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👋 Display Name
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        {user.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bookmark Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Bookmark Statistics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">---</div>
                    <div className="text-sm text-blue-700">Total Bookmarks</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">---</div>
                    <div className="text-sm text-green-700">Folders</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  📝 Bookmark sync and statistics coming soon!
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  ⚙️ Quick Actions
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      chrome.tabs.create({
                        url: chrome.runtime.getURL("fullscreen.html"),
                      })
                    }
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    🔖 Open Bookmark Manager
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>

              {/* Extension Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  ℹ️ Extension Info
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span className="font-mono">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600">🟢 Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close Tab
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProfilePage />
  </React.StrictMode>
);
