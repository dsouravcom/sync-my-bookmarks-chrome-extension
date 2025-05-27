import { useState } from "react";
import { sendLoginCode, verifyCode } from "../auth";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");

    const result = await sendLoginCode(email);

    console.log("Login result:", result);

    if (result.success) {
      setStep("code");
      setMessage("Check your email for the verification code");

      // Open verification tab
      chrome.tabs.create({
        url:
          chrome.runtime.getURL("verify.html") +
          `?email=${encodeURIComponent(email)}`,
      });
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setMessage("");

    const result = await verifyCode(email, code);

    if (result.success && result.token) {
      onLoginSuccess();
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-w-[320px] max-w-[400px] p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[440px] flex flex-col justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔖</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Welcome!</h1>
          <p className="text-sm text-gray-600 mt-1">
            {step === "email"
              ? "Sign in to sync your bookmarks"
              : "Enter the code sent to your email"}
          </p>
        </div>

        {/* Email Step */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📧 Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "🔄 Sending..." : "🚀 Send Verification Code"}
            </button>
          </form>
        )}

        {/* Code Step */}
        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔐 Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                maxLength={6}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "🔄 Verifying..." : "✅ Verify & Login"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ← Back to Email
              </button>
            </div>
          </form>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("Check your email")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            🔒 Secure login • No password required
          </p>
        </div>
      </div>
    </div>
  );
}
