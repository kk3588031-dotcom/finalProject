# 🍎 Omran's Fruits & Vegetables

A complete business management application for tracking fruits and vegetables inventory, sales, expenses, and profit/loss.

![Dashboard](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 📦 **Product Management** - Add, edit, and delete fruits & vegetables with cost and selling prices
- 💰 **Sales Tracking** - Record sales and automatically update inventory
- 📊 **Inventory Management** - Track stock quantities with low stock alerts
- 💸 **Expense Tracking** - Monitor business expenses
- 📈 **Profit & Loss Reports** - View daily, weekly, and monthly financial summaries
- 🔄 **Reset Data** - Clear all data when needed

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **Database**: MongoDB
- **UI Components**: Shadcn UI, Tailwind CSS
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.8 or higher
- Node.js 16 or higher
- MongoDB 4.4 or higher
- npm or yarn

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/omrans-fruits-app.git
cd omrans-fruits-app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=omrans_fruits_db
CORS_ORIGINS=*
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 5. Start Backend Server

```bash
# From the backend directory
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`

### 6. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install
```

### 7. Configure Frontend Environment

Create a `.env` file in the `frontend` folder:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 8. Start Frontend

```bash
npm start
```

Frontend will open automatically at: `http://localhost:3000`

## 📖 Usage

### Adding Products
1. Navigate to the **Products** page
2. Click "Add Product"
3. Fill in product details (name, category, prices, quantity, unit)
4. Click "Add Product"

### Recording Sales
1. Go to the **Sales** page
2. Click "Record Sale"
3. Select product and quantity
4. Click "Record Sale"

### Tracking Expenses
1. Visit the **Expenses** page
2. Click "Add Expense"
3. Enter description and amount
4. Click "Add Expense"

### Viewing Reports
1. Open the **Reports** page
2. Select period: Daily, Weekly, or Monthly
3. View detailed profit/loss breakdown

### Resetting Data
1. Go to **Dashboard**
2. Click "Reset All Data" (top-right, red button)
3. Confirm action

## 📁 Project Structure

```
omrans-fruits-app/
├── backend/
│   ├── server.py
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── App.css
│   ├── .env
│   └── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Omran**

---

Made with ❤️ for Omran's Fruits & Vegetables Business
