# 📥 Download the Project

## Where to find the ZIP download:

### 1. **Floating Button** (Always Visible)
Look for the orange **"Download ZIP"** button in the **bottom-left corner** of the screen. It's visible on all pages - login page, POS, dashboard, etc.

### 2. **Login Page**
On the login page, there's a prominent download button below the login form.

### 3. **Admin Sidebar**
After logging in as admin, click the "Download Project (.zip)" button in the sidebar header.

### 4. **Direct URL**
Navigate to `/download.html` for a dedicated download page.

---

## What's in the ZIP:

```
brew-bean-project.zip
└── brew-bean-project/
    ├── flask-backend/          # Complete Flask backend
    │   ├── app/
    │   │   ├── __init__.py    # Flask app factory
    │   │   └── blueprints/
    │   │       ├── auth.py    # Authentication
    │   │       └── api.py     # REST API endpoints
    │   ├── schema.sql         # Database schema
    │   ├── seed.py            # Seed script (creates demo data)
    │   └── requirements.txt   # Python dependencies
    ├── run.bat                # One-click launcher (Windows)
    └── README.md              # Setup instructions
```

---

## How to Use:

### Option 1: Flask Backend (Python)
```bash
# Extract the ZIP
cd brew-bean-project/flask-backend

# Install dependencies
pip install -r requirements.txt

# Seed the database
python seed.py

# Run the server
flask run
```

### Option 2: React Frontend (Node.js)
```bash
# If you have the full React project
npm install
npm run dev

# Or just double-click run.bat (Windows)
```

---

## Demo Credentials:

| Role    | Username  | Password  |
|---------|-----------|-----------|
| Admin   | admin     | admin123  |
| Cashier | cashier   | cash123   |

---

## Need Help?

The ZIP file contains everything you need to run the project locally:
- Complete Flask backend with SQLite database
- REST API for products, orders, shifts, inventory
- Authentication system with role-based access
- Seed data (9 coffee products, 3 users, categories)
- Database schema with indexes

Just extract, install dependencies, and run!
