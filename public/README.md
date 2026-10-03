# Brew & Bean — Specialty Coffee POS

A complete specialty coffee e-commerce and Point-of-Sale web application with Admin and Cashier roles.

## 🚀 Quick Start

### Option 1: Run the React App (Recommended)
```bash
# Double-click run.bat or run manually:
npm install
npm run dev
```
Open http://localhost:5173

### Option 2: Run the Flask Backend
```bash
cd flask-project
pip install -r requirements.txt
python seed.py
flask run
```

## 🔑 Demo Credentials

| Role    | Username  | Password  |
|---------|-----------|-----------|
| Admin   | admin     | admin123  |
| Cashier | cashier   | cash123   |

## ✨ Features

### Cashier
- **POS Screen**: Product grid with search, category filters, sort
- **Cart**: Add/remove items, quantity controls, stock validation
- **Checkout**: Customer name, payment method (cash/card), discount
- **Shift Management**: Open/close shifts, end-of-shift reconciliation
- **Invoices**: Generate and print invoices

### Admin
- **Dashboard**: KPI cards, revenue charts, sales by category, top products
- **Product Management**: Create/edit/disable products and categories
- **Inventory**: Stock levels, restock with supplier tracking, movement history
- **Shifts**: View all shifts with filters, drill-down into invoices, CSV export
- **Users**: Create and manage cashier accounts
- **Invoices**: View all order history

## 🏗️ Architecture

### Frontend (React + Vite + Tailwind)
- Single-page application with localStorage persistence
- shadcn/ui-inspired design system with warm coffee palette
- Chart.js for data visualization
- Fully responsive (mobile-first)

### Backend (Flask) — `flask-project/`
- Python Flask with app factory pattern
- SQLite database with parameterized queries
- Session-based authentication with hashed passwords
- RESTful API endpoints
- Role-based access control

## 📁 Project Structure

```
├── src/
│   ├── App.tsx          # Main app with routing & layout
│   ├── store/           # Zustand state management
│   ├── components/      # UI components (shadcn-inspired)
│   ├── pages/           # Page components
│   └── data/            # Seed data
├── public/
│   ├── run.bat          # One-click launcher
│   └── flask-project/   # Complete Flask backend
├── index.html
└── package.json
```

## 🎨 Design

- **Palette**: Warm coffee tones (cream, espresso brown, caramel, terracotta)
- **Typography**: Playfair Display (headings) + Inter (UI)
- **Components**: shadcn/ui patterns re-implemented in vanilla CSS + Tailwind
- **Accessibility**: Semantic HTML, ARIA labels, focus states, 44px touch targets

## 📋 Test Checklist

- [ ] Login as admin → see dashboard with KPIs and charts
- [ ] Login as cashier → see POS screen
- [ ] Cashier cannot access admin pages (403/redirect)
- [ ] Open shift → create orders → close shift
- [ ] End-of-shift totals match sum of invoices
- [ ] Admin sees closed shifts in Shifts table
- [ ] Stock decrements after order completion
- [ ] Low-stock alerts appear on dashboard
- [ ] CSV export works for shifts
- [ ] Responsive at 360px, 768px, 1024px, 1440px

## 🔧 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, Chart.js
- **Backend**: Python Flask, SQLite, Werkzeug
- **Design**: shadcn/ui inspired, custom coffee palette

## 📝 Notes

- All data persists in localStorage (React app) or SQLite (Flask)
- No real payment processing (simulated)
- Prices stored as integers (cents) to avoid floating-point issues
- Shifts are immutable once closed
