'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { SalesDashboard } from '@/components/admin/sales-dashboard';

export default function AdminSalesPage() {
  return (
    <AdminLayout
      title="Sales Analytics"
      subtitle="Monitor reservations and purchases"
    >
      <div className="p-6">
        <SalesDashboard />
      </div>
    </AdminLayout>
  );
}
