'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { UserManagement } from '@/components/admin/user-management';

export default function AdminUsersPage() {
  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage user roles and permissions"
    >
      <div className="p-6">
        <UserManagement />
      </div>
    </AdminLayout>
  );
}
