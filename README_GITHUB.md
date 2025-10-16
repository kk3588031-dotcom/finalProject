# 🍎 Omran's Fruits & Vegetables

A complete business management application for fruits and vegetables inventory, sales, expenses, and profit/loss tracking.

![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 📦 **Product Management** - Add, edit, delete fruits & vegetables with pricing
- 💰 **Sales Tracking** - Quick single-item sales
- 🧾 **Multi-Item Receipts** - Create receipts with multiple products (banana + apple + peach)
- 📊 **Inventory Management** - Track stock with low stock alerts
- 💸 **Expense Tracking** - Monitor business expenses
- 📈 **Profit & Loss Reports** - Daily, weekly, monthly financial summaries
- 🔄 **Reset Data** - Clear all data functionality
- 🛡️ **Error Handling** - User-friendly validation and error messages
- 🖨️ **Print Receipts** - Professional receipt printing

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python 3.8+)
- **Frontend:** React.js 18
- **Database:** MongoDB
- **UI Components:** Shadcn UI, Tailwind CSS
- **Icons:** Lucide React

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- MongoDB 4.4 or higher
- npm or yarn

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/finalProject.git
cd finalProject
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URL
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your backend URL
```

### 4. Start MongoDB

```bash
# Make sure MongoDB is running
mongod
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Open:** `http://localhost:3000`

## 📖 Usage

### Creating Multi-Item Receipts

1. Go to **Receipts** page
2. Click **"New Receipt"**
3. Add items to cart:
   - Select product (e.g., Banana)
   - Enter quantity (e.g., 2 kg)
   - Click **"+"** button
4. Repeat for more items
5. See automatic total calculation
6. Click **"Save Receipt"**
7. View or print receipt

### Managing Products

1. Navigate to **Products** page
2. Click **"Add Product"**
3. Fill in:
   - Product name
   - Category (Fruit/Vegetable)
   - Cost price
   - Selling price
   - Quantity & unit
4. Profit margin calculated automatically

### Viewing Reports

1. Open **Reports** page
2. Select period: Daily / Weekly / Monthly
3. View:
   - Total revenue
   - Gross profit
   - Expenses
   - Net profit/loss

## 🔧 Configuration

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=omrans_fruits_db
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📁 Project Structure

```
finalProject/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment template
│   └── .env                  # Your configuration (not in git)
│
├── frontend/
│   ├── package.json          # Node dependencies
│   ├── .env.example         # Environment template
│   ├── .env                 # Your configuration (not in git)
│   └── src/
│       ├── App.js           # Main React component
│       ├── App.css          # Global styles
│       ├── index.js         # Entry point
│       ├── components/
│       │   └── ErrorBoundary.js
│       └── pages/
│           ├── Dashboard.js
│           ├── Products.js
│           ├── Sales.js
│           ├── CreateReceipt.js
│           ├── Expenses.js
│           └── Reports.js
│
├── .gitignore
└── README.md
```

## 🔗 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Record sale
- `GET /api/sales/summary?period={daily|weekly|monthly}` - Sales summary

### Receipts
- `GET /api/receipts` - Get all receipts
- `POST /api/receipts/create` - Create multi-item receipt
- `GET /api/receipts/{id}` - Get specific receipt
- `GET /api/receipts/summary/totals` - Receipt totals

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add expense
- `DELETE /api/expenses/{id}` - Delete expense

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Reset
- `DELETE /api/reset-all-data` - Reset all data (caution!)

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running: `mongod`
- Check if port 8001 is available
- Check backend logs for errors

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available
- Check `.env` file has correct backend URL

### Database connection error
- Verify MongoDB is running
- Check `MONGO_URL` in backend `.env`

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Omran**

## 🙏 Acknowledgments

- FastAPI for the amazing Python framework
- React community for excellent tools
- Shadcn UI for beautiful components
- Lucide React for icons

## 📞 Support

If you have questions or need help:
- Open an issue in this repository
- Check the documentation

---

Made with ❤️ for Omran's Fruits & Vegetables Business

🍎 🥕 🍌 🍊 🍇 🥬
