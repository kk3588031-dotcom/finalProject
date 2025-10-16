# Omran's Fruits & Vegetables - Complete Code

This document contains all the code files for the application. Copy each section into the corresponding files in Visual Studio.

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── server.py
│   ├── .env
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js
        ├── App.css
        └── pages/
            ├── Dashboard.js
            ├── Products.js
            ├── Sales.js
            ├── Expenses.js
            └── Reports.js
```

---

## 🔧 Backend Files

### File: `backend/server.py`

```python
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # fruit or vegetable
    cost_price: float
    selling_price: float
    quantity: float
    unit: str  # kg, piece, box, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category: str
    cost_price: float
    selling_price: float
    quantity: float
    unit: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    quantity: float
    cost_price: float
    selling_price: float
    total_amount: float
    profit: float
    sale_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    product_id: str
    quantity: float
    sale_date: Optional[datetime] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    expense_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    expense_date: Optional[datetime] = None


# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product_input: ProductCreate):
    product_dict = product_input.model_dump()
    product = Product(**product_dict)
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_input: ProductUpdate):
    # Get existing product
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    update_data = product_input.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    # Return updated product
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# Sales Routes
@api_router.post("/sales", response_model=Sale)
async def create_sale(sale_input: SaleCreate):
    # Get product details
    product = await db.products.find_one({"id": sale_input.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if enough quantity available
    if product['quantity'] < sale_input.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity in stock")
    
    # Calculate sale details
    total_amount = sale_input.quantity * product['selling_price']
    profit = (product['selling_price'] - product['cost_price']) * sale_input.quantity
    
    sale_dict = {
        "product_id": sale_input.product_id,
        "product_name": product['name'],
        "quantity": sale_input.quantity,
        "cost_price": product['cost_price'],
        "selling_price": product['selling_price'],
        "total_amount": total_amount,
        "profit": profit,
        "sale_date": sale_input.sale_date or datetime.now(timezone.utc)
    }
    
    sale = Sale(**sale_dict)
    
    doc = sale.model_dump()
    doc['sale_date'] = doc['sale_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.sales.insert_one(doc)
    
    # Update product quantity
    new_quantity = product['quantity'] - sale_input.quantity
    await db.products.update_one(
        {"id": sale_input.product_id},
        {"$set": {"quantity": new_quantity}}
    )
    
    return sale

@api_router.get("/sales", response_model=List[Sale])
async def get_sales():
    sales = await db.sales.find({}, {"_id": 0}).sort("sale_date", -1).to_list(1000)
    for sale in sales:
        if isinstance(sale.get('sale_date'), str):
            sale['sale_date'] = datetime.fromisoformat(sale['sale_date'])
        if isinstance(sale.get('created_at'), str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales

@api_router.get("/sales/summary")
async def get_sales_summary(period: str = "daily"):
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    start_date_iso = start_date.isoformat()
    
    # Get sales in period
    sales = await db.sales.find(
        {"sale_date": {"$gte": start_date_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    total_revenue = sum(sale.get('total_amount', 0) for sale in sales)
    total_profit = sum(sale.get('profit', 0) for sale in sales)
    total_sales_count = len(sales)
    
    # Get expenses in period
    expenses = await db.expenses.find(
        {"expense_date": {"$gte": start_date_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    total_expenses = sum(expense.get('amount', 0) for expense in expenses)
    
    net_profit = total_profit - total_expenses
    
    return {
        "period": period,
        "total_revenue": round(total_revenue, 2),
        "total_profit": round(total_profit, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2),
        "total_sales_count": total_sales_count
    }


# Expenses Routes
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_input: ExpenseCreate):
    expense_dict = expense_input.model_dump()
    if not expense_dict.get('expense_date'):
        expense_dict['expense_date'] = datetime.now(timezone.utc)
    
    expense = Expense(**expense_dict)
    
    doc = expense.model_dump()
    doc['expense_date'] = doc['expense_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.expenses.insert_one(doc)
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).sort("expense_date", -1).to_list(1000)
    for expense in expenses:
        if isinstance(expense.get('expense_date'), str):
            expense['expense_date'] = datetime.fromisoformat(expense['expense_date'])
        if isinstance(expense.get('created_at'), str):
            expense['created_at'] = datetime.fromisoformat(expense['created_at'])
    return expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}


# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Get total products and low stock
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    total_products = len(products)
    low_stock_products = [p for p in products if p.get('quantity', 0) < 5]
    
    # Get today's sales
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_iso = today.isoformat()
    
    today_sales = await db.sales.find(
        {"sale_date": {"$gte": today_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    today_revenue = sum(sale.get('total_amount', 0) for sale in today_sales)
    today_profit = sum(sale.get('profit', 0) for sale in today_sales)
    
    # Get recent sales
    recent_sales = await db.sales.find({}, {"_id": 0}).sort("sale_date", -1).limit(5).to_list(5)
    for sale in recent_sales:
        if isinstance(sale.get('sale_date'), str):
            sale['sale_date'] = datetime.fromisoformat(sale['sale_date'])
    
    return {
        "total_products": total_products,
        "low_stock_count": len(low_stock_products),
        "low_stock_products": low_stock_products[:5],
        "today_revenue": round(today_revenue, 2),
        "today_profit": round(today_profit, 2),
        "today_sales_count": len(today_sales),
        "recent_sales": recent_sales
    }


# Reset All Data
@api_router.delete("/reset-all-data")
async def reset_all_data():
    """Delete all products, sales, and expenses - use with caution!"""
    try:
        # Delete all collections
        await db.products.delete_many({})
        await db.sales.delete_many({})
        await db.expenses.delete_many({})
        
        return {
            "message": "All data has been reset successfully",
            "products_deleted": True,
            "sales_deleted": True,
            "expenses_deleted": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting data: {str(e)}")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
```

### File: `backend/.env`

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=omrans_fruits_db
CORS_ORIGINS=*
```

### File: `backend/requirements.txt`

```
fastapi==0.110.1
uvicorn==0.25.0
python-dotenv>=1.0.1
pymongo==4.5.0
pydantic>=2.6.4
motor==3.3.1
```

---

## 🎨 Frontend Files

### File: `frontend/src/App.js`

```javascript
import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import { Toaster } from "./components/ui/sonner";
import { Store, Package, ShoppingCart, Receipt, BarChart3 } from "lucide-react";

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: Store },
    { path: "/products", label: "Products", icon: Package },
    { path: "/sales", label: "Sales", icon: ShoppingCart },
    { path: "/expenses", label: "Expenses", icon: Receipt },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Store className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Omran's Fruits & Vegetables</h1>
          </div>
          
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
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
```

### File: `frontend/src/App.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #f9fafb;
  color: #111827;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Space Grotesk', sans-serif;
}

.App {
  min-height: 100vh;
}

/* Smooth transitions for interactive elements */
button {
  transition: background-color 0.2s, transform 0.1s;
}

button:active {
  transform: scale(0.98);
}

input, select, textarea {
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

---

## 📄 Page Files

Due to length limitations, please view the following files in your current application for the complete page code:

- **Dashboard.js** (includes Reset All Data button)
- **Products.js** (add/edit/delete products)
- **Sales.js** (record sales)
- **Expenses.js** (track expenses)
- **Reports.js** (view profit/loss reports)

All files are located in `/app/frontend/src/pages/`

---

## 🚀 How to Run

### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend:
```bash
cd frontend
npm install
npm start
```

---

## ✨ New Feature: Reset All Data

A "Reset All Data" button has been added to the Dashboard page (top right corner). This button allows you to:

- Delete all products
- Delete all sales records
- Delete all expenses
- Reset revenue and profit to $0

**Important:** This action cannot be undone! A confirmation dialog will appear before deletion.

---

## 📊 Features

- ✅ Product Management (Add/Edit/Delete)
- ✅ Sales Tracking
- ✅ Inventory Management
- ✅ Expense Tracking
- ✅ Profit/Loss Calculation
- ✅ Daily/Weekly/Monthly Reports
- ✅ Low Stock Alerts
- ✅ Reset All Data Functionality

---

**Database:** MongoDB
**Backend:** FastAPI (Python)
**Frontend:** React + Shadcn UI
