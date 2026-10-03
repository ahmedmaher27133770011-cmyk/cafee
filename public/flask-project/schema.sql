-- Brew & Bean Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT DEFAULT '',
    tasting_notes TEXT DEFAULT '',
    roast_level TEXT DEFAULT 'medium' CHECK(roast_level IN ('light', 'medium', 'dark')),
    price INTEGER NOT NULL,  -- stored in cents
    weight TEXT DEFAULT '250g',
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    subtotal INTEGER NOT NULL,
    tax INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'card')),
    customer_name TEXT DEFAULT '',
    cashier_id INTEGER REFERENCES users(id),
    shift_id INTEGER REFERENCES shifts(id),
    created_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cashier_id INTEGER REFERENCES users(id),
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    opening_cash INTEGER DEFAULT 0,
    invoices_count INTEGER DEFAULT 0,
    total_cash INTEGER DEFAULT 0,
    total_card INTEGER DEFAULT 0,
    total_income INTEGER DEFAULT 0,
    counted_cash INTEGER,
    difference INTEGER,
    notes TEXT DEFAULT '',
    closed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    type TEXT CHECK(type IN ('restock', 'sale', 'adjustment')),
    quantity INTEGER NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    supplier TEXT DEFAULT '',
    cost INTEGER DEFAULT 0,
    notes TEXT DEFAULT ''
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_cashier ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
