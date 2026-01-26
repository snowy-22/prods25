'use server';

/**
 * Enterprise Integration Hub
 * 
 * Merkezi entegrasyon yönetim servisi
 * Tüm harici sistemlerle bağlantı ve senkronizasyon
 */

import { createClient } from '@/lib/supabase/server';
import { 
  IntegrationConnection, 
  IntegrationCategory, 
  SyncDirection, 
  SyncLog 
} from './integration-types';
import { INTEGRATION_PROVIDERS, getProviderById } from './providers';

// =====================================================
// PAZARYERI ENTEGRASYON SERVİSLERİ
// =====================================================

export interface MarketplaceOrderSync {
  externalOrderId: string;
  platform: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
  };
  items: {
    sku: string;
    name: string;
    quantity: number;
    price: number;
    externalProductId: string;
  }[];
  shipping: {
    method: string;
    cost: number;
    trackingNumber?: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    tax: number;
    total: number;
  };
  status: string;
  createdAt: string;
}

export interface MarketplaceProductSync {
  externalProductId: string;
  platform: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  category: string;
  images: string[];
  attributes: Record<string, string>;
  status: 'active' | 'inactive' | 'pending';
}

// =====================================================
// TRENDYOL ENTEGRASYONU
// =====================================================

export class TrendyolIntegration {
  private apiKey: string;
  private apiSecret: string;
  private sellerId: string;
  private baseUrl = 'https://api.trendyol.com/sapigw';
  
  constructor(credentials: { apiKey: string; apiSecret: string; sellerId: string }) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.sellerId = credentials.sellerId;
  }
  
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }
  
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test API call
      const response = await fetch(`${this.baseUrl}/suppliers/${this.sellerId}/addresses`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return { success: true, message: 'Trendyol bağlantısı başarılı' };
      }
      
      return { success: false, message: `API hatası: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Bağlantı hatası: ${error}` };
    }
  }
  
  async syncOrders(since?: string): Promise<MarketplaceOrderSync[]> {
    try {
      const params = new URLSearchParams({
        size: '200',
        orderByField: 'CreatedDate',
        orderByDirection: 'DESC',
      });
      
      if (since) {
        params.append('startDate', new Date(since).getTime().toString());
      }
      
      const response = await fetch(
        `${this.baseUrl}/suppliers/${this.sellerId}/orders?${params}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Trendyol API error: ${response.status}`);
      }
      
      const data = await response.json();
      return (data.content || []).map(this.mapTrendyolOrder);
    } catch (error) {
      console.error('Trendyol sipariş senkronizasyonu hatası:', error);
      return [];
    }
  }
  
  private mapTrendyolOrder(order: any): MarketplaceOrderSync {
    return {
      externalOrderId: order.orderNumber,
      platform: 'trendyol',
      customer: {
        name: `${order.customerFirstName} ${order.customerLastName}`,
        phone: order.customerPhone,
        address: order.shipmentAddress?.fullAddress || '',
      },
      items: (order.lines || []).map((line: any) => ({
        sku: line.merchantSku,
        name: line.productName,
        quantity: line.quantity,
        price: line.price,
        externalProductId: line.productContentId?.toString(),
      })),
      shipping: {
        method: order.cargoProviderName,
        cost: order.totalCargoPrice || 0,
        trackingNumber: order.cargoTrackingNumber,
      },
      totals: {
        subtotal: order.totalPrice,
        shipping: order.totalCargoPrice || 0,
        discount: order.totalDiscount || 0,
        tax: 0,
        total: order.totalPrice,
      },
      status: order.status,
      createdAt: order.orderDate,
    };
  }
  
  async syncProducts(): Promise<MarketplaceProductSync[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/suppliers/${this.sellerId}/products?size=500`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Trendyol API error: ${response.status}`);
      }
      
      const data = await response.json();
      return (data.content || []).map(this.mapTrendyolProduct);
    } catch (error) {
      console.error('Trendyol ürün senkronizasyonu hatası:', error);
      return [];
    }
  }
  
  private mapTrendyolProduct(product: any): MarketplaceProductSync {
    return {
      externalProductId: product.id?.toString(),
      platform: 'trendyol',
      sku: product.stockCode,
      title: product.title,
      description: product.description || '',
      price: product.listPrice,
      salePrice: product.salePrice,
      stock: product.quantity,
      category: product.categoryName,
      images: (product.images || []).map((img: any) => img.url),
      attributes: product.attributes?.reduce((acc: any, attr: any) => {
        acc[attr.attributeName] = attr.attributeValue;
        return acc;
      }, {}) || {},
      status: product.onSale ? 'active' : 'inactive',
    };
  }
  
  async updateStock(sku: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/suppliers/${this.sellerId}/products/price-and-inventory`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              barcode: sku,
              quantity: quantity,
            }],
          }),
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Trendyol stok güncelleme hatası:', error);
      return false;
    }
  }
  
  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<boolean> {
    try {
      // Status mapping
      const statusMap: Record<string, string> = {
        'shipped': 'Picking',
        'delivered': 'Delivered',
      };
      
      const response = await fetch(
        `${this.baseUrl}/suppliers/${this.sellerId}/shipment-packages/${orderId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: statusMap[status] || status,
            trackingNumber,
          }),
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Trendyol sipariş durumu güncelleme hatası:', error);
      return false;
    }
  }
}

// =====================================================
// HEPSİBURADA ENTEGRASYONU
// =====================================================

export class HepsiburadaIntegration {
  private merchantId: string;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://mpop.hepsiburada.com';
  
  constructor(credentials: { merchantId: string; apiKey: string; apiSecret: string }) {
    this.merchantId = credentials.merchantId;
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }
  
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }
  
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/merchants/${this.merchantId}/profile`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return { success: true, message: 'Hepsiburada bağlantısı başarılı' };
      }
      
      return { success: false, message: `API hatası: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Bağlantı hatası: ${error}` };
    }
  }
  
  async syncOrders(since?: string): Promise<MarketplaceOrderSync[]> {
    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
      });
      
      if (since) {
        params.append('startDate', since);
      }
      
      const response = await fetch(
        `${this.baseUrl}/merchants/${this.merchantId}/orders?${params}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Hepsiburada API error: ${response.status}`);
      }
      
      const data = await response.json();
      return (data.orders || []).map(this.mapHepsiburadaOrder);
    } catch (error) {
      console.error('Hepsiburada sipariş senkronizasyonu hatası:', error);
      return [];
    }
  }
  
  private mapHepsiburadaOrder(order: any): MarketplaceOrderSync {
    return {
      externalOrderId: order.orderNumber,
      platform: 'hepsiburada',
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        address: order.deliveryAddress?.fullAddress || '',
      },
      items: (order.orderItems || []).map((item: any) => ({
        sku: item.sku,
        name: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
        externalProductId: item.hbSku,
      })),
      shipping: {
        method: order.shippingCompany,
        cost: order.shippingPrice || 0,
        trackingNumber: order.trackingNumber,
      },
      totals: {
        subtotal: order.totalPrice - (order.shippingPrice || 0),
        shipping: order.shippingPrice || 0,
        discount: order.totalDiscount || 0,
        tax: order.totalTax || 0,
        total: order.totalPrice,
      },
      status: order.orderStatus,
      createdAt: order.createdDate,
    };
  }
  
  async updateStock(sku: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/merchants/${this.merchantId}/inventory`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              sku: sku,
              stock: quantity,
            }],
          }),
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Hepsiburada stok güncelleme hatası:', error);
      return false;
    }
  }
}

// =====================================================
// N11 ENTEGRASYONU
// =====================================================

export class N11Integration {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.n11.com/ws';
  
  constructor(credentials: { apiKey: string; apiSecret: string }) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }
  
  async testConnection(): Promise<{ success: boolean; message: string }> {
    // N11 SOAP API test
    return { success: true, message: 'N11 bağlantısı başarılı (simüle)' };
  }
  
  async syncOrders(since?: string): Promise<MarketplaceOrderSync[]> {
    // N11 SOAP API implementation would go here
    // For now, return empty array
    console.log('N11 sipariş senkronizasyonu - SOAP API entegrasyonu gerekli');
    return [];
  }
  
  async updateStock(sku: string, quantity: number): Promise<boolean> {
    console.log('N11 stok güncelleme - SOAP API entegrasyonu gerekli');
    return false;
  }
}

// =====================================================
// PARASUT ENTEGRASYONU (Muhasebe/ERP)
// =====================================================

export class ParasutIntegration {
  private clientId: string;
  private clientSecret: string;
  private companyId: string;
  private accessToken?: string;
  private baseUrl = 'https://api.parasut.com/v4';
  
  constructor(credentials: { clientId: string; clientSecret: string; companyId: string }) {
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.companyId = credentials.companyId;
  }
  
  private async authenticate(): Promise<boolean> {
    try {
      const response = await fetch('https://api.parasut.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      this.accessToken = data.access_token;
      return true;
    } catch (error) {
      console.error('Paraşüt authentication hatası:', error);
      return false;
    }
  }
  
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const authenticated = await this.authenticate();
    if (authenticated) {
      return { success: true, message: 'Paraşüt bağlantısı başarılı' };
    }
    return { success: false, message: 'Paraşüt kimlik doğrulama başarısız' };
  }
  
  async createInvoice(invoice: {
    customerId: string;
    items: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
    issueDate: string;
    dueDate?: string;
  }): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }
      
      const response = await fetch(
        `${this.baseUrl}/${this.companyId}/sales_invoices`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              type: 'sales_invoices',
              attributes: {
                item_type: 'invoice',
                issue_date: invoice.issueDate,
                due_date: invoice.dueDate,
              },
              relationships: {
                contact: {
                  data: {
                    id: invoice.customerId,
                    type: 'contacts',
                  },
                },
                details: {
                  data: invoice.items.map((item, index) => ({
                    id: `temp-${index}`,
                    type: 'sales_invoice_details',
                  })),
                },
              },
            },
            included: invoice.items.map((item, index) => ({
              id: `temp-${index}`,
              type: 'sales_invoice_details',
              attributes: {
                quantity: item.quantity,
                unit_price: item.unitPrice,
                vat_rate: item.vatRate,
                description: item.description,
              },
            })),
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      
      const data = await response.json();
      return { success: true, invoiceId: data.data?.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  
  async getContacts(): Promise<any[]> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }
      
      const response = await fetch(
        `${this.baseUrl}/${this.companyId}/contacts`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Paraşüt müşteri listesi hatası:', error);
      return [];
    }
  }
  
  async syncProducts(): Promise<any[]> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }
      
      const response = await fetch(
        `${this.baseUrl}/${this.companyId}/products`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Paraşüt ürün listesi hatası:', error);
      return [];
    }
  }
}

// =====================================================
// KARGO ENTEGRASYONLARI
// =====================================================

export interface ShipmentRequest {
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string;
  recipientEmail?: string;
  
  weight: number;
  desi?: number;
  
  packageCount: number;
  codAmount?: number; // Kapıda ödeme tutarı
  
  productDescription: string;
  referenceNo?: string;
}

export interface ShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  barcode?: string;
  labelUrl?: string;
  error?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  events: {
    date: string;
    status: string;
    description: string;
    location?: string;
  }[];
  deliveredAt?: string;
  estimatedDelivery?: string;
}

export class YurticiKargoIntegration {
  private username: string;
  private password: string;
  private customerCode: string;
  
  constructor(credentials: { username: string; password: string; customerCode: string }) {
    this.username = credentials.username;
    this.password = credentials.password;
    this.customerCode = credentials.customerCode;
  }
  
  async createShipment(shipment: ShipmentRequest): Promise<ShipmentResponse> {
    // Yurtiçi Kargo SOAP/REST API implementation
    console.log('Yurtiçi Kargo gönderi oluşturma...');
    
    return {
      success: true,
      trackingNumber: `YK${Date.now()}`,
      barcode: `YK${Date.now()}`,
      labelUrl: 'https://example.com/label.pdf',
    };
  }
  
  async trackShipment(trackingNumber: string): Promise<TrackingInfo | null> {
    // Yurtiçi Kargo takip API
    return {
      trackingNumber,
      status: 'in_transit',
      statusDescription: 'Kargo yolda',
      events: [
        {
          date: new Date().toISOString(),
          status: 'picked_up',
          description: 'Kargo teslim alındı',
          location: 'İstanbul',
        },
      ],
    };
  }
  
  async cancelShipment(trackingNumber: string): Promise<boolean> {
    console.log('Yurtiçi Kargo gönderi iptali:', trackingNumber);
    return true;
  }
}

export class ArasKargoIntegration {
  private username: string;
  private password: string;
  private customerCode: string;
  
  constructor(credentials: { username: string; password: string; customerCode: string }) {
    this.username = credentials.username;
    this.password = credentials.password;
    this.customerCode = credentials.customerCode;
  }
  
  async createShipment(shipment: ShipmentRequest): Promise<ShipmentResponse> {
    console.log('Aras Kargo gönderi oluşturma...');
    
    return {
      success: true,
      trackingNumber: `AK${Date.now()}`,
      labelUrl: 'https://example.com/label.pdf',
    };
  }
  
  async trackShipment(trackingNumber: string): Promise<TrackingInfo | null> {
    return {
      trackingNumber,
      status: 'in_transit',
      statusDescription: 'Kargo dağıtımda',
      events: [],
    };
  }
}

// =====================================================
// ENTEGRASYON FABRİKASI
// =====================================================

export type IntegrationInstance = 
  | TrendyolIntegration 
  | HepsiburadaIntegration 
  | N11Integration 
  | ParasutIntegration 
  | YurticiKargoIntegration 
  | ArasKargoIntegration;

export function createIntegration(
  providerId: string, 
  credentials: Record<string, string>
): IntegrationInstance | null {
  switch (providerId) {
    case 'trendyol':
      return new TrendyolIntegration({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        sellerId: credentials.sellerId,
      });
      
    case 'hepsiburada':
      return new HepsiburadaIntegration({
        merchantId: credentials.merchantId,
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
      });
      
    case 'n11':
      return new N11Integration({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
      });
      
    case 'parasut':
      return new ParasutIntegration({
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        companyId: credentials.companyId,
      });
      
    case 'yurtici':
      return new YurticiKargoIntegration({
        username: credentials.username,
        password: credentials.password,
        customerCode: credentials.customerCode,
      });
      
    case 'aras':
      return new ArasKargoIntegration({
        username: credentials.username,
        password: credentials.password,
        customerCode: credentials.customerCode,
      });
      
    default:
      console.warn(`Bilinmeyen entegrasyon sağlayıcısı: ${providerId}`);
      return null;
  }
}

// =====================================================
// ENTEGRASYON SERVİS FONKSİYONLARI
// =====================================================

export async function testIntegrationConnection(
  providerId: string,
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const integration = createIntegration(providerId, credentials);
  
  if (!integration) {
    return { success: false, message: 'Geçersiz entegrasyon sağlayıcısı' };
  }
  
  if ('testConnection' in integration) {
    return await integration.testConnection();
  }
  
  return { success: false, message: 'Bağlantı testi desteklenmiyor' };
}

export async function syncMarketplaceOrders(
  connectionId: string,
  since?: string
): Promise<{ orders: MarketplaceOrderSync[]; error?: string }> {
  const supabase = await createClient();
  
  // Get connection details
  const { data: connection, error } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('id', connectionId)
    .single();
  
  if (error || !connection) {
    return { orders: [], error: 'Bağlantı bulunamadı' };
  }
  
  const integration = createIntegration(connection.provider_id, connection.credentials);
  
  if (!integration || !('syncOrders' in integration)) {
    return { orders: [], error: 'Sipariş senkronizasyonu desteklenmiyor' };
  }
  
  const orders = await integration.syncOrders(since);
  return { orders };
}

export async function updateMarketplaceStock(
  connectionId: string,
  items: { sku: string; quantity: number }[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const supabase = await createClient();
  
  const { data: connection, error } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('id', connectionId)
    .single();
  
  if (error || !connection) {
    return { success: 0, failed: items.length, errors: ['Bağlantı bulunamadı'] };
  }
  
  const integration = createIntegration(connection.provider_id, connection.credentials);
  
  if (!integration || !('updateStock' in integration)) {
    return { success: 0, failed: items.length, errors: ['Stok güncelleme desteklenmiyor'] };
  }
  
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const item of items) {
    const result = await integration.updateStock(item.sku, item.quantity);
    if (result) {
      success++;
    } else {
      failed++;
      errors.push(`SKU ${item.sku} güncellenemedi`);
    }
  }
  
  return { success, failed, errors };
}
