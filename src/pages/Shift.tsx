import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Separator, Label, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog } from '../components/ui';

export default function ShiftPage() {
  const { activeShift, openShift, closeShift, orders, currentUser } = useStore();
  const [openingCash, setOpeningCash] = useState('100.00');
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);

  const shiftOrders = useMemo(() => {
    if (!activeShift) return [];
    return orders.filter(o => o.shiftId === activeShift.id && o.status === 'completed');
  }, [activeShift, orders]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const totalCash = shiftOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
  const totalCard = shiftOrders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
  const totalIncome = totalCash + totalCard;
  const expectedCash = totalCash + (activeShift?.openingCash || 0);

  if (!activeShift) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Open Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Start your shift by recording the opening cash in the register.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Opening Cash ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={e => setOpeningCash(e.target.value)}
                />
              </div>
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={() => openShift(Math.round(parseFloat(openingCash || '0') * 100))}
              >
                Open Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Shift Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Active Shift</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Opened at {new Date(activeShift.openedAt).toLocaleString()} • {activeShift.cashierName}
          </p>
        </div>
        <Button variant="destructive" onClick={() => setCloseDialogOpen(true)}>
          Close Shift
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Invoices</p>
            <p className="text-2xl font-bold mt-1">{shiftOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Cash Sales</p>
            <p className="text-2xl font-bold mt-1">{formatPrice(totalCash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Card Sales</p>
            <p className="text-2xl font-bold mt-1">{formatPrice(totalCard)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Total Income</p>
            <p className="text-2xl font-bold mt-1 text-[hsl(var(--accent))]">{formatPrice(totalIncome)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Opening Cash</span>
              <span>{formatPrice(activeShift.openingCash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">+ Cash Sales</span>
              <span>{formatPrice(totalCash)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Expected in Drawer</span>
              <span>{formatPrice(expectedCash)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {shiftOrders.length === 0 ? (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-8">No invoices yet in this shift.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell>{order.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                    <TableCell>
                      <Badge variant={order.paymentMethod === 'cash' ? 'success' : 'secondary'}>
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Close Shift Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} title="Close Shift">
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-[hsl(var(--muted))] space-y-2 text-sm">
            <div className="flex justify-between"><span>Invoices:</span><span className="font-medium">{shiftOrders.length}</span></div>
            <div className="flex justify-between"><span>Cash Sales:</span><span className="font-medium">{formatPrice(totalCash)}</span></div>
            <div className="flex justify-between"><span>Card Sales:</span><span className="font-medium">{formatPrice(totalCard)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold"><span>Total Income:</span><span>{formatPrice(totalIncome)}</span></div>
            <div className="flex justify-between"><span>Opening Cash:</span><span>{formatPrice(activeShift.openingCash)}</span></div>
            <div className="flex justify-between font-semibold"><span>Expected Cash:</span><span>{formatPrice(expectedCash)}</span></div>
          </div>
          
          <div className="space-y-2">
            <Label>Counted Cash in Drawer ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={formatPrice(expectedCash)}
              value={countedCash}
              onChange={e => setCountedCash(e.target.value)}
            />
          </div>
          
          {countedCash && (
            <div className={`p-3 rounded-md text-sm font-medium ${
              parseFloat(countedCash) * 100 === expectedCash
                ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                : parseFloat(countedCash) * 100 > expectedCash
                ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                : 'bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]'
            }`}>
              Difference: {formatPrice(Math.round(parseFloat(countedCash || '0') * 100) - expectedCash)}
              {Math.round(parseFloat(countedCash || '0') * 100) === expectedCash ? ' (balanced!)' : ''}
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Any notes about this shift..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => {
              closeShift(Math.round(parseFloat(countedCash || '0') * 100), notes);
              setCloseDialogOpen(false);
            }}
          >
            Close Shift & Save
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
