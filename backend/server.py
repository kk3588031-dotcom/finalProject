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
    receipt_number: str = Field(default_factory=lambda: f"RCP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}")
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
    
    # Generate receipt number
    receipt_number = f"RCP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    sale_dict = {
        "product_id": sale_input.product_id,
        "product_name": product['name'],
        "quantity": sale_input.quantity,
        "cost_price": product['cost_price'],
        "selling_price": product['selling_price'],
        "total_amount": total_amount,
        "profit": profit,
        "receipt_number": receipt_number,
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


# Receipts Routes
@api_router.get("/receipts")
async def get_receipts():
    """Get all receipts (sales) with receipt numbers"""
    receipts = await db.receipts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for receipt in receipts:
        if isinstance(receipt.get('created_at'), str):
            receipt['created_at'] = datetime.fromisoformat(receipt['created_at'])
    return receipts

@api_router.post("/receipts/create")
async def create_multi_item_receipt(request: dict):
    """Create a receipt with multiple items"""
    items = request.get('items', [])
    
    if not items:
        raise HTTPException(status_code=400, detail="No items provided")
    
    # Generate receipt number
    receipt_number = f"RCP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Calculate totals
    total_amount = 0
    total_profit = 0
    receipt_items = []
    
    for item in items:
        # Get product to verify stock
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item['product_id']} not found")
        
        # Check stock
        if product['quantity'] < item['quantity']:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product['name']}. Available: {product['quantity']}"
            )
        
        # Calculate item total and profit
        item_total = item['quantity'] * item['selling_price']
        item_profit = (item['selling_price'] - item['cost_price']) * item['quantity']
        
        total_amount += item_total
        total_profit += item_profit
        
        # Add to receipt items
        receipt_items.append({
            "product_id": item['product_id'],
            "product_name": item['product_name'],
            "quantity": item['quantity'],
            "unit": item.get('unit', 'kg'),
            "selling_price": item['selling_price'],
            "cost_price": item['cost_price'],
            "total": item_total,
            "profit": item_profit
        })
        
        # Update product stock
        new_quantity = product['quantity'] - item['quantity']
        await db.products.update_one(
            {"id": item['product_id']},
            {"$set": {"quantity": new_quantity}}
        )
    
    # Create receipt
    receipt = {
        "id": str(uuid.uuid4()),
        "receipt_number": receipt_number,
        "items": receipt_items,
        "total_amount": round(total_amount, 2),
        "total_profit": round(total_profit, 2),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.receipts.insert_one(receipt)
    
    return {
        "message": "Receipt created successfully",
        "receipt_number": receipt_number,
        "total_amount": round(total_amount, 2),
        "total_profit": round(total_profit, 2)
    }

@api_router.get("/receipts/{receipt_id}")
async def get_receipt_by_id(receipt_id: str):
    """Get a specific receipt by ID"""
    receipt = await db.receipts.find_one({"id": receipt_id}, {"_id": 0})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    if isinstance(receipt.get('created_at'), str):
        receipt['created_at'] = datetime.fromisoformat(receipt['created_at'])
    
    return receipt

@api_router.get("/receipts/summary/totals")
async def get_receipts_summary():
    """Calculate total receipts amount"""
    all_receipts = await db.receipts.find({}, {"_id": 0}).to_list(10000)
    
    total_receipts = len(all_receipts)
    total_amount = sum(receipt.get('total_amount', 0) for receipt in all_receipts)
    total_profit = sum(receipt.get('total_profit', 0) for receipt in all_receipts)
    
    # Get today's receipts
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_iso = today.isoformat()
    
    today_receipts = await db.receipts.find(
        {"created_at": {"$gte": today_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    today_total = sum(receipt.get('total_amount', 0) for receipt in today_receipts)
    today_count = len(today_receipts)
    
    return {
        "total_receipts": total_receipts,
        "total_amount": round(total_amount, 2),
        "total_profit": round(total_profit, 2),
        "today_receipts": today_count,
        "today_total": round(today_total, 2)
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