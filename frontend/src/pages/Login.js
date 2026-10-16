import { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Simple in-frontend authentication
    if (username === "admin" && password === "admin123") {
      const user = { username: "admin", role: "admin" };
      window.localStorage.setItem("currentUser", JSON.stringify(user));
      onLogin(user);
    } else if (username === "staff" && password === "staff123") {
      const user = { username: "staff", role: "staff" };
      window.localStorage.setItem("currentUser", JSON.stringify(user));
      onLogin(user);
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Omran&apos;s Fruits &amp; Vegetables
        </h1>
        <p className="text-center text-gray-500 mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="admin or staff"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-400 text-center space-y-1">
          <p>
            <span className="font-semibold text-gray-500">Admin</span> - user:
            <span className="font-mono"> admin</span>, password:
            <span className="font-mono"> admin123</span>
          </p>
          <p>
            <span className="font-semibold text-gray-500">Staff</span> - user:
            <span className="font-mono"> staff</span>, password:
            <span className="font-mono"> staff123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;


