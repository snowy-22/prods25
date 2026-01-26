// Enterprise Integration Dashboard Components
// Export all dashboard components from a single entry point

export { IntegrationDashboard } from './integration-dashboard';
export { WarehouseDashboard } from './warehouse-dashboard';
export { OrderDashboard } from './order-dashboard';
export { B2BDashboard } from './b2b-dashboard';
export { EnterpriseMenu, EnterpriseMenuCompact, EnterpriseDropdown } from './enterprise-menu';

// Re-export types from lib
export type { 
  Integration, 
  IntegrationCategory, 
  IntegrationProvider,
  IntegrationStatus,
  SyncConfig,
  SyncStatus,
  IntegrationCredentials,
  IntegrationWebhook,
  IntegrationStats,
  IntegrationError
} from '@/lib/integrations/integration-types';

export type {
  Warehouse,
  WarehouseLocation,
  StockLevel,
  StockMovement,
  TransferOrder,
  WarehouseStats
} from '@/lib/integrations/warehouse-types';

export type {
  B2BCustomer,
  CustomerTier,
  CreditLimit,
  PaymentTerms,
  PriceList,
  PriceRule,
  B2BOrder,
  Quote,
  QuoteLine
} from '@/lib/integrations/b2b-types';

export type {
  Order,
  OrderStatus,
  OrderItem,
  OrderPayment,
  OrderShipment,
  OrderReturn,
  OrderNote,
  EInvoice,
  OrderStats
} from '@/lib/integrations/order-types';

// Provider registry
export { 
  INTEGRATION_PROVIDERS,
  getProvidersByCategory,
  getProviderById
} from '@/lib/integrations/providers';

// Integration manager
export { integrationManager } from '@/lib/integrations/integration-manager';

// Integration hub (API clients)
export { 
  IntegrationHub,
  TrendyolClient,
  HepsiburadaClient,
  ParasutClient,
  KargoClient
} from '@/lib/integrations/integration-hub';
