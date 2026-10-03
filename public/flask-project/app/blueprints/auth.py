"""Authentication blueprint"""
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
    return render_template('pos.html')
