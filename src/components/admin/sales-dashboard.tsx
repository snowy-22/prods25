import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Calendar,
  Eye,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { AdminNav } from './admin-layout';

interface Reservation {
  id: string;
  user_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  participants: number;
  customer_name: string;
  customer_email: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  confirmation_code: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  payment_status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';
  stripe_payment_id: string;
  created_at: string;
  user?: {
    email: string;
  };
}

interface DailySales {
  date: string;
  reservations: number;
  reservationRevenue: number;
  purchases: number;
  purchaseRevenue: number;
  totalRevenue: number;
}

export function SalesDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredReservations, setFilteredReservations] =
    useState<Reservation[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'purchases'>(
    'overview'
  );
  const [selectedOrder, setSelectedOrder] = useState<Purchase | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch reservations
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (resError) throw resError;
        setReservations(resData || []);

        // Fetch purchases
        const { data: purData, error: purError } = await supabase
          .from('purchases')
          .select(`
            *,
            user:user_id (
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (purError) throw purError;
        setPurchases(purData || []);

        // Calculate daily sales
        const sales = calculateDailySales(resData || [], purData || []);
        setDailySales(sales);
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter reservations
  useEffect(() => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, filterStatus]);

  // Filter purchases
  useEffect(() => {
    let filtered = purchases;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.confirmation_code
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.payment_status === filterStatus);
    }

    setFilteredPurchases(filtered);
  }, [purchases, searchTerm, filterStatus]);

  const calculateDailySales = (
    reservations: Reservation[],
    purchases: Purchase[]
  ): DailySales[] => {
    const salesMap = new Map<string, DailySales>();

    // Process reservations
    reservations.forEach((r) => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!salesMap.has(date)) {
        salesMap.set(date, {
          date,
          reservations: 0,
          reservationRevenue: 0,
          purchases: 0,
          purchaseRevenue: 0,
          totalRevenue: 0,
        });
      }
      const sale = salesMap.get(date)!;
      sale.reservations++;
      sale.reservationRevenue += r.total_price;
      sale.totalRevenue += r.total_price;
    });

    // Process purchases
    purchases.forEach((p) => {
      if (p.payment_status === 'succeeded') {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        if (!salesMap.has(date)) {
          salesMap.set(date, {
            date,
            reservations: 0,
            reservationRevenue: 0,
            purchases: 0,
            purchaseRevenue: 0,
            totalRevenue: 0,
          });
        }
        const sale = salesMap.get(date)!;
        sale.purchases++;
        sale.purchaseRevenue += p.total;
        sale.totalRevenue += p.total;
      }
    });

    return Array.from(salesMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  };

  const handleRefund = async (purchase: Purchase) => {
    if (!purchase.stripe_payment_id) {
      alert('No Stripe payment ID found for this order');
      return;
    }

    setIsRefunding(true);
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeId: purchase.stripe_payment_id,
          purchaseId: purchase.id,
          reason: refundReason || 'Admin initiated refund',
        }),
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      // Update local purchase
      setPurchases(
        purchases.map((p) =>
          p.id === purchase.id
            ? { ...p, payment_status: 'cancelled' }
            : p
        )
      );

      setShowRefundDialog(false);
      setRefundReason('');
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Refund error:', error);
      alert('Failed to process refund');
    } finally {
      setIsRefunding(false);
    }
  };

  const totalRevenue = reservations.reduce((sum, r) => sum + r.total_price, 0) +
    purchases
      .filter((p) => p.payment_status === 'succeeded')
      .reduce((sum, p) => sum + p.total, 0);

  const confirmedReservations = reservations.filter(
    (r) => r.status === 'confirmed'
  ).length;
  const completedPurchases = purchases.filter(
    (p) => p.payment_status === 'succeeded'
  ).length;

  return (
    <div className="space-y-6">
      <AdminNav />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'reservations', label: 'Reservations' },
          { id: 'purchases', label: 'Purchases' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              icon={<Wallet className="w-8 h-8" />}
              color="blue"
            />
            <StatCard
              label="Confirmed Reservations"
              value={confirmedReservations}
              icon={<Calendar className="w-8 h-8" />}
              color="green"
            />
            <StatCard
              label="Completed Purchases"
              value={completedPurchases}
              icon={<ShoppingCart className="w-8 h-8" />}
              color="purple"
            />
            <StatCard
              label="Avg Order Value"
              value={`$${(totalRevenue / (confirmedReservations + completedPurchases) || 0).toFixed(2)}`}
              icon={<TrendingUp className="w-8 h-8" />}
              color="orange"
            />
          </div>

          {/* Daily Sales Chart */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Daily Sales</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Reservations
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Reservation Revenue
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Purchases
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Purchase Revenue
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No sales data available
                      </td>
                    </tr>
                  ) : (
                    dailySales.map((sale) => (
                      <tr
                        key={sale.date}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2 text-slate-900 font-medium">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {sale.reservations}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          ${sale.reservationRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {sale.purchases}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          ${sale.purchaseRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 font-bold text-slate-900">
                          ${sale.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Participants
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No reservations found
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {reservation.customer_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {reservation.customer_email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(reservation.reservation_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {reservation.start_time} - {reservation.end_time}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {reservation.participants}/{reservation.capacity}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        ${reservation.total_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            reservation.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : reservation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {reservation.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by confirmation code or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Confirmation Code
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Order Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                        {purchase.confirmation_code}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {purchase.user?.email || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        ${purchase.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            purchase.payment_status === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : purchase.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {purchase.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {purchase.order_status}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(purchase);
                            setShowRefundDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                          disabled={
                            purchase.payment_status !== 'succeeded'
                          }
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refund
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund order {selectedOrder?.confirmation_code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                ${selectedOrder?.total.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Reason for Refund
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={isRefunding}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRefund(selectedOrder!)}
              disabled={isRefunding}
            >
              {isRefunding ? 'Processing...' : 'Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorStyles[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-25">{icon}</div>
      </div>
    </div>
  );
}
