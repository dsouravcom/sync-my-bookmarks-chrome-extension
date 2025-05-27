import type { User } from "./types";
import {firstSync} from "./syncer";

// Backend API base URL
const API_URL = "http://localhost:3000/api";

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Send login verification code to email
 */
export async function sendLoginCode(
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

/**
 * Verify email code and authenticate user
 */
export async function verifyCode(
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

    if (data.success && data.token) {
      // Store only the verification token
      await chrome.storage.local.set({ verificationCode: data.token });

      // Sync bookmarks to server after successful login
      firstSync();
    }

    return data;
  } catch (error) {
    console.error("Error verifying code:", error);
    return {
      success: false,
      message: "Failed to verify code. Check if backend is running.",
    };
  }
}

/**
 * Get user profile using stored token
 */
export async function getUserProfile(): Promise<{
  success: boolean;
  user?: User;
  message: string;
}> {
  try {
    const { verificationCode } = await chrome.storage.local.get(
      "verificationCode"
    );

    if (!verificationCode) {
      return {
        success: false,
        message: "No authentication token found. Please login first.",
      };
    }

    const response = await fetch(`${API_URL}/user/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${verificationCode}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return {
      success: false,
      message: "Failed to get profile.",
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(profileData: {
  name?: string;
  avatar?: string;
  avatarFile?: File | null;
}): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const { verificationCode } = await chrome.storage.local.get(
      "verificationCode"
    );

    if (!verificationCode) {
      return {
        success: false,
        message: "No authentication token found. Please login first.",
      };
    }

    const formData = new FormData();

    if (profileData.name !== undefined) {
      formData.append("name", profileData.name);
    }

    if (profileData.avatarFile) {
      formData.append("avatar", profileData.avatarFile);
    }

    const response = await fetch(`${API_URL}/user/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${verificationCode}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success) {
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

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { verificationCode } = await chrome.storage.local.get(
      "verificationCode"
    );

    if (!verificationCode) {
      return {
        success: false,
        message: "No authentication token found. Please login first.",
      };
    }

    const response = await fetch(`${API_URL}/user/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${verificationCode}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      await logout();
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

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { verificationCode } = await chrome.storage.local.get(
      "verificationCode"
    );
    return !!verificationCode;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}

/**
 * Get stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { verificationCode } = await chrome.storage.local.get(
      "verificationCode"
    );
    return verificationCode || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Logout user and clear stored data
 */
export async function logout(): Promise<void> {
  try {
    await chrome.storage.local.remove("verificationCode");
  } catch (error) {
    console.error("Error during logout:", error);
  }
}
