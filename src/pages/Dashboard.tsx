import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Separator } from '../components/ui';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

export default function DashboardPage() {
  const { orders, products, shifts, users } = useStore();
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // KPI calculations
  const kpis = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const today = new Date().toDateString();
    const todayOrders = completedOrders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const totalItemsSold = completedOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0);
    const lowStockCount = products.filter(p => p.active && p.stock <= p.lowStockThreshold).length;
    const closedShifts = shifts.filter(s => s.closed).length;

    return { totalRevenue, todayRevenue, ordersCount: completedOrders.length, avgOrderValue, totalItemsSold, lowStockCount, closedShifts, todayOrders: todayOrders.length };
  }, [orders, products, shifts]);

  // Revenue chart data
  const revenueData = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const days: Record<string, number> = {};
    
    completedOrders.forEach(o => {
      const d = new Date(o.createdAt);
      let key: string;
      if (revenuePeriod === 'daily') {
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (revenuePeriod === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      days[key] = (days[key] || 0) + o.total;
    });

    const entries = Object.entries(days).slice(-14);
    return {
      labels: entries.map(e => e[0]),
      datasets: [{
        label: 'Revenue ($)',
        data: entries.map(e => e[1] / 100),
        backgroundColor: 'hsl(20, 70%, 50%)',
        borderColor: 'hsl(20, 70%, 40%)',
        borderWidth: 1,
        borderRadius: 4,
      }]
    };
  }, [orders, revenuePeriod]);

  // Category sales
  const categoryData = useMemo(() => {
    const { categories } = useStore.getState();
    const sales: Record<string, number> = {};
    orders.filter(o => o.status === 'completed').forEach(o => {
      o.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const cat = categories.find(c => c.id === product.categoryId);
          const catName = cat?.name || 'Other';
          sales[catName] = (sales[catName] || 0) + item.price * item.quantity;
        }
      });
    });
    const colors = ['hsl(25, 50%, 28%)', 'hsl(20, 70%, 50%)', 'hsl(30, 60%, 60%)', 'hsl(35, 40%, 70%)'];
    return {
      labels: Object.keys(sales),
      datasets: [{
        data: Object.values(sales).map(v => v / 100),
        backgroundColor: colors,
        borderWidth: 0,
      }]
    };
  }, [orders, products]);

  // Top products
  const topProducts = useMemo(() => {
    const sales: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.filter(o => o.status === 'completed').forEach(o => {
      o.items.forEach(item => {
        if (!sales[item.productId]) sales[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        sales[item.productId].qty += item.quantity;
        sales[item.productId].revenue += item.price * item.quantity;
      });
    });
    return Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  // Payment method split
  const paymentData = useMemo(() => {
    const cash = orders.filter(o => o.status === 'completed' && o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const card = orders.filter(o => o.status === 'completed' && o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    return {
      labels: ['Cash', 'Card'],
      datasets: [{
        data: [cash / 100, card / 100],
        backgroundColor: ['hsl(25, 50%, 28%)', 'hsl(20, 70%, 50%)'],
        borderWidth: 0,
      }]
    };
  }, [orders]);

  // Cashier orders
  const cashierData = useMemo(() => {
    const sales: Record<string, number> = {};
    orders.filter(o => o.status === 'completed').forEach(o => {
      sales[o.cashierName] = (sales[o.cashierName] || 0) + 1;
    });
    return {
      labels: Object.keys(sales),
      datasets: [{
        label: 'Orders',
        data: Object.values(sales),
        backgroundColor: 'hsl(20, 70%, 50%)',
        borderRadius: 4,
      }]
    };
  }, [orders]);

  // Low stock products
  const lowStockProducts = products.filter(p => p.active && p.stock <= p.lowStockThreshold);

  // Recent orders
  const recentOrders = orders.filter(o => o.status === 'completed').slice(0, 10);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => `$${v}` } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } }
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Overview of your coffee business</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Total Revenue</p>
            <p className="text-xl font-bold mt-1">{formatPrice(kpis.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Today</p>
            <p className="text-xl font-bold mt-1 text-[hsl(var(--accent))]">{formatPrice(kpis.todayRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Orders</p>
            <p className="text-xl font-bold mt-1">{kpis.ordersCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Avg Order</p>
            <p className="text-xl font-bold mt-1">{formatPrice(kpis.avgOrderValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Items Sold</p>
            <p className="text-xl font-bold mt-1">{kpis.totalItemsSold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Low Stock</p>
            <p className="text-xl font-bold mt-1">{kpis.lowStockCount > 0 ? <span className="text-[hsl(var(--destructive))]">{kpis.lowStockCount}</span> : '0'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">Shifts</p>
            <p className="text-xl font-bold mt-1">{kpis.closedShifts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
            <Tabs value={revenuePeriod} onValueChange={(v: string) => setRevenuePeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="daily" activeValue={revenuePeriod} onValueChange={(v: string) => setRevenuePeriod(v as any)}>Daily</TabsTrigger>
                <TabsTrigger value="weekly" activeValue={revenuePeriod} onValueChange={(v: string) => setRevenuePeriod(v as any)}>Weekly</TabsTrigger>
                <TabsTrigger value="monthly" activeValue={revenuePeriod} onValueChange={(v: string) => setRevenuePeriod(v as any)}>Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={revenueData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Category Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.qty} sold</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Split */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={paymentData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>{order.cashierName}</TableCell>
                    <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-[hsl(var(--muted-foreground))] py-4">All products are well stocked! ✓</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-md bg-[hsl(var(--destructive))]/5 border border-[hsl(var(--destructive))]/20">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Threshold: {p.lowStockThreshold}</p>
                    </div>
                    <Badge variant="destructive">{p.stock} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders per cashier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders per Cashier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <Bar data={cashierData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
