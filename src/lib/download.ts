import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const flaskFiles: Record<string, string> = {
  'requirements.txt': `flask==3.0.0
werkzeug==3.0.1
flask-login==0.6.3
flask-wtf==1.2.1`,

  'app/__init__.py': `"""
Brew & Bean — Specialty Coffee POS
Flask Application Factory
"""
import os
import sqlite3
from flask import Flask, g, session, redirect, url_for
from functools import wraps


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='brew-bean-secret-key-change-in-production',
        DATABASE=os.path.join(app.instance_path, 'brew_bean.db'),
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    def get_db():
        if 'db' not in g:
            g.db = sqlite3.connect(app.config['DATABASE'])
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA foreign_keys = ON")
        return g.db

    @app.teardown_appcontext
    def close_db(exception):
        db = g.pop('db', None)
        if db is not None:
            db.close()

    def login_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('auth.login'))
            return f(*args, **kwargs)
        return decorated

    def role_required(role):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                if 'user_id' not in session:
                    return redirect(url_for('auth.login'))
                db = get_db()
                user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
                if not user or user['role'] != role:
                    return '{"error": "Forbidden"}', 403
                return f(*args, **kwargs)
            return decorated
        return decorator

    app.get_db = get_db
    app.login_required = login_required
    app.role_required = role_required

    from blueprints.auth import auth_bp
    from blueprints.api import api_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/')
    def index():
        if 'user_id' in session:
            return redirect(url_for('auth.dashboard'))
        return redirect(url_for('auth.login'))

    return app`,

  'app/blueprints/__init__.py': '# Blueprints package',

  'app/blueprints/auth.py': `"""Authentication blueprint"""
from flask import Blueprint, request, session, redirect, url_for, render_template, jsonify, g
from werkzeug.security import check_password_hash

auth_bp = Blueprint('auth', __name__, template_folder='../templates')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json() or request.form
        username = data.get('username', '')
        password = data.get('password', '')
        
        db = g.get('db') or __import__('flask').current_app.get_db()
        user = db.execute('SELECT * FROM users WHERE username = ? AND active = 1', (username,)).fetchone()
        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['role'] = user['role']
            session['name'] = user['name']
            if request.is_json:
                return jsonify({'success': True, 'role': user['role'], 'name': user['name']})
            return redirect(url_for('auth.dashboard' if user['role'] == 'admin' else 'auth.pos'))
        
        if request.is_json:
            return jsonify({'error': 'Invalid credentials'}), 401
        return render_template('login.html', error='Invalid credentials')
    
    return render_template('login.html')


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))


@auth_bp.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    return render_template('dashboard.html')


@auth_bp.route('/pos')
def pos():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    return render_template('pos.html')`,

  'app/blueprints/api.py': `"""REST API blueprint"""
from datetime import datetime
from flask import Blueprint, request, session, jsonify, current_app

api_bp = Blueprint('api', __name__)


def get_db():
    return current_app.get_db()


def require_login():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    return None


def require_role(role):
    err = require_login()
    if err:
        return err
    if session.get('role') != role:
        return jsonify({'error': 'Forbidden'}), 403
    return None


@api_bp.route('/products', methods=['GET'])
def list_products():
    db = get_db()
    products = db.execute(
        'SELECT p.*, c.name as category_name FROM products p '
        'JOIN categories c ON p.category_id = c.id WHERE p.active = 1 ORDER BY p.name'
    ).fetchall()
    return jsonify([dict(p) for p in products])


@api_bp.route('/products', methods=['POST'])
def create_product():
    err = require_role('admin')
    if err: return err
    data = request.get_json()
    db = get_db()
    db.execute(
        'INSERT INTO products (name, category_id, description, tasting_notes, roast_level, price, weight, stock, low_stock_threshold, active) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        (data['name'], data['category_id'], data.get('description', ''), data.get('tasting_notes', ''),
         data.get('roast_level', 'medium'), data['price'], data.get('weight', '250g'),
         data.get('stock', 0), data.get('low_stock_threshold', 10))
    )
    db.commit()
    return jsonify({'success': True}), 201


@api_bp.route('/orders', methods=['POST'])
def create_order():
    err = require_login()
    if err: return err
    data = request.get_json()
    db = get_db()
    
    shift = db.execute('SELECT * FROM shifts WHERE cashier_id = ? AND closed = 0', (session['user_id'],)).fetchone()
    if not shift:
        return jsonify({'error': 'No active shift'}), 400
    
    items = data['items']
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    tax = int(subtotal * 0.08)
    discount = data.get('discount', 0)
    total = subtotal + tax - discount
    
    cursor = db.execute(
        'INSERT INTO orders (invoice_number, subtotal, tax, discount, total, payment_method, customer_name, cashier_id, shift_id, created_at, status) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (data.get('invoice_number', f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}'),
         subtotal, tax, discount, total, data['payment_method'],
         data.get('customer_name', ''), session['user_id'], shift['id'],
         datetime.now().isoformat(), 'completed')
    )
    order_id = cursor.lastrowid
    
    for item in items:
        db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                   (order_id, item['product_id'], item['quantity'], item['price']))
        db.execute('UPDATE products SET stock = stock - ? WHERE id = ?', (item['quantity'], item['product_id']))
        db.execute('INSERT INTO stock_movements (product_id, type, quantity, date, notes) VALUES (?, ?, ?, ?, ?)',
                   (item['product_id'], 'sale', -item['quantity'], datetime.now().isoformat(), f'Sale - Order #{order_id}'))
    
    if data['payment_method'] == 'cash':
        db.execute('UPDATE shifts SET invoices_count = invoices_count + 1, total_cash = total_cash + ?, total_income = total_income + ? WHERE id = ?',
                   (total, total, shift['id']))
    else:
        db.execute('UPDATE shifts SET invoices_count = invoices_count + 1, total_card = total_card + ?, total_income = total_income + ? WHERE id = ?',
                   (total, total, shift['id']))
    
    db.commit()
    return jsonify({'success': True, 'order_id': order_id, 'total': total}), 201


@api_bp.route('/shifts/open', methods=['POST'])
def open_shift():
    err = require_login()
    if err: return err
    data = request.get_json()
    db = get_db()
    
    existing = db.execute('SELECT * FROM shifts WHERE cashier_id = ? AND closed = 0', (session['user_id'],)).fetchone()
    if existing:
        return jsonify({'shift_id': existing['id'], 'message': 'Shift already active'})
    
    cursor = db.execute('INSERT INTO shifts (cashier_id, opened_at, opening_cash, closed) VALUES (?, ?, ?, 0)',
                        (session['user_id'], datetime.now().isoformat(), data.get('opening_cash', 0)))
    db.commit()
    return jsonify({'success': True, 'shift_id': cursor.lastrowid}), 201


@api_bp.route('/shifts/close', methods=['POST'])
def close_shift():
    err = require_login()
    if err: return err
    data = request.get_json()
    db = get_db()
    
    shift = db.execute('SELECT * FROM shifts WHERE cashier_id = ? AND closed = 0', (session['user_id'],)).fetchone()
    if not shift:
        return jsonify({'error': 'No active shift'}), 400
    
    counted_cash = data.get('counted_cash', 0)
    expected_cash = shift['total_cash'] + shift['opening_cash']
    difference = counted_cash - expected_cash
    
    db.execute('UPDATE shifts SET closed = 1, closed_at = ?, counted_cash = ?, difference = ?, notes = ? WHERE id = ?',
               (datetime.now().isoformat(), counted_cash, difference, data.get('notes', ''), shift['id']))
    db.commit()
    return jsonify({'success': True})


@api_bp.route('/shifts/active')
def active_shift():
    err = require_login()
    if err: return err
    db = get_db()
    shift = db.execute('SELECT * FROM shifts WHERE cashier_id = ? AND closed = 0', (session['user_id'],)).fetchone()
    if shift:
        return jsonify(dict(shift))
    return jsonify(None)


@api_bp.route('/admin/stats')
def admin_stats():
    err = require_role('admin')
    if err: return err
    db = get_db()
    
    total_revenue = db.execute('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "completed"').fetchone()['total']
    today = datetime.now().strftime('%Y-%m-%d')
    today_revenue = db.execute('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "completed" AND date(created_at) = ?', (today,)).fetchone()['total']
    orders_count = db.execute('SELECT COUNT(*) as cnt FROM orders WHERE status = "completed"').fetchone()['cnt']
    low_stock = db.execute('SELECT COUNT(*) as cnt FROM products WHERE active = 1 AND stock <= low_stock_threshold').fetchone()['cnt']
    
    return jsonify({
        'total_revenue': total_revenue,
        'today_revenue': today_revenue,
        'orders_count': orders_count,
        'low_stock_count': low_stock,
    })


@api_bp.route('/inventory/restock', methods=['POST'])
def restock():
    err = require_role('admin')
    if err: return err
    data = request.get_json()
    db = get_db()
    
    db.execute('UPDATE products SET stock = stock + ? WHERE id = ?', (data['quantity'], data['product_id']))
    db.execute('INSERT INTO stock_movements (product_id, type, quantity, date, supplier, cost) VALUES (?, ?, ?, ?, ?, ?)',
               (data['product_id'], 'restock', data['quantity'], datetime.now().isoformat(), data.get('supplier', ''), data.get('cost', 0)))
    db.commit()
    return jsonify({'success': True})`,

  'schema.sql': `-- Brew & Bean Database Schema

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
    price INTEGER NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_orders_cashier ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`,

  'seed.py': `"""Seed script for Brew & Bean"""
import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'brew_bean.db')


def seed():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
        conn.executescript(f.read())
    
    users = [
        ('admin', generate_password_hash('admin123'), 'Admin User', 'admin'),
        ('cashier', generate_password_hash('cash123'), 'Maria Santos', 'cashier'),
        ('cashier2', generate_password_hash('cash123'), 'John Brew', 'cashier'),
    ]
    conn.executemany('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', users)
    
    categories = [
        ('Single Origin', 'single-origin'),
        ('Blend', 'blend'),
        ('Decaf', 'decaf'),
        ('Special Reserve', 'special-reserve'),
    ]
    conn.executemany('INSERT INTO categories (name, slug) VALUES (?, ?)', categories)
    
    products = [
        ('Ethiopian Yirgacheffe', 1, 'Bright and complex coffee.', 'Blueberry, jasmine, lemon zest', 'light', 1899, '250g', 45, 10),
        ('Colombian Supremo', 1, 'Premium Colombian beans.', 'Caramel, walnut, red apple', 'medium', 1699, '250g', 62, 15),
        ('Brazil Santos', 1, 'Classic Brazilian coffee.', 'Hazelnut, chocolate, brown sugar', 'medium', 1499, '250g', 80, 20),
        ('Kenya AA', 1, 'Bold Kenyan coffee.', 'Blackcurrant, grapefruit, tomato', 'light', 2199, '250g', 8, 10),
        ('Sumatra Mandheling', 1, 'Full-bodied Indonesian.', 'Dark chocolate, cedar, tobacco', 'dark', 1799, '250g', 35, 10),
        ('Espresso Blend No. 7', 2, 'Signature house blend.', 'Dark chocolate, hazelnut, caramel', 'dark', 1599, '250g', 100, 25),
        ('Morning Ritual Blend', 2, 'Smooth morning blend.', 'Milk chocolate, almond, toffee', 'medium', 1399, '250g', 75, 20),
        ('Colombian Decaf', 3, 'Swiss Water Process decaf.', 'Caramel, vanilla, mild citrus', 'medium', 1799, '250g', 30, 8),
        ('Geisha Reserve Panama', 4, 'Ultra-rare Geisha variety.', 'Jasmine, bergamot, peach', 'light', 4999, '100g', 5, 3),
    ]
    conn.executemany(
        'INSERT INTO products (name, category_id, description, tasting_notes, roast_level, price, weight, stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        products
    )
    
    conn.commit()
    conn.close()
    print("Database seeded successfully!")
    print("Admin: admin / admin123")
    print("Cashier: cashier / cash123")


if __name__ == '__main__':
    seed()`,

  'README.md': `# Brew & Bean — Flask Backend

## Setup
\`\`\`bash
pip install -r requirements.txt
python seed.py
flask run
\`\`\`

## Credentials
- Admin: admin / admin123
- Cashier: cashier / cash123
`
};

export async function downloadFlaskProject() {
  const zip = new JSZip();
  const folder = zip.folder('brew-bean-flask');
  
  if (!folder) return;
  
  Object.entries(flaskFiles).forEach(([path, content]) => {
    folder.file(path, content);
  });
  
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'brew-bean-flask.zip');
}

export async function downloadFullProject() {
  const zip = new JSZip();
  const folder = zip.folder('brew-bean-project');
  
  if (!folder) return;
  
  // Add Flask project
  const flaskFolder = folder.folder('flask-backend');
  if (flaskFolder) {
    Object.entries(flaskFiles).forEach(([path, content]) => {
      flaskFolder.file(path, content);
    });
  }
  
  // Add run.bat
  folder.file('run.bat', `@echo off
echo ============================================
echo   Brew ^& Bean - Specialty Coffee POS
echo ============================================
echo.
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
echo Starting server...
call npm run dev
`);
  
  // Add README
  folder.file('README.md', `# Brew & Bean — Specialty Coffee POS

## Quick Start
1. Double-click run.bat (or run: npm install && npm run dev)
2. Open http://localhost:5173
3. Login: admin/admin123 or cashier/cash123

## Flask Backend
cd flask-backend
pip install -r requirements.txt
python seed.py
flask run
`);
  
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'brew-bean-project.zip');
}
