import { useEffect, useState } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import { AuthService, type AuthState } from "./auth";
import BookmarksPage from "./components/BookmarksPage";
import Layout from "./components/Layout";
import LoginScreen from "./components/LoginScreen";
import PopupView from "./components/PopupView";
import ProfilePage from "./components/ProfilePage";
import type { BookmarkNode } from "./types";

interface AppProps {
  isFullScreen?: boolean;
}

function App({ isFullScreen = false }: AppProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await AuthService.getAuthData();
      setAuthState(auth);
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    const auth = await AuthService.getAuthData();
    setAuthState(auth);
  };

  useEffect(() => {
    // Only fetch bookmarks if user is authenticated
    if (!authState.isAuthenticated) return;

    const fetchBookmarks = async () => {
      const tree = await chrome.bookmarks.getTree();

      // For popup view, flatten the bookmarks (only get actual bookmarks, not folders)
      const flatten = (nodes: BookmarkNode[]): BookmarkNode[] =>
        nodes.flatMap((node) =>
          node.children
            ? flatten(node.children)
            : [
                {
                  ...node,
                  title:
                    node.title ||
                    (node.url ? new URL(node.url).hostname : "Untitled"),
                },
              ]
        );

      // For full screen view, preserve the folder structure
      const processTree = (nodes: BookmarkNode[]): BookmarkNode[] =>
        nodes.map((node) => ({
          ...node,
          title:
            node.title || (node.url ? new URL(node.url).hostname : "Untitled"),
          children: node.children ? processTree(node.children) : undefined,
        }));

      if (isFullScreen) {
        // Skip the root bookmark folder which is usually empty
        const processedTree = processTree(tree[0]?.children || tree);
        setBookmarks(processedTree);
      } else {
        setBookmarks(flatten(tree));
      }
    };

    fetchBookmarks();
  }, [isFullScreen, authState.isAuthenticated]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div
        className={
          isFullScreen
            ? "min-h-screen flex items-center justify-center bg-gray-50"
            : "min-w-[320px] max-w-[400px] p-4 bg-gray-50 h-[440px] flex items-center justify-center"
        }
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated and not in fullscreen mode
  if (!authState.isAuthenticated && !isFullScreen) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // For fullscreen mode, use React Router
  if (isFullScreen) {
    return (
      <Router>
        <Layout user={authState.user}>
          <Routes>
            <Route
              path="/"
              element={
                <BookmarksPage bookmarks={bookmarks} user={authState.user} />
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </Router>
    );
  }

  // For popup mode, render the popup view
  return (
    <div className="min-w-[320px] max-w-[400px] p-4 bg-gray-50">
      <PopupView bookmarks={bookmarks} user={authState.user} />
    </div>
  );
}

export default App;
