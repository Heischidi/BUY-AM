"""
Migration & Seeder for Buy Am Admin Features:
- Adds 'unit', 'min_price', 'max_price' to products table
- Adds 'gender' to users table
- Seeds sample products with various measurement units (yard, kg, quantity)
- Seeds registered customers and realistic order history for analytics charts
"""
import sqlite3
import os
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "buyam.db")

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print(f"Connecting to database: {DB_PATH}")

    # 1. Products columns
    cursor.execute("PRAGMA table_info(products)")
    prod_cols = [r["name"] for r in cursor.fetchall()]

    if "unit" not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT 'quantity'")
        print("  [OK] Added 'unit' column to products")
    if "min_price" not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN min_price NUMERIC(12, 2)")
        print("  [OK] Added 'min_price' column to products")
    if "max_price" not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN max_price NUMERIC(12, 2)")
        print("  [OK] Added 'max_price' column to products")

    # 2. Users columns
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [r["name"] for r in cursor.fetchall()]

    if "gender" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN gender VARCHAR(20) DEFAULT 'Not specified'")
        print("  [OK] Added 'gender' column to users")

    conn.commit()

    # 3. Update existing products with appropriate units & min/max prices
    cursor.execute("SELECT id, name, price, is_negotiable FROM products")
    existing_prods = cursor.fetchall()
    for p in existing_prods:
        p_id, p_name, p_price, is_neg = p["id"], p["name"], float(p["price"]), p["is_negotiable"]
        unit = "quantity"
        name_lower = p_name.lower()
        if "shirt" in name_lower or "material" in name_lower or "fabric" in name_lower:
            unit = "yard"
        elif "catfish" in name_lower or "fish" in name_lower or "meat" in name_lower or "beef" in name_lower:
            unit = "kg"
        
        min_p = round(p_price * 0.8, 2) if is_neg else None
        max_p = p_price if is_neg else None

        cursor.execute(
            "UPDATE products SET unit = ?, min_price = ?, max_price = ? WHERE id = ?",
            (unit, min_p, max_p, p_id)
        )
    conn.commit()
    print("  [OK] Updated existing products with measurement units and min/max prices")

    # 4. Add materials (yards) and food (kg) products if not present
    new_products = [
        {
            "name": "Premium Ankara Wax Material",
            "slug": "premium-ankara-wax-material",
            "description": "100% pure cotton vibrant African wax print fabric, perfect for bespoke native wear, gowns, and traditional ceremonies. Sold per yard.",
            "price": 4500.0,
            "min_price": 3500.0,
            "max_price": 4500.0,
            "stock_quantity": 120,
            "unit": "yard",
            "is_negotiable": 1,
            "category_name": "Fashion",
            "image": "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=900&q=80",
        },
        {
            "name": "Senator Suit Cashmere Fabric",
            "slug": "senator-suit-cashmere-fabric",
            "description": "Luxurious soft wool-blend cashmere material for bespoke men senator suits, agbada, and corporate outfits. Sold per yard.",
            "price": 9500.0,
            "min_price": 8000.0,
            "max_price": 9500.0,
            "stock_quantity": 75,
            "unit": "yard",
            "is_negotiable": 1,
            "category_name": "Fashion",
            "image": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80",
        },
        {
            "name": "Fresh Oven-Dried Catfish",
            "slug": "fresh-oven-dried-catfish",
            "description": "Hygienically processed and smoked organic catfish from local fish farms. Sand-free and highly proteinous. Sold per kg.",
            "price": 8500.0,
            "min_price": 7000.0,
            "max_price": 8500.0,
            "stock_quantity": 50,
            "unit": "kg",
            "is_negotiable": 1,
            "category_name": "Groceries",
            "image": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=900&q=80",
        },
        {
            "name": "Boneless Prime Beef Steak",
            "slug": "boneless-prime-beef-steak",
            "description": "Freshly slaughtered, tender grass-fed beef cut. Vacuum-packed for freshness and perfect for family stews and grilling. Sold per kg.",
            "price": 6800.0,
            "min_price": 5500.0,
            "max_price": 6800.0,
            "stock_quantity": 40,
            "unit": "kg",
            "is_negotiable": 1,
            "category_name": "Groceries",
            "image": "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80",
        },
    ]

    for np in new_products:
        cursor.execute("SELECT id FROM products WHERE slug = ?", (np["slug"],))
        if not cursor.fetchone():
            cursor.execute("SELECT id FROM categories WHERE name = ?", (np["category_name"],))
            cat_row = cursor.fetchone()
            cat_id = cat_row[0] if cat_row else 1

            cursor.execute("""
                INSERT INTO products (category_id, name, slug, description, price, stock_quantity, status, featured, is_negotiable, unit, min_price, max_price, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """, (cat_id, np["name"], np["slug"], np["description"], np["price"], np["stock_quantity"], np["is_negotiable"], np["unit"], np["min_price"], np["max_price"]))
            prod_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO product_images (product_id, url, alt_text, sort_order, created_at)
                VALUES (?, ?, ?, 0, datetime('now'))
            """, (prod_id, np["image"], np["name"]))
            print(f"  [OK] Inserted product: {np['name']} (measured in {np['unit']})")

    conn.commit()

    # 5. Seed sample registered customers
    sample_customers = [
        ("Ngozi", "Eze", "ngozi.eze@gmail.com", "+234 803 234 5678", "Female"),
        ("Chinedu", "Okonkwo", "chinedu.o@yahoo.com", "+234 812 876 5432", "Male"),
        ("Amina", "Bello", "amina.bello@outlook.com", "+234 901 345 6789", "Female"),
        ("Oluwaseun", "Adeyemi", "seun.adeyemi@gmail.com", "+234 805 456 7890", "Male"),
        ("Blessing", "Bassey", "blessing.b@gmail.com", "+234 816 789 0123", "Female"),
        ("Emeka", "Nnamdi", "emeka.nnamdi@gmail.com", "+234 807 890 1234", "Male"),
        ("Fatima", "Danjuma", "fatima.danjuma@yahoo.com", "+234 903 012 3456", "Female"),
    ]

    customer_user_ids = []
    for fn, ln, email, phone, gender in sample_customers:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, phone, gender, password_hash, role, is_verified, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, '$2b$12$e/a9.fakehashforseedcustomersonly1234567890abcdef', 'customer', 1, 1, datetime('now', '-45 days'), datetime('now'))
            """, (fn, ln, email, phone, gender))
            c_id = cursor.lastrowid
            customer_user_ids.append(c_id)
            print(f"  [OK] Created customer: {fn} {ln} ({gender})")
        else:
            cursor.execute("UPDATE users SET gender = ? WHERE id = ?", (gender, row[0]))
            customer_user_ids.append(row[0])

    conn.commit()

    # 6. Seed orders for analytics & customer goods history if orders table is sparse
    cursor.execute("SELECT COUNT(*) FROM orders")
    order_count = cursor.fetchone()[0]

    if order_count < 10:
        cursor.execute("SELECT id, name, price, unit FROM products")
        prods_list = [dict(r) for r in cursor.fetchall()]

        # Generate orders across the last 6 months (yearly, monthly, and weekly distributions)
        now = datetime.utcnow()
        statuses = ["delivered", "delivered", "delivered", "processing", "shipped"]

        order_seq = 1001
        for i in range(16):
            c_id = customer_user_ids[i % len(customer_user_ids)]
            # Spread orders: 4 in last 7 days, 6 in last 30 days, remainder across 90-180 days
            if i < 4:
                days_ago = random.randint(1, 6)
            elif i < 10:
                days_ago = random.randint(8, 28)
            else:
                days_ago = random.randint(35, 150)
            
            order_date = (now - timedelta(days=days_ago, hours=random.randint(1, 12))).strftime("%Y-%m-%d %H:%M:%S")
            order_num = f"BYM-{now.year}-{order_seq + i}"
            status = statuses[i % len(statuses)]

            # Pick 1 to 3 items
            selected_prods = random.sample(prods_list, min(len(prods_list), random.randint(1, 3)))
            subtotal = 0.0

            order_items_data = []
            for p in selected_prods:
                p_unit = p.get("unit") or "quantity"
                qty = random.randint(2, 6) if p_unit in ("yard", "kg") else random.randint(1, 3)
                price = float(p["price"])
                line_subtotal = price * qty
                subtotal += line_subtotal
                order_items_data.append((p["id"], p["name"], qty, price, line_subtotal))

            delivery_fee = 1500.0
            total = subtotal + delivery_fee

            cursor.execute("""
                INSERT INTO orders (user_id, order_number, status, subtotal, delivery_fee, total, payment_status, shipping_address, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'paid', '{"city": "Lagos", "state": "Lagos"}', ?, ?)
            """, (c_id, order_num, status, subtotal, delivery_fee, total, order_date, order_date))
            new_order_id = cursor.lastrowid

            for pid, pname, qty, uprice, lsub in order_items_data:
                cursor.execute("""
                    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (new_order_id, pid, pname, qty, uprice, lsub))

        conn.commit()
        print("  [OK] Seeded 16 realistic orders with item details across weekly/monthly/yearly timeframes")

    conn.close()
    print("\n[SUCCESS] Migration and seeding complete!")

if __name__ == "__main__":
    run_migration()
