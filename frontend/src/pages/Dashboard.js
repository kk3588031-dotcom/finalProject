import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { TrendingUp, DollarSign, Package, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllData = async () => {
    setResetting(true);
    try {
      await axios.delete(`${API}/reset-all-data`);
      toast.success("All data has been reset successfully");
      fetchDashboardStats();
    } catch (error) {
      console.error("Error resetting data:", error);
      toast.error("Failed to reset data");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="dashboard-loading">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your business today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-200" data-testid="today-revenue-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="today-revenue">${stats?.today_revenue || 0}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200" data-testid="today-profit-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Profit</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="today-profit">${stats?.today_profit || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200" data-testid="total-products-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="total-products">{stats?.total_products || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-orange-200" data-testid="low-stock-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="low-stock-count">{stats?.low_stock_count || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Sales and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-3" data-testid="recent-sales-list">
            {stats?.recent_sales && stats.recent_sales.length > 0 ? (
              stats.recent_sales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg" data-testid={`recent-sale-${sale.id}`}>
                  <div>
                    <p className="font-medium text-gray-900">{sale.product_name}</p>
                    <p className="text-sm text-gray-600">
                      {sale.quantity} units × ${sale.selling_price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${sale.total_amount}</p>
                    <p className="text-xs text-emerald-600">+${sale.profit} profit</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No sales recorded yet</p>
            )}
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
          <div className="space-y-3" data-testid="low-stock-list">
            {stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
              stats.low_stock_products.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg" data-testid={`low-stock-${product.id}`}>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{product.quantity} {product.unit}</p>
                    <p className="text-xs text-gray-500">Restock needed</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">All products are well stocked</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}