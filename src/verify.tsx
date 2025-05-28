import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { verifyCode } from "./auth";
import "./index.css";

function VerifyPage() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        // Get email from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        if (emailParam) {
            setEmail(emailParam);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !email) return;

        setLoading(true);
        setMessage("");

        const result = await verifyCode(email, code);

        if (result.success && result.token && result.user) {
            // Close this tab after 2 seconds
            setTimeout(() => {
                window.close();
            }, 2000);
        } else {
            setMessage(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔖</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Verify Your Email
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Enter the 6-digit code sent to:
                        <br />
                        <strong>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔐 Verification Code
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.replace(/[^0-9]/g, ""))
                            }
                            placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                            maxLength={6}
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                    >
                        {loading ? "🔄 Verifying..." : "✅ Verify & Login"}
                    </button>
                </form>

                {/* Message */}
                {message && (
                    <div
                        className={`mt-4 p-4 rounded-lg text-sm ${
                            message.includes("successful")
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                        {message}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        🔒 Secure verification • Check your email for the code
                    </p>
                    <button
                        onClick={() => window.close()}
                        className="mt-2 text-blue-500 hover:text-blue-700 text-sm underline"
                    >
                        Close this tab
                    </button>
                </div>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <VerifyPage />
    </React.StrictMode>
);
