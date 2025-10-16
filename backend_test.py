import requests
import sys
import json
from datetime import datetime

class FruitsVegetablesAPITester:
    def __init__(self, base_url="https://fresh-harvest-app-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_products = []
        self.created_sales = []
        self.created_expenses = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            required_fields = ['total_products', 'low_stock_count', 'today_revenue', 'today_profit']
            for field in required_fields:
                if field not in response:
                    print(f"⚠️  Missing field in dashboard stats: {field}")
                    return False
        return success

    def test_create_product(self, name, category, cost_price, selling_price, quantity, unit):
        """Create a product"""
        product_data = {
            "name": name,
            "category": category,
            "cost_price": cost_price,
            "selling_price": selling_price,
            "quantity": quantity,
            "unit": unit
        }
        
        success, response = self.run_test(
            f"Create Product - {name}",
            "POST",
            "products",
            200,
            data=product_data
        )
        
        if success and 'id' in response:
            self.created_products.append(response['id'])
            return response['id']
        return None

    def test_get_products(self):
        """Get all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        return success, response

    def test_update_product(self, product_id, update_data):
        """Update a product"""
        success, response = self.run_test(
            f"Update Product - {product_id}",
            "PUT",
            f"products/{product_id}",
            200,
            data=update_data
        )
        return success

    def test_delete_product(self, product_id):
        """Delete a product"""
        success, response = self.run_test(
            f"Delete Product - {product_id}",
            "DELETE",
            f"products/{product_id}",
            200
        )
        return success

    def test_create_sale(self, product_id, quantity):
        """Create a sale"""
        sale_data = {
            "product_id": product_id,
            "quantity": quantity
        }
        
        success, response = self.run_test(
            f"Create Sale - Product {product_id}",
            "POST",
            "sales",
            200,
            data=sale_data
        )
        
        if success and 'id' in response:
            self.created_sales.append(response['id'])
            return response['id']
        return None

    def test_get_sales(self):
        """Get all sales"""
        success, response = self.run_test(
            "Get All Sales",
            "GET",
            "sales",
            200
        )
        return success, response

    def test_sales_summary(self, period="daily"):
        """Test sales summary"""
        success, response = self.run_test(
            f"Sales Summary - {period}",
            "GET",
            f"sales/summary?period={period}",
            200
        )
        
        if success:
            required_fields = ['total_revenue', 'total_profit', 'total_expenses', 'net_profit', 'total_sales_count']
            for field in required_fields:
                if field not in response:
                    print(f"⚠️  Missing field in sales summary: {field}")
                    return False
        return success

    def test_create_expense(self, description, amount):
        """Create an expense"""
        expense_data = {
            "description": description,
            "amount": amount
        }
        
        success, response = self.run_test(
            f"Create Expense - {description}",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if success and 'id' in response:
            self.created_expenses.append(response['id'])
            return response['id']
        return None

    def test_get_expenses(self):
        """Get all expenses"""
        success, response = self.run_test(
            "Get All Expenses",
            "GET",
            "expenses",
            200
        )
        return success, response

    def test_delete_expense(self, expense_id):
        """Delete an expense"""
        success, response = self.run_test(
            f"Delete Expense - {expense_id}",
            "DELETE",
            f"expenses/{expense_id}",
            200
        )
        return success

    def test_low_stock_scenario(self):
        """Test low stock alert functionality"""
        print("\n🔍 Testing Low Stock Scenario...")
        
        # Create a product with low stock (< 5)
        low_stock_product_id = self.test_create_product(
            "Low Stock Apple", "fruit", 1.0, 2.0, 3, "kg"
        )
        
        if not low_stock_product_id:
            print("❌ Failed to create low stock product")
            return False
        
        # Check dashboard stats for low stock count
        success, dashboard_data = self.run_test(
            "Dashboard Stats - Low Stock Check",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            low_stock_count = dashboard_data.get('low_stock_count', 0)
            low_stock_products = dashboard_data.get('low_stock_products', [])
            
            if low_stock_count > 0:
                print(f"✅ Low stock alert working - {low_stock_count} products with low stock")
                return True
            else:
                print("⚠️  Low stock alert may not be working properly")
                return False
        
        return False

    def test_inventory_reduction_on_sale(self):
        """Test that sales reduce product inventory"""
        print("\n🔍 Testing Inventory Reduction on Sale...")
        
        # Create a product with sufficient stock
        product_id = self.test_create_product(
            "Test Banana", "fruit", 0.5, 1.0, 10, "kg"
        )
        
        if not product_id:
            print("❌ Failed to create test product")
            return False
        
        # Get initial quantity
        success, products = self.test_get_products()
        if not success:
            print("❌ Failed to get products")
            return False
        
        initial_product = next((p for p in products if p['id'] == product_id), None)
        if not initial_product:
            print("❌ Could not find created product")
            return False
        
        initial_quantity = initial_product['quantity']
        print(f"   Initial quantity: {initial_quantity}")
        
        # Make a sale
        sale_quantity = 3
        sale_id = self.test_create_sale(product_id, sale_quantity)
        
        if not sale_id:
            print("❌ Failed to create sale")
            return False
        
        # Check updated quantity
        success, products = self.test_get_products()
        if not success:
            print("❌ Failed to get updated products")
            return False
        
        updated_product = next((p for p in products if p['id'] == product_id), None)
        if not updated_product:
            print("❌ Could not find product after sale")
            return False
        
        updated_quantity = updated_product['quantity']
        expected_quantity = initial_quantity - sale_quantity
        
        print(f"   Updated quantity: {updated_quantity}")
        print(f"   Expected quantity: {expected_quantity}")
        
        if updated_quantity == expected_quantity:
            print("✅ Inventory reduction working correctly")
            return True
        else:
            print("❌ Inventory reduction not working properly")
            return False

def main():
    print("🚀 Starting Omran's Fruits & Vegetables API Testing...")
    print("=" * 60)
    
    tester = FruitsVegetablesAPITester()
    
    # Test dashboard stats (initial state)
    print("\n📊 TESTING DASHBOARD FUNCTIONALITY")
    tester.test_dashboard_stats()
    
    # Test product management
    print("\n🥕 TESTING PRODUCT MANAGEMENT")
    
    # Create test products
    apple_id = tester.test_create_product("Red Apple", "fruit", 1.0, 2.5, 20, "kg")
    carrot_id = tester.test_create_product("Fresh Carrot", "vegetable", 0.8, 1.5, 15, "kg")
    banana_id = tester.test_create_product("Yellow Banana", "fruit", 0.5, 1.2, 25, "kg")
    
    # Get all products
    tester.test_get_products()
    
    # Update a product
    if apple_id:
        tester.test_update_product(apple_id, {"selling_price": 3.0, "quantity": 18})
    
    # Test sales functionality
    print("\n💰 TESTING SALES FUNCTIONALITY")
    
    if apple_id:
        tester.test_create_sale(apple_id, 2)
    if carrot_id:
        tester.test_create_sale(carrot_id, 1.5)
    
    # Get all sales
    tester.test_get_sales()
    
    # Test sales summaries
    for period in ["daily", "weekly", "monthly"]:
        tester.test_sales_summary(period)
    
    # Test expenses functionality
    print("\n💸 TESTING EXPENSES FUNCTIONALITY")
    
    rent_id = tester.test_create_expense("Shop Rent", 500.0)
    transport_id = tester.test_create_expense("Transport Cost", 50.0)
    utilities_id = tester.test_create_expense("Electricity Bill", 75.0)
    
    # Get all expenses
    tester.test_get_expenses()
    
    # Test special scenarios
    print("\n🔍 TESTING SPECIAL SCENARIOS")
    
    # Test low stock functionality
    tester.test_low_stock_scenario()
    
    # Test inventory reduction on sales
    tester.test_inventory_reduction_on_sale()
    
    # Test error scenarios
    print("\n⚠️  TESTING ERROR SCENARIOS")
    
    # Try to create sale with insufficient stock
    if banana_id:
        print("\n🔍 Testing Insufficient Stock Error...")
        success, response = tester.run_test(
            "Sale with Insufficient Stock",
            "POST",
            "sales",
            400,  # Expecting error
            data={"product_id": banana_id, "quantity": 1000}
        )
    
    # Try to get non-existent product
    tester.run_test(
        "Get Non-existent Product",
        "GET",
        "products/non-existent-id",
        404
    )
    
    # Clean up - delete some test data
    print("\n🧹 CLEANING UP TEST DATA")
    
    # Delete an expense
    if rent_id:
        tester.test_delete_expense(rent_id)
    
    # Delete a product
    if banana_id:
        tester.test_delete_product(banana_id)
    
    # Final dashboard check
    print("\n📊 FINAL DASHBOARD CHECK")
    tester.test_dashboard_stats()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 TESTING COMPLETE")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())