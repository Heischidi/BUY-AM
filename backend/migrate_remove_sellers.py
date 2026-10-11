"""
Migration: Remove seller model — drop sellers table and seller_id from products.
Also removes 'seller' from user role enum (SQLite doesn't enforce enums, 
existing 'customer'/'admin' values are unaffected).

Run: python migrate_remove_sellers.py
"""
import sqlite3
import os

# Locate the database
DB_PATH = os.path.join(os.path.dirname(__file__), "buyam.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print(f"Connected to: {DB_PATH}")

    # ── 1. Check if sellers table exists ─────────────────────────────────────
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sellers'")
    if not cursor.fetchone():
        print("sellers table does not exist — skipping seller removal.")
    else:
        # ── 2. Null-out any foreign key references before dropping ────────────
        # SQLite doesn't support DROP COLUMN in older versions; we rebuild products instead.
        print("Dropping sellers table...")
        cursor.execute("PRAGMA foreign_keys = OFF")

        # ── 3. Check if seller_id column exists in products ───────────────────
        cursor.execute("PRAGMA table_info(products)")
        cols = [row["name"] for row in cursor.fetchall()]

        if "seller_id" in cols:
            print("Rebuilding products table (removing seller_id column)...")
            # Get all columns except seller_id
            keep_cols = [c for c in cols if c != "seller_id"]
            keep_cols_str = ", ".join(keep_cols)

            cursor.executescript(f"""
                CREATE TABLE products_new AS
                    SELECT {keep_cols_str} FROM products;

                DROP TABLE products;

                ALTER TABLE products_new RENAME TO products;
            """)
            print("  [OK] seller_id removed from products")
        else:
            print("  seller_id column not found in products -- skipping.")

        cursor.execute("DROP TABLE IF EXISTS sellers")
        print("  [OK] sellers table dropped")

        cursor.execute("PRAGMA foreign_keys = ON")

    # -- 4. Update any users with role='seller' to 'customer' -----------------
    cursor.execute("SELECT COUNT(*) FROM users WHERE role='seller'")
    seller_count = cursor.fetchone()[0]
    if seller_count > 0:
        cursor.execute("UPDATE users SET role='customer' WHERE role='seller'")
        print(f"  [OK] Converted {seller_count} seller user(s) to customer role")
    else:
        print("  No seller-role users found.")

    conn.commit()
    conn.close()
    print("\n[DONE] Migration complete.")

if __name__ == "__main__":
    migrate()
