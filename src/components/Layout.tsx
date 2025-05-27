import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../public/logo-48.svg";
import { AuthService, type User } from "../auth";

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

function Layout({ children, user }: LayoutProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await AuthService.logout();
    setIsDropdownOpen(false);
    // Reload the page to reset auth state
    window.location.reload();
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {" "}
              {/* Logo */}
              <Link to="/">
                <div className="flex-shrink-0 flex items-center">
                  <img className="h-8 w-8" src={Logo} alt="Sync My Bookmarks" />
                  <span className="ml-2 text-lg font-semibold text-gray-900">
                    Sync My Bookmarks
                  </span>
                </div>
              </Link>
            </div>

            {/* User Info with Dropdown */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
                  >
                    <div className="hidden md:block text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-500">✅ Verified</div>
                    </div>{" "}
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <button
                        onClick={handleProfileClick}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <span className="flex items-center space-x-2">
                          <span>👤</span>
                          <span>Profile Settings</span>
                        </span>
                      </button>
                      <hr className="border-gray-200 my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <span className="flex items-center space-x-2">
                          <span> ⏻ </span>
                          <span>Sign Out</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Not logged in</span>
                  <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">?</span>
                  </div>
                </div>
              )}
            </div>
          </div>{" "}
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={handleProfileClick}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Profile Settings</span>
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <span className="flex items-center space-x-2">
                  <span>🚪</span>
                  <span>Sign Out</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

export default Layout;
