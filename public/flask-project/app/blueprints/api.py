"""REST API blueprint"""
import json
from datetime import datetime
from flask import Blueprint, request, session, jsonify, g, current_app

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


# --- Products ---
@api_bp.route('/products', methods=['GET'])
def list_products():
    db = get_db()
    products = db.execute('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.active = 1 ORDER BY p.name').fetchall()
    return jsonify([dict(p) for p in products])


@api_bp.route('/products', methods=['POST'])
def create_product():
    err = require_role('admin')
    if err: return err
    data = request.get_json()
    db = get_db()
    db.execute('INSERT INTO products (name, category_id, description, tasting_notes, roast_level, price, weight, stock, low_stock_threshold, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
               (data['name'], data['category_id'], data.get('description', ''), data.get('tasting_notes', ''), data.get('roast_level', 'medium'), data['price'], data.get('weight', '250g'), data.get('stock', 0), data.get('low_stock_threshold', 10)))
    db.commit()
    return jsonify({'success': True}), 201


# --- Orders ---
@api_bp.route('/orders', methods=['POST'])
def create_order():
    err = require_login()
    if err: return err
    data = request.get_json()
    db = get_db()
    
    # Check active shift
    shift = db.execute('SELECT * FROM shifts WHERE cashier_id = ? AND closed = 0', (session['user_id'],)).fetchone()
    if not shift:
        return jsonify({'error': 'No active shift'}), 400
    
    items = data['items']
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    tax = int(subtotal * 0.08)
    discount = data.get('discount', 0)
    total = subtotal + tax - discount
    
    # Create order
    cursor = db.execute('INSERT INTO orders (invoice_number, subtotal, tax, discount, total, payment_method, customer_name, cashier_id, shift_id, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        (data.get('invoice_number', f'INV-{datetime.now().strftime("%Y%m%d%H%M%S")}'), subtotal, tax, discount, total, data['payment_method'], data.get('customer_name', ''), session['user_id'], shift['id'], datetime.now().isoformat(), 'completed'))
    order_id = cursor.lastrowid
    
    # Create order items and update stock
    for item in items:
        db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                   (order_id, item['product_id'], item['quantity'], item['price']))
        db.execute('UPDATE products SET stock = stock - ? WHERE id = ?', (item['quantity'], item['product_id']))
        db.execute('INSERT INTO stock_movements (product_id, type, quantity, date, notes) VALUES (?, ?, ?, ?, ?)',
                   (item['product_id'], 'sale', -item['quantity'], datetime.now().isoformat(), f'Sale - Order #{order_id}'))
    
    # Update shift totals
    if data['payment_method'] == 'cash':
        db.execute('UPDATE shifts SET invoices_count = invoices_count + 1, total_cash = total_cash + ?, total_income = total_income + ? WHERE id = ?',
                   (total, total, shift['id']))
    else:
        db.execute('UPDATE shifts SET invoices_count = invoices_count + 1, total_card = total_card + ?, total_income = total_income + ? WHERE id = ?',
                   (total, total, shift['id']))
    
    db.commit()
    return jsonify({'success': True, 'order_id': order_id, 'total': total}), 201


# --- Shifts ---
@api_bp.route('/shifts/open', methods=['POST'])
def open_shift():
    err = require_login()
    if err: return err
    data = request.get_json()
    db = get_db()
    
    # Check for existing active shift
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


# --- Admin Stats ---
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


# --- Inventory ---
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
    return jsonify({'success': True})
