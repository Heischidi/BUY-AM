import logging
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.cart import Cart, CartItem
from app.models.chat import ChatSession, ChatMessage
from app.models.procurement import ProcurementRequest
from app.models.staff import Staff, StaffAttendance

logger = logging.getLogger("buyam.init_db")

def init_db():
    """
    Self-healing schema migration and admin user initialization.
    Safe to run multiple times on any database (SQLite, PostgreSQL, etc.).
    """
    report = {"tables_created": [], "columns_added": [], "admin_ready": False}
    
    try:
        # 1. Create any missing tables
        Base.metadata.create_all(bind=engine)
        report["metadata_created"] = True
    except Exception as e:
        logger.error(f"Error creating metadata tables: {e}")
        report["metadata_error"] = str(e)

    # 2. Inspect existing tables and columns
    try:
        insp = inspect(engine)
        table_names = insp.get_table_names()

        # Check 'users' table columns
        if "users" in table_names:
            user_cols = [c["name"].lower() for c in insp.get_columns("users")]
            with engine.begin() as conn:
                if "username" not in user_cols:
                    logger.info("Adding 'username' column to users table")
                    try:
                        conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(100)"))
                        report["columns_added"].append("users.username")
                    except Exception as ex:
                        logger.warning(f"Failed to add users.username: {ex}")

                if "gender" not in user_cols:
                    logger.info("Adding 'gender' column to users table")
                    try:
                        conn.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(20) DEFAULT 'Not specified'"))
                        report["columns_added"].append("users.gender")
                    except Exception as ex:
                        logger.warning(f"Failed to add users.gender: {ex}")

        # Check 'products' table columns
        if "products" in table_names:
            prod_cols = [c["name"].lower() for c in insp.get_columns("products")]
            with engine.begin() as conn:
                if "unit" not in prod_cols:
                    logger.info("Adding 'unit' column to products table")
                    try:
                        conn.execute(text("ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT 'quantity'"))
                        report["columns_added"].append("products.unit")
                    except Exception as ex:
                        logger.warning(f"Failed to add products.unit: {ex}")

                if "is_negotiable" not in prod_cols:
                    logger.info("Adding 'is_negotiable' column to products table")
                    try:
                        conn.execute(text("ALTER TABLE products ADD COLUMN is_negotiable BOOLEAN DEFAULT FALSE"))
                        report["columns_added"].append("products.is_negotiable")
                    except Exception as ex:
                        logger.warning(f"Failed to add products.is_negotiable: {ex}")

                if "min_price" not in prod_cols:
                    logger.info("Adding 'min_price' column to products table")
                    try:
                        conn.execute(text("ALTER TABLE products ADD COLUMN min_price NUMERIC(12, 2)"))
                        report["columns_added"].append("products.min_price")
                    except Exception as ex:
                        logger.warning(f"Failed to add products.min_price: {ex}")

                if "max_price" not in prod_cols:
                    logger.info("Adding 'max_price' column to products table")
                    try:
                        conn.execute(text("ALTER TABLE products ADD COLUMN max_price NUMERIC(12, 2)"))
                        report["columns_added"].append("products.max_price")
                    except Exception as ex:
                        logger.warning(f"Failed to add products.max_price: {ex}")

                if "discount_percentage" not in prod_cols:
                    logger.info("Adding 'discount_percentage' column to products table")
                    try:
                        conn.execute(text("ALTER TABLE products ADD COLUMN discount_percentage NUMERIC(5, 2)"))
                        report["columns_added"].append("products.discount_percentage")
                    except Exception as ex:
                        logger.warning(f"Failed to add products.discount_percentage: {ex}")

                # Clean up NULL units or max_prices
                try:
                    conn.execute(text("UPDATE products SET unit = 'quantity' WHERE unit IS NULL"))
                    conn.execute(text("UPDATE products SET is_negotiable = FALSE WHERE is_negotiable IS NULL"))
                    conn.execute(text("UPDATE products SET max_price = price WHERE max_price IS NULL AND is_negotiable = TRUE"))
                except Exception as ex:
                    logger.warning(f"Cleanup update failed: {ex}")

    except Exception as e:
        logger.error(f"Error inspecting/migrating columns: {e}")
        report["migration_error"] = str(e)

    # 3. Ensure Admin Mama Nkechi exists with correct password
    db: Session = SessionLocal()
    try:
        admin_user = (
            db.query(User)
            .filter(
                (User.role == UserRole.admin) |
                (User.email == "admin@buyam.com") |
                (User.username == "Mama Nkechi")
            )
            .first()
        )

        target_hash = hash_password("mamankechi123%")

        if admin_user:
            admin_user.first_name = "Mama"
            admin_user.last_name = "Nkechi"
            admin_user.username = "Mama Nkechi"
            admin_user.email = "admin@buyam.com"
            admin_user.role = UserRole.admin
            admin_user.gender = "Female"
            admin_user.is_verified = True
            admin_user.is_active = True
            admin_user.password_hash = target_hash
            db.commit()
            report["admin_ready"] = True
            report["admin_action"] = "updated"
        else:
            new_admin = User(
                first_name="Mama",
                last_name="Nkechi",
                username="Mama Nkechi",
                email="admin@buyam.com",
                phone="+2348012345678",
                gender="Female",
                password_hash=target_hash,
                role=UserRole.admin,
                is_verified=True,
                is_active=True,
            )
            db.add(new_admin)
            db.commit()
            report["admin_ready"] = True
            report["admin_action"] = "created"
    except Exception as e:
        db.rollback()
        logger.error(f"Error ensuring admin user: {e}")
        report["admin_error"] = str(e)
    finally:
        db.close()

    return report
