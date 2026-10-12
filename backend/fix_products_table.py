import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "buyam.db")

def fix_table():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Rebuilding products table with INTEGER PRIMARY KEY AUTOINCREMENT...")
    cur.execute("PRAGMA foreign_keys = OFF")

    # Get existing rows
    cur.execute("""
        SELECT category_id, name, slug, description, price, compare_at_price,
               stock_quantity, sku, status, featured, is_negotiable, unit,
               min_price, max_price, created_at, updated_at
        FROM products
    """)
    rows = cur.fetchall()

    cur.execute("DROP TABLE IF EXISTS products")

    cur.execute("""
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(300) UNIQUE NOT NULL,
            description TEXT,
            price NUMERIC(12, 2) NOT NULL,
            compare_at_price NUMERIC(12, 2),
            stock_quantity INTEGER DEFAULT 0,
            sku VARCHAR(100) UNIQUE,
            status VARCHAR(20) DEFAULT 'active' NOT NULL,
            featured BOOLEAN DEFAULT 0,
            is_negotiable BOOLEAN DEFAULT 0 NOT NULL,
            unit VARCHAR(50) DEFAULT 'quantity' NOT NULL,
            min_price NUMERIC(12, 2),
            max_price NUMERIC(12, 2),
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );
    """)

    for r in rows:
        cur.execute("""
            INSERT INTO products (
                category_id, name, slug, description, price, compare_at_price,
                stock_quantity, sku, status, featured, is_negotiable, unit,
                min_price, max_price, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, r)

    # Also update product_images product_id references for the newly inserted products
    cur.execute("SELECT id, name FROM products")
    prods = cur.fetchall()
    for pid, pname in prods:
        cur.execute("UPDATE product_images SET product_id = ? WHERE alt_text = ?", (pid, pname))

    # Also update order_items product_id references
    for pid, pname in prods:
        cur.execute("UPDATE order_items SET product_id = ? WHERE product_name = ?", (pid, pname))

    cur.execute("PRAGMA foreign_keys = ON")
    conn.commit()

    # Verify
    cur.execute("SELECT id, name FROM products")
    print("New products table rows:")
    for r in cur.fetchall():
        print(f"  ID #{r[0]}: {r[1]}")

    conn.close()
    print("\n[OK] Products table successfully rebuilt with proper auto-increment IDs!")

if __name__ == "__main__":
    fix_table()
