// Authentication utilities and API calls
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// url to the backend API
const API_URL = "http://localhost:3000/api";

export class AuthService {
  // Send email for login
  static async sendLoginCode(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/request-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending login code:", error);
      return {
        success: false,
        message: "Failed to send code. Check if backend is running.",
      };
    }
  }

  // Verify code and get token
  static async verifyCode(
    email: string,
    code: string
  ): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error verifying code:", error);
      return {
        success: false,
        message: "Failed to verify code. Check if backend is running.",
      };
    }
  }

  // Get user profile
  static async getUserProfile(
    token: string
  ): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      const response = await fetch(`${API_URL}/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return { success: false, message: "Failed to get profile." };
    }
  }

  // Store auth data in Chrome storage
  static async storeAuthData(token: string, user: User): Promise<void> {
    await chrome.storage.local.set({
      authToken: token,
      user: user,
      isAuthenticated: true,
    });
  }
  // Update user profile
  static async updateProfile(
    token: string,
    profileData: { name?: string; avatar?: string; avatarFile?: File | null }
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const formData = new FormData();

      // Add name if provided
      if (profileData.name !== undefined) {
        formData.append("name", profileData.name);
      }

      // Add avatar file if provided
      if (profileData.avatarFile) {
        formData.append("avatar", profileData.avatarFile);
      }

      const response = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update stored user data
        await chrome.storage.local.set({
          user: data.user,
        });
        return { success: true, message: data.message, user: data.user };
      } else {
        return {
          success: false,
          message: data.message || "Failed to update profile",
        };
      }
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }
  // Delete user account
  static async deleteAccount(
    token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/user/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear all stored data
        await this.logout();
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || "Failed to delete account",
        };
      }
    } catch (error) {
      console.error("Delete account error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Get auth data from Chrome storage
  static async getAuthData(): Promise<AuthState> {
    const result = await chrome.storage.local.get([
      "authToken",
      "user",
      "isAuthenticated",
    ]);
    return {
      isAuthenticated: result.isAuthenticated || false,
      user: result.user || null,
      token: result.authToken || null,
    };
  }

  // Clear auth data
  static async logout(): Promise<void> {
    await chrome.storage.local.remove(["authToken", "user", "isAuthenticated"]);
  }
}
