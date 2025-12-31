'use client';

import { AdminLayout, AdminNav, StatCard } from '@/components/admin/admin-layout';
import { BarChart3, ShieldCheck, Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Manage and monitor your platform"
    >
      <AdminNav />

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Users"
            value="1,234"
            change={12}
            icon={<Users className="w-8 h-8" />}
          />
          <StatCard
            label="Achievements Verified"
            value="856"
            change={8}
            icon={<ShieldCheck className="w-8 h-8" />}
          />
          <StatCard
            label="Total Revenue"
            value="$12,450"
            change={24}
            trend="up"
            icon={<TrendingUp className="w-8 h-8" />}
          />
          <StatCard
            label="Flagged Items"
            value="23"
            change={-5}
            trend="down"
            icon={<AlertCircle className="w-8 h-8" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Welcome to Admin Panel</h3>
          <p className="text-blue-800 mb-4">
            Use the navigation menu to access different admin features:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
            <li>✓ Achievement Verification - Review and approve user achievements</li>
            <li>✓ Sales Analytics - Monitor reservations and purchases</li>
            <li>✓ User Management - Manage roles and permissions</li>
            <li>✓ Content Moderation - Review flagged content</li>
          </ul>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Status */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Database Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Supabase Connection</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Tables</span>
                <span className="text-slate-900 font-medium">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">RLS Policies</span>
                <span className="text-slate-900 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">API Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Payments API</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Stripe Integration</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Webhook Handler</span>
                <span className="text-green-600 font-medium">✓ Running</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
