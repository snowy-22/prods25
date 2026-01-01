'use client';

import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalesCardWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

export function SalesCardWidget({ item, onUpdate }: SalesCardWidgetProps) {
  // Mock data - gerçek uygulamada Supabase'den çekilecek
  const salesData = item.metadata?.salesData || {
    totalRevenue: 124500,
    totalOrders: 342,
    averageOrderValue: 364.04,
    totalCustomers: 198,
    revenueChange: 12.5,
    ordersChange: 8.3,
    customersChange: -2.1
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  const getChangeBadge = (change: number) => {
    return (
      <Badge 
        variant={change >= 0 ? 'default' : 'destructive'}
        className="flex items-center gap-1"
      >
        {getChangeIcon(change)}
        {Math.abs(change)}%
      </Badge>
    );
  };

  const cards = [
    {
      title: 'Toplam Gelir',
      value: `₺${salesData.totalRevenue.toLocaleString('tr-TR')}`,
      icon: DollarSign,
      change: salesData.revenueChange,
      bgColor: 'bg-green-50 dark:bg-green-950',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Toplam Sipariş',
      value: salesData.totalOrders,
      icon: ShoppingCart,
      change: salesData.ordersChange,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Ortalama Sipariş Değeri',
      value: `₺${salesData.averageOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      change: null,
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Toplam Müşteri',
      value: salesData.totalCustomers,
      icon: Users,
      change: salesData.customersChange,
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      iconColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {cards.map((card, index) => (
        <Card key={index} className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-3xl font-bold">{card.value}</div>
              {card.change !== null && (
                <div className="flex items-center gap-2">
                  {getChangeBadge(card.change)}
                  <span className="text-xs text-muted-foreground">
                    geçen aya göre
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
