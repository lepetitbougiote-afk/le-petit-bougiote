import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { adminService } from '../../services/adminService';
import type { CustomerSummary, DashboardStats, Order } from '../../types';
import { formatDate, formatPrice } from '../../lib/utils';

type BestSeller = Awaited<ReturnType<typeof adminService.getBestSellingProducts>>[number];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    adminService.getDashboardStats().then(setStats);
    adminService.getRecentOrders().then(setRecentOrders);
    adminService.getBestSellingProducts().then(setBestSellers);
    adminService.getRecentCustomers().then(setRecentCustomers);
  }, []);

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">Admin dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Pilotage du restaurant</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Commandes du jour', stats?.todaysOrders ?? 0],
          ['En attente', stats?.pendingOrders ?? 0],
          ['CA estimé', formatPrice(stats?.revenueEstimate ?? 0)],
          ['Terminées', stats?.completedOrders ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[1.8rem] bg-white p-6">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.8rem] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Commandes récentes</h2>
            <StatusBadge>{stats?.openingStatus ?? '...'}</StatusBadge>
          </div>
          <div className="mt-6 grid gap-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-brand-cream p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{order.customerName}</p>
                    <p className="text-sm text-slate-500">{order.id} • {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-950">{formatPrice(order.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6">
          <div className="rounded-[1.8rem] bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Meilleures ventes</h2>
            <div className="mt-5 grid gap-3">
              {bestSellers.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-3xl bg-brand-cream px-4 py-3">
                  <span className="font-medium text-slate-800">{product.name}</span>
                  <StatusBadge>{product.soldCount} vendus</StatusBadge>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.8rem] bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Clients récents</h2>
            <div className="mt-5 grid gap-3">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="rounded-3xl bg-brand-cream px-4 py-3">
                  <p className="font-medium text-slate-900">{customer.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{customer.orderCount} commandes • {customer.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
