import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, Label, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Separator } from '../components/ui';

export function ProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory } = useStore();
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState<string | null>(null);
  const [newDialog, setNewDialog] = useState(false);
  const [newCatDialog, setNewCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.categoryId.includes(q));
  }, [products, search]);

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Products</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage your coffee catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewCatDialog(true)}>+ Category</Button>
          <Button variant="accent" onClick={() => setNewDialog(true)}>+ Product</Button>
        </div>
      </div>

      <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Roast</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.image}</span>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{categories.find(c => c.id === p.categoryId)?.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.roastLevel}</Badge></TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>
                    <Badge variant={p.stock <= p.lowStockThreshold ? 'warning' : 'secondary'}>{p.stock}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.active ? 'success' : 'destructive'}>{p.active ? 'Active' : 'Disabled'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditDialog(p.id)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => updateProduct(p.id, { active: !p.active })}>
                        {p.active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ProductForm
        open={!!editDialog || newDialog}
        onClose={() => { setEditDialog(null); setNewDialog(false); }}
        product={editDialog ? products.find(p => p.id === editDialog) : undefined}
        onSave={(data) => {
          if (editDialog) updateProduct(editDialog, data);
          else addProduct(data as any);
          setEditDialog(null);
          setNewDialog(false);
        }}
      />

      {/* New Category Dialog */}
      <Dialog open={newCatDialog} onClose={() => setNewCatDialog(false)} title="New Category">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Organic" />
          </div>
          <Button onClick={() => { addCategory({ name: newCatName, slug: newCatName.toLowerCase().replace(/\s/g, '-') }); setNewCatDialog(false); setNewCatName(''); }}>
            Add Category
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ProductForm({ open, onClose, product, onSave }: {
  open: boolean; onClose: () => void; product?: any; onSave: (data: any) => void;
}) {
  const { categories } = useStore();
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [tastingNotes, setTastingNotes] = useState(product?.tastingNotes || '');
  const [roastLevel, setRoastLevel] = useState(product?.roastLevel || 'medium');
  const [price, setPrice] = useState(product ? (product.price / 100).toString() : '');
  const [weight, setWeight] = useState(product?.weight || '250g');
  const [stock, setStock] = useState(product?.stock?.toString() || '0');
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold?.toString() || '10');

  const handleSubmit = () => {
    onSave({
      name, categoryId, description, tastingNotes, roastLevel,
      price: Math.round(parseFloat(price) * 100),
      weight, stock: parseInt(stock), lowStockThreshold: parseInt(lowStockThreshold),
      image: '☕', active: product?.active ?? true,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={product ? 'Edit Product' : 'New Product'}>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tasting Notes</Label>
          <Input value={tastingNotes} onChange={e => setTastingNotes(e.target.value)} placeholder="e.g. Blueberry, jasmine" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Roast Level</Label>
            <Select value={roastLevel} onChange={e => setRoastLevel(e.target.value)}>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="dark">Dark</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Weight</Label>
            <Input value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Price ($)</Label>
            <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Stock</Label>
            <Input type="number" value={stock} onChange={e => setStock(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Low Stock Threshold</Label>
          <Input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
        </div>
        <Button variant="accent" className="w-full" onClick={handleSubmit}>
          {product ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </Dialog>
  );
}

export function InventoryPage() {
  const { products, categories, stockMovements, restockProduct } = useStore();
  const [restockDialog, setRestockDialog] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filtered = filter === 'low'
    ? products.filter(p => p.active && p.stock <= p.lowStockThreshold)
    : products.filter(p => p.active);

  const handleRestock = () => {
    if (restockDialog && qty) {
      restockProduct(restockDialog, parseInt(qty), supplier, Math.round(parseFloat(cost || '0') * 100));
      setRestockDialog(null as any);
      setQty('');
      setSupplier('');
      setCost('');
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Inventory</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage stock levels and restock</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('low')}>Low Stock</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{categories.find(c => c.id === p.categoryId)?.name}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${p.stock <= p.lowStockThreshold ? 'text-[hsl(var(--destructive))]' : ''}`}>
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell>{p.lowStockThreshold}</TableCell>
                  <TableCell>
                    <Badge variant={p.stock <= p.lowStockThreshold ? 'destructive' : 'success'}>
                      {p.stock <= p.lowStockThreshold ? 'Low' : 'OK'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setRestockDialog(p.id)}>
                      + Restock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {stockMovements.length === 0 ? (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-4">No movements yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.slice(0, 20).map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.date).toLocaleDateString()}</TableCell>
                    <TableCell>{products.find(p => p.id === m.productId)?.name}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'restock' ? 'success' : m.type === 'sale' ? 'secondary' : 'outline'}>
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={m.quantity > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </TableCell>
                    <TableCell>{m.supplier || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={!!restockDialog} onClose={() => setRestockDialog(null)} title="Restock Product">
        <div className="space-y-3">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Product: {products.find(p => p.id === restockDialog)?.name}
          </p>
          <div className="space-y-1">
            <Label>Quantity</Label>
            <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Supplier</Label>
            <Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="space-y-1">
            <Label>Cost per unit ($)</Label>
            <Input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <Button variant="accent" className="w-full" onClick={handleRestock}>Confirm Restock</Button>
        </div>
      </Dialog>
    </div>
  );
}

export function AdminShiftsPage() {
  const { shifts, orders } = useStore();
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [cashierFilter, setCashierFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filteredShifts = useMemo(() => {
    let result = shifts.filter(s => s.closed);
    if (cashierFilter !== 'all') result = result.filter(s => s.cashierId === cashierFilter);
    if (dateFrom) result = result.filter(s => new Date(s.openedAt) >= new Date(dateFrom));
    if (dateTo) result = result.filter(s => new Date(s.openedAt) <= new Date(dateTo + 'T23:59:59'));
    return result.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [shifts, cashierFilter, dateFrom, dateTo]);

  const selectedShiftData = selectedShift ? shifts.find(s => s.id === selectedShift) : null;
  const shiftOrders = selectedShift ? orders.filter(o => o.shiftId === selectedShift) : [];

  const exportCSV = () => {
    const headers = ['Date', 'Cashier', 'Invoices', 'Cash', 'Card', 'Total', 'Opening', 'Counted', 'Difference'];
    const rows = filteredShifts.map(s => [
      new Date(s.openedAt).toLocaleDateString(),
      s.cashierName,
      s.invoicesCount,
      (s.totalCash / 100).toFixed(2),
      (s.totalCard / 100).toFixed(2),
      (s.totalIncome / 100).toFixed(2),
      (s.openingCash / 100).toFixed(2),
      ((s.countedCash || 0) / 100).toFixed(2),
      ((s.difference || 0) / 100).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shifts.csv';
    a.click();
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Shifts</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">View and manage cashier shifts</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>📥 Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={cashierFilter} onChange={e => setCashierFilter(e.target.value)} className="w-40">
          <option value="all">All Cashiers</option>
          <option value="u2">Maria Santos</option>
          <option value="u3">John Brew</option>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" placeholder="From" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" placeholder="To" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Diff</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.openedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{s.cashierName}</TableCell>
                  <TableCell>{s.invoicesCount}</TableCell>
                  <TableCell>{formatPrice(s.totalCash)}</TableCell>
                  <TableCell>{formatPrice(s.totalCard)}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(s.totalIncome)}</TableCell>
                  <TableCell>
                    <Badge variant={(s.difference || 0) === 0 ? 'success' : (s.difference || 0) > 0 ? 'warning' : 'destructive'}>
                      {formatPrice(s.difference || 0)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedShift(s.id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShift} onClose={() => setSelectedShift(null)} title="Shift Details">
        {selectedShiftData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-[hsl(var(--muted-foreground))]">Cashier:</span> <span className="font-medium">{selectedShiftData.cashierName}</span></div>
              <div><span className="text-[hsl(var(--muted-foreground))]">Date:</span> <span className="font-medium">{new Date(selectedShiftData.openedAt).toLocaleDateString()}</span></div>
              <div><span className="text-[hsl(var(--muted-foreground))]">Opened:</span> <span className="font-medium">{new Date(selectedShiftData.openedAt).toLocaleTimeString()}</span></div>
              <div><span className="text-[hsl(var(--muted-foreground))]">Closed:</span> <span className="font-medium">{selectedShiftData.closedAt ? new Date(selectedShiftData.closedAt).toLocaleTimeString() : '-'}</span></div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>Invoices: <strong>{selectedShiftData.invoicesCount}</strong></div>
              <div>Cash: <strong>{formatPrice(selectedShiftData.totalCash)}</strong></div>
              <div>Card: <strong>{formatPrice(selectedShiftData.totalCard)}</strong></div>
              <div>Total: <strong>{formatPrice(selectedShiftData.totalIncome)}</strong></div>
              <div>Opening: <strong>{formatPrice(selectedShiftData.openingCash)}</strong></div>
              <div>Counted: <strong>{formatPrice(selectedShiftData.countedCash || 0)}</strong></div>
              <div>Difference: <strong className={(selectedShiftData.difference || 0) === 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'}>{formatPrice(selectedShiftData.difference || 0)}</strong></div>
            </div>
            {selectedShiftData.notes && (
              <div className="p-3 rounded-md bg-[hsl(var(--muted))] text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Notes:</span> {selectedShiftData.notes}
              </div>
            )}
            <Separator />
            <h4 className="font-semibold text-sm">Invoices in this shift:</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {shiftOrders.map(o => (
                <div key={o.id} className="flex justify-between text-sm p-2 rounded bg-[hsl(var(--muted))]/50">
                  <span>{o.invoiceNumber} • {o.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                  <span className="font-medium">{formatPrice(o.total)} ({o.paymentMethod})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export function UsersPage() {
  const { users, addUser, toggleUser } = useStore();
  const [newDialog, setNewDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Users</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage system users</p>
        </div>
        <Button variant="accent" onClick={() => setNewDialog(true)}>+ Add User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
                  <TableCell><Badge variant={u.active ? 'success' : 'destructive'}>{u.active ? 'Active' : 'Disabled'}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleUser(u.id)}>
                      {u.active ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={newDialog} onClose={() => setNewDialog(false)} title="Add User">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Username</Label>
            <Input value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <Button variant="accent" className="w-full" onClick={() => {
            addUser({ username, password, name, role, active: true });
            setNewDialog(false);
            setUsername(''); setPassword(''); setName('');
          }}>Create User</Button>
        </div>
      </Dialog>
    </div>
  );
}

export function InvoicesPage() {
  const { orders, products } = useStore();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.invoiceNumber.toLowerCase().includes(q) ||
      o.cashierName.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const selected = selectedOrder ? orders.find(o => o.id === selectedOrder) : null;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Invoices</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">View all order invoices</p>
      </div>

      <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.invoiceNumber}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{o.cashierName}</TableCell>
                  <TableCell>{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                  <TableCell><Badge variant={o.paymentMethod === 'cash' ? 'success' : 'secondary'}>{o.paymentMethod}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(o.total)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o.id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Invoice ${selected?.invoiceNumber}`}>
        {selected && (
          <div className="space-y-4">
            <div className="text-center border-b border-[hsl(var(--border))] pb-4">
              <div className="text-3xl mb-2">☕</div>
              <h3 className="font-bold text-lg font-[family-name:var(--font-display)]">Brew & Bean</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Specialty Coffee</p>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Invoice:</strong> {selected.invoiceNumber}</p>
              <p><strong>Date:</strong> {new Date(selected.createdAt).toLocaleString()}</p>
              <p><strong>Cashier:</strong> {selected.cashierName}</p>
              {selected.customerName && <p><strong>Customer:</strong> {selected.customerName}</p>}
            </div>
            <Separator />
            <div className="space-y-2">
              {selected.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(selected.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax (8%)</span><span>{formatPrice(selected.tax)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between text-[hsl(var(--success))]"><span>Discount</span><span>-{formatPrice(selected.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{formatPrice(selected.total)}</span></div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] pt-1">Payment: {selected.paymentMethod}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => window.print()}>🖨️ Print Invoice</Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
