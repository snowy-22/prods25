'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Building2,
  ChevronDown,
  Link2,
  Package,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Settings,
  Zap,
  Users,
  FileText,
  Truck,
  CreditCard
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface EnterpriseMenuProps {
  isExpanded?: boolean;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: string | number;
  badgeColor?: string;
  children?: MenuItem[];
}

const enterpriseMenuItems: MenuItem[] = [
  {
    id: 'enterprise',
    label: 'Enterprise Merkezi',
    icon: Building2,
    children: [
      {
        id: 'overview',
        label: 'Genel Bakış',
        icon: BarChart3,
        href: '/enterprise',
      },
      {
        id: 'integrations',
        label: 'Entegrasyonlar',
        icon: Link2,
        href: '/enterprise?tab=integrations',
        badge: 6,
        badgeColor: 'bg-blue-500',
      },
      {
        id: 'warehouse',
        label: 'Depo Yönetimi',
        icon: Warehouse,
        href: '/enterprise?tab=warehouse',
        badge: 3,
        badgeColor: 'bg-purple-500',
      },
      {
        id: 'orders',
        label: 'Sipariş Merkezi',
        icon: ShoppingCart,
        href: '/enterprise?tab=orders',
        badge: 12,
        badgeColor: 'bg-orange-500',
      },
      {
        id: 'b2b',
        label: 'B2B Portal',
        icon: Users,
        href: '/enterprise?tab=b2b',
        badge: 45,
        badgeColor: 'bg-green-500',
      },
    ],
  },
  {
    id: 'marketplace',
    label: 'Pazaryerleri',
    icon: Package,
    children: [
      {
        id: 'trendyol',
        label: 'Trendyol',
        icon: Zap,
        href: '/enterprise/marketplace/trendyol',
      },
      {
        id: 'hepsiburada',
        label: 'Hepsiburada',
        icon: Zap,
        href: '/enterprise/marketplace/hepsiburada',
      },
      {
        id: 'n11',
        label: 'N11',
        icon: Zap,
        href: '/enterprise/marketplace/n11',
      },
      {
        id: 'amazon',
        label: 'Amazon TR',
        icon: Zap,
        href: '/enterprise/marketplace/amazon',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finans & Muhasebe',
    icon: CreditCard,
    children: [
      {
        id: 'invoices',
        label: 'E-Fatura',
        icon: FileText,
        href: '/enterprise/finance/invoices',
      },
      {
        id: 'accounting',
        label: 'Muhasebe',
        icon: BarChart3,
        href: '/enterprise/finance/accounting',
      },
    ],
  },
  {
    id: 'shipping',
    label: 'Kargo & Lojistik',
    icon: Truck,
    children: [
      {
        id: 'shipments',
        label: 'Gönderiler',
        icon: Package,
        href: '/enterprise/shipping/shipments',
      },
      {
        id: 'tracking',
        label: 'Takip',
        icon: BarChart3,
        href: '/enterprise/shipping/tracking',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    icon: Settings,
    href: '/enterprise/settings',
  },
];

export function EnterpriseMenu({ isExpanded = true, className }: EnterpriseMenuProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = React.useState<string[]>(['enterprise']);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/enterprise') return pathname === '/enterprise';
    return pathname?.startsWith(href) || false;
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.includes(item.id);
    const active = isActive(item.href);

    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isOpen}
          onOpenChange={() => toggleMenu(item.id)}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-muted/80',
                depth === 0 ? 'text-foreground' : 'text-muted-foreground',
                isExpanded ? '' : 'justify-center'
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', depth === 0 && 'h-5 w-5')} />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </>
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn('ml-4 mt-1 space-y-1', !isExpanded && 'ml-0')}
                >
                  {item.children?.map(child => renderMenuItem(child, depth + 1))}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '#'}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          isExpanded ? '' : 'justify-center'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {isExpanded && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full text-white',
                  item.badgeColor || 'bg-muted-foreground'
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <nav className={cn('space-y-2', className)}>
      {enterpriseMenuItems.map(item => renderMenuItem(item))}
    </nav>
  );
}

// Compact version for secondary sidebar
export function EnterpriseMenuCompact() {
  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Enterprise
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { href: '/enterprise', icon: BarChart3, label: 'Özet' },
          { href: '/enterprise?tab=integrations', icon: Link2, label: 'Entegrasyon' },
          { href: '/enterprise?tab=warehouse', icon: Warehouse, label: 'Depo' },
          { href: '/enterprise?tab=orders', icon: ShoppingCart, label: 'Sipariş' },
          { href: '/enterprise?tab=b2b', icon: Users, label: 'B2B' },
          { href: '/enterprise/settings', icon: Settings, label: 'Ayarlar' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors text-center"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// For use in header or top navigation
export function EnterpriseDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Building2 className="h-5 w-5" />
        <span className="font-medium">Enterprise</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-popover border rounded-xl shadow-lg z-50 p-2"
            >
              <EnterpriseMenu isExpanded />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
