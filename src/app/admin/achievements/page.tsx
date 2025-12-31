'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { AchievementVerify } from '@/components/admin/achievement-verify';

export default function AdminAchievementsPage() {
  return (
    <AdminLayout
      title="Achievement Verification"
      subtitle="Review and approve user achievements"
    >
      <div className="p-6">
        <AchievementVerify />
      </div>
    </AdminLayout>
  );
}
