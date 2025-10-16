import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Reports() {
  const [period, setPeriod] = useState("daily");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sales/summary?period=${period}`);
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="reports-page">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Profit & Loss Reports</h2>
        <p className="text-gray-600 mt-1">Analyze your business performance</p>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-3 mb-8">
        {["daily", "weekly", "monthly"].map((p) => (
          <Button
            key={p}
            onClick={() => setPeriod(p)}
            data-testid={`period-${p}-btn`}
            variant={period === p ? "default" : "outline"}
            className={period === p ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900" data-testid="report-revenue">${summary?.total_revenue || 0}</p>
            <p className="text-xs text-gray-500 mt-2">{period} period</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div>
            <p className="text-sm text-gray-600 mb-2">Gross Profit</p>
            <p className="text-3xl font-bold text-emerald-600" data-testid="report-gross-profit">${summary?.total_profit || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Before expenses</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-white border-red-200">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600" data-testid="report-expenses">${summary?.total_expenses || 0}</p>
            <p className="text-xs text-gray-500 mt-2">{period} period</p>
          </div>
        </Card>

        <Card className={`p-6 border-2 ${(summary?.net_profit || 0) >= 0 ? 'bg-gradient-to-br from-emerald-100 to-white border-emerald-300' : 'bg-gradient-to-br from-red-100 to-white border-red-300'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Net Profit/Loss</p>
              <p className={`text-3xl font-bold ${(summary?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} data-testid="report-net-profit">
                ${Math.abs(summary?.net_profit || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2">After all expenses</p>
            </div>
            {(summary?.net_profit || 0) >= 0 ? (
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
          </div>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Breakdown</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Total Sales Count</span>
            <span className="font-semibold text-gray-900" data-testid="report-sales-count">{summary?.total_sales_count || 0}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <span className="text-gray-700">Revenue Generated</span>
            <span className="font-semibold text-blue-600">${summary?.total_revenue || 0}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
            <span className="text-gray-700">Gross Profit (Before Expenses)</span>
            <span className="font-semibold text-emerald-600">+${summary?.total_profit || 0}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
            <span className="text-gray-700">Business Expenses</span>
            <span className="font-semibold text-red-600">-${summary?.total_expenses || 0}</span>
          </div>

          <div className="h-px bg-gray-300 my-2"></div>

          <div className={`flex justify-between items-center p-4 rounded-lg ${(summary?.net_profit || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <span className="font-semibold text-gray-900">Net Profit/Loss</span>
            <span className={`text-xl font-bold ${(summary?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(summary?.net_profit || 0) >= 0 ? '+' : '-'}${Math.abs(summary?.net_profit || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Profit Margin */}
        {summary && summary.total_revenue > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Profit Margin</span>
              <span className="text-lg font-semibold text-gray-900">
                {((summary.net_profit / summary.total_revenue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}