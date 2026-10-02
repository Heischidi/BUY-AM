#!/usr/bin/env python3
"""
Buy Am Database Seed Script
Run with: python -m backend.seed  (from project root)
Or:        cd backend && python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.core.security import hash_password
from app.models import (
    User, UserRole, Seller, SellerStatus, Category, Product, ProductImage, ProductStatus
)
import re

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


CATEGORIES = [
    ("Household", "🧺", "Everyday household essentials"),
    ("Furniture", "🪑", "Quality furniture for every space"),
    ("Decor", "🏺", "Beautiful home decoration pieces"),
    ("Procurement", "📦", "Bulk sourcing and procurement services"),
    ("Printing", "🖨️", "Professional printing services"),
    ("Signage", "🪧", "Custom signs and branding"),
    ("Electronics", "🔊", "Tech gadgets and electronics"),
    ("Fashion", "👕", "Clothing and accessories"),
    ("Beauty", "🧴", "Skincare and beauty products"),
    ("Groceries", "🥬", "Fresh food and pantry essentials"),
    ("Office Supplies", "📚", "Everything for your workspace"),
    ("Building Materials", "🧱", "Construction and building materials"),
]

PRODUCTS = [
    {
        "name": "Woven Storage Basket",
        "category": "Household",
        "price": 18500,
        "description": "Beautifully handcrafted woven basket, perfect for organizing your home. Made from sustainable natural materials.",
        "stock": 50,
        "featured": True,
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Accent Lounge Chair",
        "category": "Furniture",
        "price": 145000,
        "description": "Premium accent lounge chair with solid wood frame and high-quality upholstery. Adds elegance to any living room.",
        "stock": 12,
        "featured": True,
        "image": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Handmade Ceramic Vase",
        "category": "Decor",
        "price": 24000,
        "description": "Unique handcrafted ceramic vase, perfect for flowers or as a standalone decorative piece.",
        "stock": 30,
        "featured": False,
        "image": "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Office Printing Package",
        "category": "Printing",
        "price": 35000,
        "description": "Complete office printing package including business cards, letterheads, and flyers.",
        "stock": 100,
        "featured": False,
        "image": "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Custom Shop Sign",
        "category": "Signage",
        "price": 65000,
        "description": "Professional custom shop sign with your business name and logo. Weather-resistant and long-lasting.",
        "stock": 20,
        "featured": True,
        "image": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Wireless Desk Speaker",
        "category": "Electronics",
        "price": 42000,
        "description": "High-quality wireless Bluetooth speaker with rich bass and 12-hour battery life. Perfect for your desk or bedroom.",
        "stock": 25,
        "featured": True,
        "image": "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Patterned Market Shirt",
        "category": "Fashion",
        "price": 28000,
        "description": "Vibrant African-inspired patterned shirt. Comfortable and stylish for any occasion.",
        "stock": 40,
        "featured": False,
        "image": "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Natural Body Care Set",
        "category": "Beauty",
        "price": 19500,
        "description": "Complete natural body care set with shea butter lotion, scrub, and body oil. Made with Nigerian botanicals.",
        "stock": 35,
        "featured": False,
        "image": "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Fresh Pantry Starter Box",
        "category": "Groceries",
        "price": 32000,
        "description": "Curated pantry starter box with essential Nigerian kitchen staples — rice, palm oil, spices, and more.",
        "stock": 60,
        "featured": True,
        "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Smart Office Starter Kit",
        "category": "Office Supplies",
        "price": 27500,
        "description": "Everything you need to set up a productive office: notebook, pens, desk organizer, sticky notes, and more.",
        "stock": 45,
        "featured": False,
        "image": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Building Materials Bundle",
        "category": "Building Materials",
        "price": 89000,
        "description": "Essential building materials bundle for small construction or renovation projects.",
        "stock": 15,
        "featured": False,
        "image": "https://images.unsplash.com/photo-1503387762-59203558cd95?auto=format&fit=crop&w=900&q=80",
    },
    {
        "name": "Bulk Procurement Service",
        "category": "Procurement",
        "price": 50000,
        "description": "Professional bulk procurement service. We source and deliver any item in quantity for businesses and organizations.",
        "stock": 999,
        "featured": True,
        "image": "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
    },
]


def seed():
    print("🌱 Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Admin user ────────────────────────────────────────────────
        admin = db.query(User).filter(User.email == "admin@buyam.com").first()
        if not admin:
            admin = User(
                first_name="Buy Am",
                last_name="Admin",
                email="admin@buyam.com",
                password_hash=hash_password("Admin@123"),
                role=UserRole.admin,
                is_verified=True,
            )
            db.add(admin)
            db.flush()
            print("✅ Admin user created: admin@buyam.com / Admin@123")

        # ── Demo seller ───────────────────────────────────────────────
        demo_user = db.query(User).filter(User.email == "seller@buyam.com").first()
        if not demo_user:
            demo_user = User(
                first_name="Demo",
                last_name="Seller",
                email="seller@buyam.com",
                password_hash=hash_password("Seller@123"),
                role=UserRole.seller,
                is_verified=True,
            )
            db.add(demo_user)
            db.flush()
            print("✅ Demo seller created: seller@buyam.com / Seller@123")

        demo_seller = db.query(Seller).filter(Seller.user_id == demo_user.id).first()
        if not demo_seller:
            demo_seller = Seller(
                user_id=demo_user.id,
                business_name="Buy Am Demo Store",
                description="The official Buy Am demo product store.",
                verification_status=SellerStatus.approved,
            )
            db.add(demo_seller)
            db.flush()
            print("✅ Demo seller profile created")

        # ── Categories ────────────────────────────────────────────────
        category_map = {}
        for name, icon, description in CATEGORIES:
            cat = db.query(Category).filter(Category.slug == slugify(name)).first()
            if not cat:
                cat = Category(
                    name=name,
                    slug=slugify(name),
                    icon=icon,
                    description=description,
                    active=True,
                )
                db.add(cat)
                db.flush()
                print(f"  📁 Category: {name}")
            category_map[name] = cat

        # ── Products ──────────────────────────────────────────────────
        for p in PRODUCTS:
            slug = slugify(p["name"])
            existing = db.query(Product).filter(Product.slug == slug).first()
            if not existing:
                product = Product(
                    seller_id=demo_seller.id,
                    category_id=category_map[p["category"]].id,
                    name=p["name"],
                    slug=slug,
                    description=p["description"],
                    price=p["price"],
                    stock_quantity=p["stock"],
                    featured=p["featured"],
                    status=ProductStatus.active,
                )
                db.add(product)
                db.flush()

                image = ProductImage(
                    product_id=product.id,
                    url=p["image"],
                    alt_text=p["name"],
                    sort_order=0,
                )
                db.add(image)
                print(f"  🛍️  Product: {p['name']}")

        db.commit()
        print("\n✅ Database seeded successfully!")
        print("\nLogin credentials:")
        print("  Admin: admin@buyam.com / Admin@123")
        print("  Seller: seller@buyam.com / Seller@123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
