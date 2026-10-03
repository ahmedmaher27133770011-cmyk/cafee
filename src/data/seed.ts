export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  name: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  tastingNotes: string;
  roastLevel: 'light' | 'medium' | 'dark';
  price: number; // in cents
  weight: string;
  stock: number;
  lowStockThreshold: number;
  image: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  customerName: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  createdAt: string;
  status: 'completed' | 'cancelled';
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'restock' | 'sale' | 'adjustment';
  quantity: number;
  date: string;
  supplier?: string;
  cost?: number;
  notes?: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  invoicesCount: number;
  totalCash: number;
  totalCard: number;
  totalIncome: number;
  countedCash?: number;
  difference?: number;
  notes?: string;
  closed: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

// Seed data
export const seedUsers: User[] = [
  { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', active: true },
  { id: 'u2', username: 'cashier', password: 'cash123', role: 'cashier', name: 'Maria Santos', active: true },
  { id: 'u3', username: 'cashier2', password: 'cash123', role: 'cashier', name: 'John Brew', active: true },
];

export const seedCategories: Category[] = [
  { id: 'c1', name: 'Single Origin', slug: 'single-origin' },
  { id: 'c2', name: 'Blend', slug: 'blend' },
  { id: 'c3', name: 'Decaf', slug: 'decaf' },
  { id: 'c4', name: 'Special Reserve', slug: 'special-reserve' },
];

export const seedProducts: Product[] = [
  {
    id: 'p1',
    name: 'Ethiopian Yirgacheffe',
    categoryId: 'c1',
    description: 'A bright and complex coffee from the birthplace of coffee. Grown at high altitude in the Yirgacheffe region with meticulous washing process.',
    tastingNotes: 'Blueberry, jasmine, lemon zest, honey',
    roastLevel: 'light',
    price: 1899,
    weight: '250g',
    stock: 45,
    lowStockThreshold: 10,
    image: '☕',
    active: true,
  },
  {
    id: 'p2',
    name: 'Colombian Supremo',
    categoryId: 'c1',
    description: 'Premium grade Colombian beans from the Huila region. Smooth body with balanced acidity and a clean finish.',
    tastingNotes: 'Caramel, walnut, red apple, cocoa',
    roastLevel: 'medium',
    price: 1699,
    weight: '250g',
    stock: 62,
    lowStockThreshold: 15,
    image: '☕',
    active: true,
  },
  {
    id: 'p3',
    name: 'Brazil Santos',
    categoryId: 'c1',
    description: 'A classic Brazilian coffee with low acidity and nutty sweetness. Perfect for espresso or as a smooth daily brew.',
    tastingNotes: 'Hazelnut, chocolate, brown sugar, mild',
    roastLevel: 'medium',
    price: 1499,
    weight: '250g',
    stock: 80,
    lowStockThreshold: 20,
    image: '☕',
    active: true,
  },
  {
    id: 'p4',
    name: 'Kenya AA',
    categoryId: 'c1',
    description: 'Bold and vibrant Kenyan coffee with wine-like acidity. The AA grade ensures only the largest, most flavorful beans.',
    tastingNotes: 'Blackcurrant, grapefruit, tomato, brown sugar',
    roastLevel: 'light',
    price: 2199,
    weight: '250g',
    stock: 8,
    lowStockThreshold: 10,
    image: '☕',
    active: true,
  },
  {
    id: 'p5',
    name: 'Sumatra Mandheling',
    categoryId: 'c1',
    description: 'Full-bodied Indonesian coffee with earthy depth. Wet-hulled processing gives it a distinctive syrupy texture.',
    tastingNotes: 'Dark chocolate, cedar, tobacco, earthy',
    roastLevel: 'dark',
    price: 1799,
    weight: '250g',
    stock: 35,
    lowStockThreshold: 10,
    image: '☕',
    active: true,
  },
  {
    id: 'p6',
    name: 'Espresso Blend No. 7',
    categoryId: 'c2',
    description: 'Our signature house blend crafted for espresso. A balanced combination of Brazilian and Ethiopian beans with a touch of Robusta for crema.',
    tastingNotes: 'Dark chocolate, hazelnut, caramel, spice',
    roastLevel: 'dark',
    price: 1599,
    weight: '250g',
    stock: 100,
    lowStockThreshold: 25,
    image: '☕',
    active: true,
  },
  {
    id: 'p7',
    name: 'Morning Ritual Blend',
    categoryId: 'c2',
    description: 'A smooth, approachable blend perfect for your morning cup. Medium roast with balanced flavors that pair well with milk.',
    tastingNotes: 'Milk chocolate, almond, toffee, smooth',
    roastLevel: 'medium',
    price: 1399,
    weight: '250g',
    stock: 75,
    lowStockThreshold: 20,
    image: '☕',
    active: true,
  },
  {
    id: 'p8',
    name: 'Colombian Decaf',
    categoryId: 'c3',
    description: 'Swiss Water Process decaf that retains all the flavor. Enjoy a rich cup any time of day without the caffeine.',
    tastingNotes: 'Caramel, vanilla, mild citrus, clean',
    roastLevel: 'medium',
    price: 1799,
    weight: '250g',
    stock: 30,
    lowStockThreshold: 8,
    image: '☕',
    active: true,
  },
  {
    id: 'p9',
    name: 'Geisha Reserve Panama',
    categoryId: 'c4',
    description: 'Ultra-rare Geisha variety from Boquete, Panama. An extraordinary cup with floral complexity and tea-like elegance.',
    tastingNotes: 'Jasmine, bergamot, peach, tropical fruit',
    roastLevel: 'light',
    price: 4999,
    weight: '100g',
    stock: 5,
    lowStockThreshold: 3,
    image: '☕',
    active: true,
  },
];

// Generate some historical orders for demo
export function generateSeedOrders(): Order[] {
  const orders: Order[] = [];
  const now = new Date();
  
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60));
    
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: OrderItem[] = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = seedProducts[Math.floor(Math.random() * seedProducts.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      items.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.price,
      });
      subtotal += product.price * qty;
    }
    
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;
    const isCash = Math.random() > 0.4;
    
    orders.push({
      id: `ord-${Date.now()}-${i}`,
      invoiceNumber: `INV-${String(1000 + i).padStart(4, '0')}`,
      items,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod: isCash ? 'cash' : 'card',
      customerName: '',
      cashierId: Math.random() > 0.5 ? 'u2' : 'u3',
      cashierName: Math.random() > 0.5 ? 'Maria Santos' : 'John Brew',
      shiftId: `shift-demo-${daysAgo}`,
      createdAt: date.toISOString(),
      status: 'completed',
    });
  }
  
  return orders;
}

export function generateSeedShifts(): Shift[] {
  const shifts: Shift[] = [];
  const now = new Date();
  
  for (let i = 1; i <= 10; i++) {
    const daysAgo = i;
    const openedAt = new Date(now);
    openedAt.setDate(openedAt.getDate() - daysAgo);
    openedAt.setHours(7, 0, 0);
    
    const closedAt = new Date(now);
    closedAt.setDate(closedAt.getDate() - daysAgo);
    closedAt.setHours(15, 30, 0);
    
    const invoicesCount = Math.floor(Math.random() * 15) + 5;
    const totalCash = Math.floor(Math.random() * 50000) + 20000;
    const totalCard = Math.floor(Math.random() * 30000) + 10000;
    
    shifts.push({
      id: `shift-hist-${i}`,
      cashierId: i % 2 === 0 ? 'u2' : 'u3',
      cashierName: i % 2 === 0 ? 'Maria Santos' : 'John Brew',
      openedAt: openedAt.toISOString(),
      closedAt: closedAt.toISOString(),
      openingCash: 10000,
      invoicesCount,
      totalCash,
      totalCard,
      totalIncome: totalCash + totalCard,
      countedCash: totalCash + 10000 + (Math.random() > 0.7 ? Math.floor(Math.random() * 500) - 250 : 0),
      difference: Math.random() > 0.7 ? Math.floor(Math.random() * 500) - 250 : 0,
      notes: '',
      closed: true,
    });
  }
  
  return shifts;
}
