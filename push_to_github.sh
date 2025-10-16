#!/bin/bash

echo "🚀 Pushing Omran's Fruits App to GitHub as 'finalProject'"
echo "=================================================="
echo ""

# Copy README
echo "📄 Preparing README..."
cp /app/README_GITHUB.md /app/README.md

# Initialize git
echo "🔧 Initializing Git..."
cd /app
git init

# Add all files
echo "📦 Adding files..."
git add backend/server.py backend/requirements.txt backend/.env.example
git add frontend/src frontend/package.json frontend/.env.example
git add README.md .gitignore
git add GITHUB_PUSH_GUIDE.md

# Commit
echo "💾 Creating commit..."
git commit -m "Initial commit - Omran's Fruits & Vegetables Business Management App

Features:
- Product management (add/edit/delete)
- Multi-item receipt creation
- Sales tracking
- Expense management
- Profit/loss reports (daily/weekly/monthly)
- Inventory management with low stock alerts
- Print receipts
- Error handling and validation"

echo ""
echo "✅ Local repository ready!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Create repository on GitHub: https://github.com/new"
echo "2. Name it: finalProject"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/finalProject.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "Replace YOUR_USERNAME with your actual GitHub username"
echo ""
echo "=================================================="

