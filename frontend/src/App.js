import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import CreateReceipt from "./pages/CreateReceipt";
import Login from "./pages/Login";
import { Toaster } from "./components/ui/sonner";
import { Store, Package, ShoppingCart, Receipt, FileText, BarChart3 } from "lucide-react";

function Navigation({ user, onLogout }) {
  const location = useLocation();
  
  const allNavItems = [
    { path: "/", label: "Dashboard", icon: Store, roles: ["admin"] },
    { path: "/products", label: "Products", icon: Package, roles: ["admin"] },
    { path: "/sales", label: "Sales", icon: ShoppingCart, roles: ["admin", "staff"] },
    { path: "/receipts", label: "Receipts", icon: FileText, roles: ["admin", "staff"] },
    { path: "/expenses", label: "Expenses", icon: Receipt, roles: ["admin"] },
    { path: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  ];

  const navItems = allNavItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Store className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Omran's Fruits & Vegetables</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 capitalize">
                  {user.role}
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access denied</h2>
        <p className="text-gray-600 text-sm">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("currentUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("currentUser");
    setUser(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        {user ? (
          <>
            <Navigation user={user} onLogout={handleLogout} />
            <Routes>
              <Route
                path="/"
                element={
                  user.role === "staff" ? (
                    <Navigate to="/sales" replace />
                  ) : (
                    <ProtectedRoute user={user} allowedRoles={["admin"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  )
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute user={user} allowedRoles={["admin"]}>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute user={user} allowedRoles={["admin", "staff"]}>
                    <Sales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receipts"
                element={
                  <ProtectedRoute user={user} allowedRoles={["admin", "staff"]}>
                    <CreateReceipt />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute user={user} allowedRoles={["admin"]}>
                    <Expenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute user={user} allowedRoles={["admin"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="*" element={<Login onLogin={setUser} />} />
          </Routes>
        )}
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;