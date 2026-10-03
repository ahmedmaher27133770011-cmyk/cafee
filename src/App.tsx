import React, { useState } from 'react';
import { useStore } from './store';
import { ToastContainer, Button } from './components/ui';
import { downloadFullProject } from './lib/download';
import LoginPage from './pages/Login';
import POSPage from './pages/POS';
import ShiftPage from './pages/Shift';
import DashboardPage from './pages/Dashboard';
import { ProductsPage, InventoryPage, AdminShiftsPage, UsersPage, InvoicesPage } from './pages/Admin';

// Floating download button - always visible
function FloatingDownloadButton() {
  return (
    <button
      onClick={downloadFullProject}
      className="fixed bottom-6 left-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold shadow-[var(--shadow-lg)] hover:bg-[hsl(var(--accent))]/90 hover:-translate-y-1 transition-all animate-fade-in"
      title="Download Full Project (.zip)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span className="text-sm">Download ZIP</span>
    </button>
  );
}

type Page = 'pos' | 'shift' | 'dashboard' | 'products' | 'inventory' | 'shifts' | 'users' | 'invoices';

export default function App() {
  const { currentUser, logout, toasts, removeToast, activeShift } = useStore();
  const [currentPage, setCurrentPage] = useState<Page>('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <FloatingDownloadButton />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  const adminNavItems: { page: Page; label: string; icon: string }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: '📊' },
    { page: 'pos', label: 'POS', icon: '🛒' },
    { page: 'products', label: 'Products', icon: '☕' },
    { page: 'inventory', label: 'Inventory', icon: '📦' },
    { page: 'shifts', label: 'Shifts', icon: '🕐' },
    { page: 'invoices', label: 'Invoices', icon: '🧾' },
    { page: 'users', label: 'Users', icon: '👥' },
  ];

  const cashierNavItems: { page: Page; label: string; icon: string }[] = [
    { page: 'pos', label: 'POS', icon: '🛒' },
    { page: 'shift', label: 'My Shift', icon: '🕐' },
  ];

  const navItems = isAdmin ? adminNavItems : cashierNavItems;

  const renderPage = () => {
    switch (currentPage) {
      case 'pos': return <POSPage />;
      case 'shift': return <ShiftPage />;
      case 'dashboard': return isAdmin ? <DashboardPage /> : <POSPage />;
      case 'products': return isAdmin ? <ProductsPage /> : <POSPage />;
      case 'inventory': return isAdmin ? <InventoryPage /> : <POSPage />;
      case 'shifts': return isAdmin ? <AdminShiftsPage /> : <ShiftPage />;
      case 'users': return isAdmin ? <UsersPage /> : <POSPage />;
      case 'invoices': return isAdmin ? <InvoicesPage /> : <POSPage />;
      default: return <POSPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {/* Logo */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <div>
              <h1 className="font-bold text-lg font-[family-name:var(--font-display)] leading-tight">Brew & Bean</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Specialty Coffee</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={downloadFullProject}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Project (.zip)
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                currentPage === item.page
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center text-sm font-bold">
              {currentUser.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
              title="Logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
          {activeShift && !activeShift.closed && (
            <div className="mt-2 px-3 py-1.5 rounded-md bg-[hsl(var(--success))]/10 text-xs text-[hsl(var(--success))] font-medium">
              ● Shift Active
            </div>
          )}
          {isAdmin && (
            <button
              onClick={downloadFullProject}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              📥 Download Project (.zip)
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md hover:bg-[hsl(var(--muted))] min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">☕</span>
          <span className="font-bold font-[family-name:var(--font-display)]">Brew & Bean</span>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={downloadFullProject}
              className="p-2 rounded-md hover:bg-[hsl(var(--muted))] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Download project"
              title="Download Project (.zip)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-md hover:bg-[hsl(var(--muted))] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-[hsl(var(--card))] shadow-[var(--shadow-lg)] animate-slide-right flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">☕</span>
                <span className="font-bold font-[family-name:var(--font-display)]">Brew & Bean</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.page}
                  onClick={() => { setCurrentPage(item.page); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    currentPage === item.page
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-[hsl(var(--border))]">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center text-sm font-bold">
                  {currentUser.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{currentUser.role}</p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { downloadFullProject(); setSidebarOpen(false); }}
                  className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  📥 Download Project (.zip)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {renderPage()}
      </main>

      {/* Floating Download Button */}
      <FloatingDownloadButton />

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
