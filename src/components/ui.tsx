import React, { useEffect, useRef } from 'react';

// Button
export function Button({ 
  children, variant = 'default', size = 'default', className = '', disabled, ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'accent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 shadow-sm',
    outline: 'border border-[hsl(var(--input))] bg-transparent hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary-foreground))]',
    ghost: 'hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary-foreground))]',
    destructive: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90',
    secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80',
    accent: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 shadow-sm',
  };
  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

// Card
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-[var(--shadow-sm)] ${className}`}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight font-[family-name:var(--font-display)] ${className}`}>{children}</h3>;
}
export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

// Input
export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// Badge
export function Badge({ children, variant = 'default', className = '' }: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  className?: string;
}) {
  const variants = {
    default: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent',
    secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-transparent',
    destructive: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] border-transparent',
    outline: 'text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    success: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] border-transparent',
    warning: 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] border-transparent',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Separator
export function Separator({ className = '', orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  const cls = orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px';
  return <div className={`shrink-0 bg-[hsl(var(--border))] ${cls} ${className}`} />;
}

// Dialog
export function Dialog({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: React.ReactNode; title: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-black/50 animate-fade-in" />
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-[hsl(var(--popover))] p-6 shadow-[var(--shadow-lg)] animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-display)]">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-[hsl(var(--secondary))] transition-colors" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Drawer (Sheet)
export function Drawer({ open, onClose, children, title, side = 'right' }: {
  open: boolean; onClose: () => void; children: React.ReactNode; title: string; side?: 'right' | 'bottom';
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const positionClass = side === 'right'
    ? 'fixed top-0 right-0 h-full w-full max-w-md'
    : 'fixed bottom-0 left-0 w-full max-h-[85vh]';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className={`${positionClass} bg-[hsl(var(--popover))] shadow-[var(--shadow-lg)] flex flex-col ${side === 'right' ? 'animate-slide-right' : 'animate-slide-up'}`}>
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)]">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-[hsl(var(--secondary))] transition-colors" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Tabs
export function Tabs({ value, onValueChange, children, className = '' }: {
  value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string;
}) {
  return <div className={className} data-value={value}>{children}</div>;
}
export function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))] ${className}`} role="tablist">
      {children}
    </div>
  );
}
export function TabsTrigger({ value, activeValue, onValueChange, children }: {
  value: string; activeValue: string; onValueChange: (v: string) => void; children: React.ReactNode;
}) {
  const isActive = value === activeValue;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${isActive ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm' : 'hover:text-[hsl(var(--foreground))]'}`}
    >
      {children}
    </button>
  );
}

// Toast container
export function ToastContainer({ toasts, removeToast }: {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast: { id: string; message: string; type: string }) => (
        <div
          key={toast.id}
          className={`animate-toast-in rounded-lg border p-4 shadow-[var(--shadow-md)] flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-[hsl(var(--success))] text-white border-transparent' :
            toast.type === 'error' ? 'bg-[hsl(var(--destructive))] text-white border-transparent' :
            'bg-[hsl(var(--popover))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]'
          }`}
        >
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// Skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[hsl(var(--muted))] ${className}`} />;
}

// Label
export function Label({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none ${className}`} {...props}>
      {children}
    </label>
  );
}

// Select
export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Table
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-auto ${className}`}>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  );
}
export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="[&_tr]:border-b">{children}</thead>;
}
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
}
export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={`border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--muted))]/50 ${className}`}>{children}</tr>;
}
export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`h-12 px-4 text-left align-middle font-medium text-[hsl(var(--muted-foreground))] ${className}`}>{children}</th>;
}
export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-4 align-middle ${className}`}>{children}</td>;
}
