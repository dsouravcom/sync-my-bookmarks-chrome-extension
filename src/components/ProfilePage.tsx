import React, { useEffect, useState } from "react";
import { AuthService, type User } from "../auth";

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState("");

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
        setFormData({
          name: result.user.name || "",
          email: result.user.email,
          avatar: result.user.avatar || "",
        });
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage("Failed to load profile.");
      console.error("Error loading profile:", error);
    }
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        setMessage("Please select an image file.");
        return;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("File size must be less than 5MB.");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSaveProfile = async () => {
    try {
      setUploading(true);
      const authData = await AuthService.getAuthData();
      if (!authData.token) return;

      const result = await AuthService.updateProfile(authData.token, {
        name: formData.name,
        avatarFile: selectedFile,
      });

      if (result.success && result.user) {
        setUser(result.user);
        setFormData({
          name: result.user.name || "",
          email: result.user.email,
          avatar: result.user.avatar || "",
        });
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl("");
        setMessage("Profile updated successfully!");
      } else {
        setMessage(result.message || "Failed to update profile.");
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to update profile.");
      console.error("Error updating profile:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (deleteInputValue !== "DELETE") {
      setMessage("Please type 'DELETE' to confirm account deletion.");
      return;
    }

    try {
      const authData = await AuthService.getAuthData();
      if (!authData.token) return;

      const result = await AuthService.deleteAccount(authData.token);

      if (result.success) {
        setMessage("Account deleted successfully. You have been logged out.");
        setUser(null);

        // Reload the page after a short delay
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage(result.message || "Failed to delete account.");
      }
    } catch (error) {
      setMessage("Failed to delete account.");
      console.error("Error deleting account:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="text-sm text-gray-500">
              <p>Use the browser extension to log in to your account.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your account information and preferences
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("error") || message.includes("Failed")
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-green-50 border border-green-200 text-green-800"
            }`}
          >
            <p>{message}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Profile Information
                </h2>
                <p className="text-sm text-gray-600">
                  Update your personal information
                </p>
              </div>
              <button
                onClick={() => {
                  if (isEditing) {
                    setFormData({
                      name: user.name || "",
                      email: user.email,
                      avatar: formData.avatar,
                    });
                  }
                  setIsEditing(!isEditing);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-lg transition-colors duration-200"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start space-x-6">
                {" "}
                {/* Avatar Section */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile Preview"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="mt-2">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <span className="cursor-pointer inline-block px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          Choose File
                        </span>
                      </label>
                      {selectedFile && (
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* Form Fields */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter your display name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">
                        {user.name || "No name set"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900 py-2">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900 py-2">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>{" "}
                  {isEditing && (
                    <div className="pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                      >
                        {uploading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Account Statistics
              </h2>
              <p className="text-sm text-gray-600">
                Overview of your account activity
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl text-blue-600 mb-2">📚</div>
                  <div className="text-lg font-semibold text-gray-800">
                    Bookmarks
                  </div>
                  <div className="text-sm text-gray-600">
                    Synced across devices
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl text-green-600 mb-2">🔐</div>
                  <div className="text-lg font-semibold text-gray-800">
                    Secure
                  </div>
                  <div className="text-sm text-gray-600">Account verified</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl text-purple-600 mb-2">🚀</div>
                  <div className="text-lg font-semibold text-gray-800">
                    Fast Sync
                  </div>
                  <div className="text-sm text-gray-600">Real-time updates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-900">
                Danger Zone
              </h2>
              <p className="text-sm text-red-700">
                Irreversible and destructive actions
              </p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Delete Account
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete your account and all associated data. This
                  action cannot be undone. All your bookmarks, settings, and
                  account information will be permanently removed.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-900">
                      Type "DELETE" to confirm account deletion:
                    </p>
                    <input
                      type="text"
                      value={deleteInputValue}
                      onChange={(e) => setDeleteInputValue(e.target.value)}
                      placeholder="Type DELETE here"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteInputValue !== "DELETE"}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInputValue("");
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
