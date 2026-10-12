import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.security import hash_password, verify_password

DB_PATH = os.path.join(os.path.dirname(__file__), "buyam.db")

def set_credentials():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 1. Add username column if missing
    cur.execute("PRAGMA table_info(users)")
    cols = [r["name"] for r in cur.fetchall()]
    if "username" not in cols:
        cur.execute("ALTER TABLE users ADD COLUMN username VARCHAR(100)")
        print("  [OK] Added 'username' column to users table")

    # 2. Hash password
    new_password = "mamankechi123%"
    new_hashed = hash_password(new_password)

    # 3. Update admin user
    cur.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    admin_row = cur.fetchone()

    if admin_row:
        admin_id = admin_row["id"]
        cur.execute("""
            UPDATE users
            SET username = ?, first_name = ?, last_name = ?, password_hash = ?
            WHERE id = ?
        """, ("Mama Nkechi", "Mama", "Nkechi", new_hashed, admin_id))
        print(f"  [OK] Updated admin user (ID #{admin_id}) to:")
        print("       Username: 'Mama Nkechi'")
        print("       Password: 'mamankechi123%'")
    else:
        cur.execute("""
            INSERT INTO users (first_name, last_name, username, email, password_hash, role, is_verified, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'admin', 1, 1, datetime('now'), datetime('now'))
        """, ("Mama", "Nkechi", "Mama Nkechi", "admin@buyam.com", new_hashed))
        print("  [OK] Inserted new admin user with username 'Mama Nkechi'")

    conn.commit()

    # 4. Verify password
    cur.execute("SELECT username, password_hash FROM users WHERE username = 'Mama Nkechi'")
    check = cur.fetchone()
    if check and verify_password(new_password, check["password_hash"]):
        print("\n✅ Verification SUCCESSFUL: 'Mama Nkechi' / 'mamankechi123%' is ready to log in!")
    else:
        print("\n❌ Verification failed")

    conn.close()

if __name__ == "__main__":
    set_credentials()
