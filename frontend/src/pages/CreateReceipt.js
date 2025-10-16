import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Trash2, ShoppingCart, Save, Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CreateReceipt() {
  const [products, setProducts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchReceipts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      if (error.response) {
        // Server responded with error
        toast.error(`Error: ${error.response.data?.detail || 'Failed to load products'}`);
      } else if (error.request) {
        // Request made but no response
        toast.error("Cannot connect to server. Please check your internet connection.");
      } else {
        // Something else happened
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      const response = await axios.get(`${API}/receipts`);
      setReceipts(response.data);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) {
      toast.error("Please select a product and enter quantity");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // Check if enough stock
    if (product.quantity < parseFloat(quantity)) {
      toast.error(`Only ${product.quantity} ${product.unit} available`);
      return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.product_id === selectedProduct);
    
    if (existingIndex >= 0) {
      // Update quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity = parseFloat(quantity);
      newCart[existingIndex].total = parseFloat(quantity) * product.selling_price;
      setCart(newCart);
    } else {
      // Add new item
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: parseFloat(quantity),
        unit: product.unit,
        selling_price: product.selling_price,
        cost_price: product.cost_price,
        total: parseFloat(quantity) * product.selling_price
      }]);
    }

    setSelectedProduct("");
    setQuantity("");
    toast.success("Added to cart");
  };

  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.success("Removed from cart");
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateProfit = () => {
    return cart.reduce((sum, item) => {
      const profit = (item.selling_price - item.cost_price) * item.quantity;
      return sum + profit;
    }, 0);
  };

  const handleSaveReceipt = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Please add items first.");
      return;
    }

    try {
      // Create receipt with all items
      const response = await axios.post(`${API}/receipts/create`, {
        items: cart
      });
      
      toast.success(`Receipt created! Total: $${response.data.total_amount}`);
      setCart([]);
      setShowDialog(false);
      fetchReceipts();
      fetchProducts(); // Refresh to get updated stock
    } catch (error) {
      console.error("Error creating receipt:", error);
      if (error.response?.status === 400) {
        // Bad request - show specific error
        toast.error(error.response.data?.detail || "Invalid data. Please check your items.");
      } else if (error.response?.status === 404) {
        toast.error("Product not found. Please refresh and try again.");
      } else if (error.response) {
        toast.error(`Error: ${error.response.data?.detail || 'Failed to create receipt'}`);
      } else if (error.request) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptDialog(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="create-receipt-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Create Receipt</h2>
          <p className="text-gray-600 mt-1">Add multiple items to one receipt</p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)} 
          className="bg-emerald-600 hover:bg-emerald-700"
          data-testid="new-receipt-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Receipt
        </Button>
      </div>

      {/* Receipts List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="receipts-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.length > 0 ? (
                receipts.map((receipt) => (
                  <tr key={receipt.id} data-testid={`receipt-row-${receipt.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        {receipt.receipt_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(receipt.created_at), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {receipt.items?.length || 1} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-emerald-600">
                        ${receipt.total_amount?.toFixed(2) || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(receipt)}
                        data-testid={`view-receipt-${receipt.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No receipts yet. Create your first receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Receipt Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="create-receipt-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Receipt</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add Item Section */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold text-lg mb-4">Add Item to Cart</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Select Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger data-testid="select-product">
                      <SelectValue placeholder="Choose product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${product.selling_price}/{product.unit} (Stock: {product.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      data-testid="quantity-input"
                    />
                    <Button onClick={handleAddToCart} data-testid="add-to-cart-btn">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cart Items */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart ({cart.length} items)
              </h3>
              
              {cart.length > 0 ? (
                <Card className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cart.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-3 text-gray-700">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-gray-700">${item.selling_price.toFixed(2)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">${item.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleRemoveFromCart(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="bg-gray-50 p-4 border-t space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Profit:</span>
                      <span className="font-semibold">+${calculateProfit().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-emerald-600 pt-2 border-t">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Cart is empty. Add items above.</p>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveReceipt} 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={cart.length === 0}
              data-testid="save-receipt-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md" data-testid="view-receipt-dialog">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className="receipt-content bg-white p-6 rounded-lg border-2 border-gray-200">
              <div className="text-center mb-6 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-900">Omran's Fruits & Vegetables</h3>
                <p className="text-sm text-gray-600 mt-1">Fresh Quality Products</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Receipt #:</span>
                  <span className="font-mono font-semibold">{selectedReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {format(new Date(selectedReceipt.created_at || selectedReceipt.sale_date), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
              </div>

              <div className="border-t border-b py-4 mb-4">
                {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                  selectedReceipt.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × ${item.selling_price?.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">${item.total?.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedReceipt.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedReceipt.quantity} × ${selectedReceipt.selling_price?.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">${selectedReceipt.total_amount?.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-emerald-600">${selectedReceipt.total_amount?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Profit:</span>
                  <span className="text-emerald-600 font-semibold">
                    +${selectedReceipt.total_profit?.toFixed(2) || selectedReceipt.profit?.toFixed(2) || 0}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">Thank you for your business!</p>
                <p className="text-xs text-gray-500 mt-1">Fresh products, fresh profits</p>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-content, .receipt-content * { visibility: visible; }
          .receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
