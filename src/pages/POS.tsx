import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Button, Input, Badge, Card, Drawer, Separator, Label, Select, Dialog } from '../components/ui';

export default function POSPage() {
  const {
    products, categories, cart, addToCart, removeFromCart, updateCartQty, clearCart,
    createOrder, activeShift, currentUser
  } = useStore();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [discount, setDiscount] = useState(0);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const activeProducts = useMemo(() => {
    let filtered = products.filter(p => p.active);
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.tastingNotes.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.categoryId === categoryFilter);
    }
    
    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      default: filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  }, [products, search, categoryFilter, sortBy]);

  const cartItems = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    }).filter(item => item.product);
  }, [cart, products]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax - discount;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    const order = createOrder({
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.product!.name,
        quantity: item.quantity,
        price: item.product!.price,
      })),
      paymentMethod,
      customerName,
      discount,
    });
    
    if (order) {
      setLastOrder(order);
      setCheckoutOpen(false);
      setCustomerName('');
      setDiscount(0);
      setCartOpen(false);
    }
  };

  const getRoastColor = (level: string) => {
    switch (level) {
      case 'light': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dark': return 'bg-stone-200 text-stone-800 border-stone-300';
      default: return '';
    }
  };

  const selectedProd = selectedProduct ? products.find(p => p.id === selectedProduct) : null;

  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-md text-center p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">No Active Shift</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            You need to open a shift before you can process orders.
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Go to the Shift page to open a new shift.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <Input
              placeholder="Search coffees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full sm:w-40">
            <option value="name">Name A-Z</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
          </Select>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              categoryFilter === 'all'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                categoryFilter === cat.id
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto flex-1">
          {activeProducts.map(product => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 flex flex-col"
            >
              <div
                className="p-4 flex-1 flex flex-col"
                onClick={() => setSelectedProduct(product.id)}
              >
                <div className="text-4xl mb-3 text-center">{product.image}</div>
                <h3 className="font-semibold text-sm leading-tight mb-1">{product.name}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">{product.tastingNotes}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-[hsl(var(--accent))]">{formatPrice(product.price)}</span>
                  <Badge variant={product.stock <= product.lowStockThreshold ? 'warning' : 'secondary'}>
                    {product.stock} left
                  </Badge>
                </div>
                <div className="mt-2">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${getRoastColor(product.roastLevel)}`}>
                    {product.roastLevel} roast
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}
                className="w-full py-2 text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 rounded-b-lg transition-colors min-h-[44px]"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Sidebar (Desktop) / Button (Mobile) */}
      <div className="hidden lg:flex flex-col w-80">
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg font-[family-name:var(--font-display)]">Cart</h2>
              <Badge variant="secondary">{totalItems} items</Badge>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Shift: {activeShift.cashierName} • Opened {new Date(activeShift.openedAt).toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <div className="text-3xl mb-2">🛒</div>
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.productId} className="flex items-center gap-3 p-2 rounded-md bg-[hsl(var(--muted))]/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product!.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatPrice(item.product!.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center text-sm hover:bg-[hsl(var(--border))] min-w-[44px] min-h-[44px]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center text-sm hover:bg-[hsl(var(--border))] min-w-[44px] min-h-[44px]"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-[hsl(var(--border))] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Tax (8%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[hsl(var(--accent))]">{formatPrice(total)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={clearCart} className="flex-1">Clear</Button>
                <Button variant="accent" onClick={() => setCheckoutOpen(true)} className="flex-1">
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile Cart Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Button
          variant="accent"
          size="lg"
          onClick={() => setCartOpen(true)}
          className="rounded-full shadow-[var(--shadow-lg)]"
        >
          🛒 Cart ({totalItems})
        </Button>
      </div>

      {/* Mobile Cart Drawer */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title={`Cart (${totalItems} items)`} side="right">
        <div className="space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="flex items-center gap-3 p-3 rounded-md bg-[hsl(var(--muted))]/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product!.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatPrice(item.product!.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center text-sm min-w-[44px] min-h-[44px]"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center text-sm min-w-[44px] min-h-[44px]"
                  >
                    +
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="mt-4 space-y-2 pt-4 border-t border-[hsl(var(--border))]">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8%)</span><span>{formatPrice(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-[hsl(var(--accent))]">{formatPrice(total)}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={clearCart} className="flex-1">Clear</Button>
              <Button variant="accent" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="flex-1">
                Checkout
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProd?.name || ''}>
        {selectedProd && (
          <div className="space-y-4">
            <div className="text-6xl text-center py-4">{selectedProd.image}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{categories.find(c => c.id === selectedProd.categoryId)?.name}</Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoastColor(selectedProd.roastLevel)}`}>
                {selectedProd.roastLevel} roast
              </span>
              <Badge variant={selectedProd.stock > 0 ? 'success' : 'destructive'}>
                {selectedProd.stock > 0 ? `${selectedProd.stock} in stock` : 'Out of stock'}
              </Badge>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedProd.description}</p>
            <div className="p-3 rounded-md bg-[hsl(var(--muted))]">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Tasting Notes</p>
              <p className="text-sm italic">{selectedProd.tastingNotes}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[hsl(var(--accent))]">{formatPrice(selectedProd.price)}</span>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{selectedProd.weight}</span>
            </div>
            <Button
              variant="accent"
              className="w-full"
              size="lg"
              onClick={() => { addToCart(selectedProd.id); setSelectedProduct(null); }}
              disabled={selectedProd.stock === 0}
            >
              {selectedProd.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Name (optional)</Label>
            <Input
              placeholder="Walk-in customer"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex-1"
              >
                💵 Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex-1"
              >
                💳 Card
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Discount ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount / 100}
              onChange={e => setDiscount(Math.round(parseFloat(e.target.value || '0') * 100))}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Items ({totalItems})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[hsl(var(--success))]">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Total</span>
              <span className="text-[hsl(var(--accent))]">{formatPrice(total)}</span>
            </div>
          </div>
          
          <Button variant="accent" size="lg" className="w-full" onClick={handleCheckout}>
            Complete Order
          </Button>
        </div>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={!!lastOrder} onClose={() => setLastOrder(null)} title="Order Complete!">
        {lastOrder && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <h3 className="text-xl font-semibold">{lastOrder.invoiceNumber}</h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              {lastOrder.items.length} item(s) • {formatPrice(lastOrder.total)}
            </p>
            <div className="text-left p-4 rounded-md bg-[hsl(var(--muted))] text-sm space-y-1">
              {lastOrder.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setLastOrder(null); }} className="flex-1">
                New Order
              </Button>
              <Button variant="default" onClick={() => { window.print(); setLastOrder(null); }} className="flex-1">
                🖨️ Print
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
