"""
Seed script for Brew & Bean
Run: python seed.py
"""
import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'brew_bean.db')


def seed():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    # Remove existing DB
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    
    # Create tables
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
        conn.executescript(f.read())
    
    # Seed users
    users = [
        ('admin', generate_password_hash('admin123'), 'Admin User', 'admin'),
        ('cashier', generate_password_hash('cash123'), 'Maria Santos', 'cashier'),
        ('cashier2', generate_password_hash('cash123'), 'John Brew', 'cashier'),
    ]
    conn.executemany('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', users)
    
    # Seed categories
    categories = [
        ('Single Origin', 'single-origin'),
        ('Blend', 'blend'),
        ('Decaf', 'decaf'),
        ('Special Reserve', 'special-reserve'),
    ]
    conn.executemany('INSERT INTO categories (name, slug) VALUES (?, ?)', categories)
    
    # Seed products (prices in cents)
    products = [
        ('Ethiopian Yirgacheffe', 1, 'Bright and complex coffee from the birthplace of coffee.', 'Blueberry, jasmine, lemon zest, honey', 'light', 1899, '250g', 45, 10),
        ('Colombian Supremo', 1, 'Premium grade Colombian beans from the Huila region.', 'Caramel, walnut, red apple, cocoa', 'medium', 1699, '250g', 62, 15),
        ('Brazil Santos', 1, 'Classic Brazilian coffee with low acidity and nutty sweetness.', 'Hazelnut, chocolate, brown sugar, mild', 'medium', 1499, '250g', 80, 20),
        ('Kenya AA', 1, 'Bold and vibrant Kenyan coffee with wine-like acidity.', 'Blackcurrant, grapefruit, tomato, brown sugar', 'light', 2199, '250g', 8, 10),
        ('Sumatra Mandheling', 1, 'Full-bodied Indonesian coffee with earthy depth.', 'Dark chocolate, cedar, tobacco, earthy', 'dark', 1799, '250g', 35, 10),
        ('Espresso Blend No. 7', 2, 'Our signature house blend crafted for espresso.', 'Dark chocolate, hazelnut, caramel, spice', 'dark', 1599, '250g', 100, 25),
        ('Morning Ritual Blend', 2, 'A smooth, approachable blend perfect for your morning cup.', 'Milk chocolate, almond, toffee, smooth', 'medium', 1399, '250g', 75, 20),
        ('Colombian Decaf', 3, 'Swiss Water Process decaf that retains all the flavor.', 'Caramel, vanilla, mild citrus, clean', 'medium', 1799, '250g', 30, 8),
        ('Geisha Reserve Panama', 4, 'Ultra-rare Geisha variety from Boquete, Panama.', 'Jasmine, bergamot, peach, tropical fruit', 'light', 4999, '100g', 5, 3),
    ]
    conn.executemany(
        'INSERT INTO products (name, category_id, description, tasting_notes, roast_level, price, weight, stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        products
    )
    
    conn.commit()
    conn.close()
    print("✓ Database seeded successfully!")
    print(f"  Database: {DB_PATH}")
    print()
    print("Demo credentials:")
    print("  Admin:   admin / admin123")
    print("  Cashier: cashier / cash123")


if __name__ == '__main__':
    seed()
