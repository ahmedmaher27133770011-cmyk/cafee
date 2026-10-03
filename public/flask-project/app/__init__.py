"""
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

    # Database
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

    # Auth helpers
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

    # Make helpers available to blueprints
    app.get_db = get_db
    app.login_required = login_required
    app.role_required = role_required

    # Register blueprints
    from blueprints.auth import auth_bp
    from blueprints.api import api_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/')
    def index():
        if 'user_id' in session:
            return redirect(url_for('auth.dashboard'))
        return redirect(url_for('auth.login'))

    return app
