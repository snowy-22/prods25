import React, { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, BarChart3, Users, ShieldCheck, Home, Sliders, TrendingUp } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Admin Dashboard Layout
 * Wraps admin pages with header, sidebar navigation, and auth guard
 */
export function AdminLayout({
  children,
  title = 'Admin Dashboard',
  subtitle,
  actions,
}: AdminLayoutProps) {
  const router = useRouter();
  const { user, username } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Check admin status on mount
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/auth');
        return;
      }

      // TODO: Check user role in database
      // For now, accept any logged-in user as demo
      setIsAdmin(true);
    };

    checkAdminStatus();
  }, [user, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!isAdmin && user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900">Access Denied</h1>
          <p className="text-red-700 mt-2">
            You do not have permission to access the admin panel.
          </p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  tv25.app Admin
                </h1>
                <p className="text-xs text-slate-500">Panel</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {actions}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {username || 'Admin'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs text-slate-500">
                    Logged in as {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button className="w-full flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="w-full flex items-center gap-2 text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-slate-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>
            tv25.app © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Admin Navigation Menu
 */
export function AdminNav() {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4 overflow-x-auto">
      <NavLink
        href="/admin"
        icon={<BarChart3 className="w-4 h-4" />}
        label="Dashboard"
      />
      <NavLink
        href="/admin/achievements"
        icon={<ShieldCheck className="w-4 h-4" />}
        label="Achievements"
      />
      <NavLink
        href="/admin/sales"
        icon={<BarChart3 className="w-4 h-4" />}
        label="Sales"
      />
      <NavLink
        href="/admin/users"
        icon={<Users className="w-4 h-4" />}
        label="Users"
      />
      <NavLink
        href="/admin/features"
        icon={<Sliders className="w-4 h-4" />}
        label="Özellik Planlama"
      />
      <NavLink
        href="/admin/analytics"
        icon={<TrendingUp className="w-4 h-4" />}
        label="Analytics"
      />
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
}

function NavLink({ href, icon, label }: NavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Stat Card for Dashboard
 */
export function StatCard({
  label,
  value,
  change,
  icon,
  trend = 'up',
}: {
  label: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <p
              className={`text-xs mt-1 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                  ? 'text-red-600'
                  : 'text-slate-600'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}%
            </p>
          )}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}

/**
 * Action Buttons Group
 */
export function AdminActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {children}
    </div>
  );
}
