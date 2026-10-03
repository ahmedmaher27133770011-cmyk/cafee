import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User, Product, Category, Order, OrderItem, Shift,
  StockMovement, CartItem,
  seedUsers, seedProducts, seedCategories,
  generateSeedOrders, generateSeedShifts
} from '../data/seed';

interface AppState {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  toggleUser: (id: string) => void;

  // Products
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;

  // Cart
  cart: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  // Orders
  orders: Order[];
  createOrder: (data: {
    items: OrderItem[];
    paymentMethod: 'cash' | 'card';
    customerName: string;
    discount: number;
  }) => Order | null;

  // Shifts
  shifts: Shift[];
  activeShift: Shift | null;
  openShift: (openingCash: number) => Shift | null;
  closeShift: (countedCash: number, notes: string) => boolean;

  // Stock movements
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => void;
  restockProduct: (productId: string, qty: number, supplier: string, cost: number) => void;

  // Toast
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateInvoiceNumber = (orders: Order[]) => {
  const num = orders.length + 1001;
  return `INV-${String(num).padStart(4, '0')}`;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      currentUser: null,
      login: (username, password) => {
        const user = get().users.find(
          u => u.username === username && u.password === password && u.active
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null, cart: [], activeShift: null }),

      // Users
      users: seedUsers,
      addUser: (user) => set(s => ({ users: [...s.users, { ...user, id: generateId() }] })),
      toggleUser: (id) => set(s => ({
        users: s.users.map(u => u.id === id ? { ...u, active: !u.active } : u)
      })),

      // Products
      products: seedProducts,
      categories: seedCategories,
      addProduct: (product) => set(s => ({
        products: [...s.products, { ...product, id: generateId() }]
      })),
      updateProduct: (id, data) => set(s => ({
        products: s.products.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deleteProduct: (id) => set(s => ({
        products: s.products.map(p => p.id === id ? { ...p, active: false } : p)
      })),
      addCategory: (cat) => set(s => ({
        categories: [...s.categories, { ...cat, id: generateId() }]
      })),

      // Cart
      cart: [],
      addToCart: (productId) => {
        const { cart, products } = get();
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const existing = cart.find(c => c.productId === productId);
        const currentQty = existing ? existing.quantity : 0;
        
        if (currentQty >= product.stock) {
          get().addToast('Not enough stock available', 'error');
          return;
        }
        
        if (existing) {
          set({ cart: cart.map(c => c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c) });
        } else {
          set({ cart: [...cart, { productId, quantity: 1 }] });
        }
      },
      removeFromCart: (productId) => set(s => ({
        cart: s.cart.filter(c => c.productId !== productId)
      })),
      updateCartQty: (productId, qty) => {
        const { products } = get();
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (qty > product.stock) {
          get().addToast('Not enough stock available', 'error');
          return;
        }
        if (qty <= 0) {
          set(s => ({ cart: s.cart.filter(c => c.productId !== productId) }));
        } else {
          set(s => ({ cart: s.cart.map(c => c.productId === productId ? { ...c, quantity: qty } : c) }));
        }
      },
      clearCart: () => set({ cart: [] }),

      // Orders
      orders: generateSeedOrders(),
      createOrder: (data) => {
        const { products, currentUser, activeShift } = get();
        if (!currentUser || !activeShift) {
          get().addToast('No active shift. Please open a shift first.', 'error');
          return null;
        }
        if (activeShift.closed) {
          get().addToast('Shift is closed. Cannot create orders.', 'error');
          return null;
        }

        const items: OrderItem[] = data.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name || 'Unknown',
            quantity: item.quantity,
            price: product?.price || 0,
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = Math.round(subtotal * 0.08);
        const total = subtotal + tax - data.discount;

        const order: Order = {
          id: generateId(),
          invoiceNumber: generateInvoiceNumber(get().orders),
          items,
          subtotal,
          tax,
          discount: data.discount,
          total,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          shiftId: activeShift.id,
          createdAt: new Date().toISOString(),
          status: 'completed',
        };

        // Decrement stock
        const updatedProducts = products.map(p => {
          const orderItem = items.find(i => i.productId === p.id);
          if (orderItem) {
            return { ...p, stock: p.stock - orderItem.quantity };
          }
          return p;
        });

        // Create stock movements for sales
        const movements: StockMovement[] = items.map(item => ({
          id: generateId(),
          productId: item.productId,
          type: 'sale' as const,
          quantity: -item.quantity,
          date: new Date().toISOString(),
          notes: `Sale - ${order.invoiceNumber}`,
        }));

        // Update shift totals
        const updatedShifts = get().shifts.map(s => {
          if (s.id === activeShift.id) {
            return {
              ...s,
              invoicesCount: s.invoicesCount + 1,
              totalCash: s.totalCash + (data.paymentMethod === 'cash' ? total : 0),
              totalCard: s.totalCard + (data.paymentMethod === 'card' ? total : 0),
              totalIncome: s.totalIncome + total,
            };
          }
          return s;
        });

        set({
          orders: [order, ...get().orders],
          products: updatedProducts,
          stockMovements: [...movements, ...get().stockMovements],
          shifts: updatedShifts,
          activeShift: updatedShifts.find(s => s.id === activeShift.id) || null,
          cart: [],
        });

        get().addToast(`Order ${order.invoiceNumber} completed!`, 'success');
        return order;
      },

      // Shifts
      shifts: generateSeedShifts(),
      activeShift: null,
      openShift: (openingCash) => {
        const { currentUser, shifts } = get();
        if (!currentUser) return null;

        // Check if there's already an active shift
        const existingActive = shifts.find(s => s.cashierId === currentUser.id && !s.closed);
        if (existingActive) {
          set({ activeShift: existingActive });
          return existingActive;
        }

        const shift: Shift = {
          id: generateId(),
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          openedAt: new Date().toISOString(),
          openingCash,
          invoicesCount: 0,
          totalCash: 0,
          totalCard: 0,
          totalIncome: 0,
          closed: false,
        };

        set({
          shifts: [shift, ...shifts],
          activeShift: shift,
        });

        get().addToast('Shift opened successfully!', 'success');
        return shift;
      },
      closeShift: (countedCash, notes) => {
        const { activeShift } = get();
        if (!activeShift) return false;

        const difference = countedCash - (activeShift.totalCash + activeShift.openingCash);

        const updatedShifts = get().shifts.map(s => {
          if (s.id === activeShift.id) {
            return {
              ...s,
              closedAt: new Date().toISOString(),
              countedCash,
              difference,
              notes,
              closed: true,
            };
          }
          return s;
        });

        const closedShift = updatedShifts.find(s => s.id === activeShift.id);
        set({ shifts: updatedShifts, activeShift: null });
        get().addToast('Shift closed successfully!', 'success');
        return !!closedShift;
      },

      // Stock movements
      stockMovements: [],
      addStockMovement: (movement) => set(s => ({
        stockMovements: [{ ...movement, id: generateId() }, ...s.stockMovements]
      })),
      restockProduct: (productId, qty, supplier, cost) => {
        const { products } = get();
        const updatedProducts = products.map(p =>
          p.id === productId ? { ...p, stock: p.stock + qty } : p
        );

        const movement: StockMovement = {
          id: generateId(),
          productId,
          type: 'restock',
          quantity: qty,
          date: new Date().toISOString(),
          supplier,
          cost,
        };

        set({
          products: updatedProducts,
          stockMovements: [movement, ...get().stockMovements],
        });
        get().addToast(`Restocked ${qty} units`, 'success');
      },

      // Toast
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = generateId();
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'brew-bean-store',
      partialize: (state) => ({
        users: state.users,
        products: state.products,
        categories: state.categories,
        orders: state.orders,
        shifts: state.shifts,
        stockMovements: state.stockMovements,
        cart: state.cart,
        activeShift: state.activeShift,
        currentUser: state.currentUser,
      }),
    }
  )
);
