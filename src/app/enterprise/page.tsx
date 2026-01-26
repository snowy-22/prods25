'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Building2, 
  ShoppingCart,
  Link2,
  Settings,
  BarChart3
} from 'lucide-react';

// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

const IntegrationDashboard = dynamic(
  () => import('@/components/integrations/integration-dashboard').then(mod => mod.IntegrationDashboard),
  { loading: () => <DashboardSkeleton /> }
);

const WarehouseDashboard = dynamic(
  () => import('@/components/integrations/warehouse-dashboard').then(mod => mod.WarehouseDashboard),
  { loading: () => <DashboardSkeleton /> }
);

const OrderDashboard = dynamic(
  () => import('@/components/integrations/order-dashboard').then(mod => mod.OrderDashboard),
  { loading: () => <DashboardSkeleton /> }
);

const B2BDashboard = dynamic(
  () => import('@/components/integrations/b2b-dashboard').then(mod => mod.B2BDashboard),
  { loading: () => <DashboardSkeleton /> }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-muted rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}

export default function EnterpriseDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Enterprise E-Ticaret Merkezi</h1>
          <p className="text-muted-foreground mt-1">
            Tüm entegrasyonlar, depolar, siparişler ve B2B müşteriler tek panelden
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Entegrasyonlar</span>
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="gap-2">
              <Warehouse className="h-4 w-4" />
              <span className="hidden sm:inline">Depolar</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Siparişler</span>
            </TabsTrigger>
            <TabsTrigger value="b2b" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">B2B Portal</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OverviewDashboard onNavigate={setActiveTab} />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <IntegrationDashboard />
          </TabsContent>

          {/* Warehouse Tab */}
          <TabsContent value="warehouse">
            <WarehouseDashboard />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrderDashboard />
          </TabsContent>

          {/* B2B Tab */}
          <TabsContent value="b2b">
            <B2BDashboard />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Overview Dashboard Component
function OverviewDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const quickStats = [
    { label: 'Aktif Entegrasyonlar', value: '6', icon: Link2, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    { label: 'Toplam Depolar', value: '3', icon: Warehouse, color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
    { label: 'Bekleyen Siparişler', value: '12', icon: ShoppingCart, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
    { label: 'B2B Müşteriler', value: '45', icon: Building2, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  ];

  const quickActions = [
    { 
      title: 'Entegrasyonları Yönet',
      description: 'Pazaryeri, ERP ve kargo entegrasyonları',
      icon: Link2,
      tab: 'integrations',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      title: 'Depo Yönetimi',
      description: 'Çoklu depo ve stok takibi',
      icon: Warehouse,
      tab: 'warehouse',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      title: 'Sipariş Merkezi',
      description: 'Tüm kanallardan siparişler',
      icon: ShoppingCart,
      tab: 'orders',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      title: 'B2B Portal',
      description: 'Kurumsal müşteriler ve teklifler',
      icon: Building2,
      tab: 'b2b',
      color: 'from-green-500 to-green-600'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            onClick={() => onNavigate(action.tab)}
            className="text-left bg-card border rounded-xl p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} mb-4`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {action.description}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Son Aktiviteler
        </h3>
        <div className="space-y-3">
          {[
            { time: '2 dk önce', event: 'Trendyol\'dan 3 yeni sipariş alındı', type: 'order' },
            { time: '15 dk önce', event: 'Hepsiburada stok senkronizasyonu tamamlandı', type: 'sync' },
            { time: '1 saat önce', event: 'Demir Teknoloji Ltd. yeni teklif oluşturuldu', type: 'quote' },
            { time: '2 saat önce', event: 'Ana Depo\'dan Ankara Deposu\'na transfer başlatıldı', type: 'transfer' },
            { time: '3 saat önce', event: 'Yurtiçi Kargo entegrasyonu güncellendi', type: 'integration' },
          ].map((activity, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm flex-1">{activity.event}</span>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
