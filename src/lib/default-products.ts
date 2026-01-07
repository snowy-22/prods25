/**
 * Default E-Commerce Products
 * Lazy loaded to reduce initial bundle size
 */

import { Product } from './ecommerce-types';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'premium-video-course',
    name: 'Premium Video Kursu',
    description: 'React ve Next.js ile modern web geliştirme',
    price: 499.99,
    currency: 'TRY',
    category: 'Eğitim',
    stock: 100,
    image: '/api/placeholder/400/300',
    seller: {
      id: 'seller-1',
      name: 'Ahmet Yılmaz',
      rating: 4.8,
      avatar: '/api/placeholder/40/40'
    },
    rating: 4.9,
    reviewCount: 127,
    tags: ['React', 'Next.js', 'Web Development'],
    variants: [
      { id: 'v1', name: 'Temel', price: 299.99, stock: 50 },
      { id: 'v2', name: 'İleri Seviye', price: 499.99, stock: 50 }
    ],
    discounts: [
      { type: 'percentage', value: 20, condition: 'first-time-buyer' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'designer-mouse-pad',
    name: 'Designer Mouse Pad',
    description: 'Ergonomik ve şık tasarım',
    price: 149.99,
    currency: 'TRY',
    category: 'Aksesuar',
    stock: 50,
    image: '/api/placeholder/400/300',
    seller: {
      id: 'seller-2',
      name: 'Zeynep Kaya',
      rating: 4.7,
      avatar: '/api/placeholder/40/40'
    },
    rating: 4.6,
    reviewCount: 89,
    tags: ['Aksesuar', 'Gaming', 'Office'],
    variants: [
      { id: 'v1', name: 'Siyah', price: 149.99, stock: 25 },
      { id: 'v2', name: 'Beyaz', price: 149.99, stock: 25 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ui-ux-template-pack',
    name: 'UI/UX Template Pack',
    description: '50+ profesyonel tasarım şablonu',
    price: 299.99,
    currency: 'TRY',
    category: 'Tasarım',
    stock: 200,
    image: '/api/placeholder/400/300',
    seller: {
      id: 'seller-3',
      name: 'Mehmet Demir',
      rating: 4.9,
      avatar: '/api/placeholder/40/40'
    },
    rating: 4.8,
    reviewCount: 156,
    tags: ['UI', 'UX', 'Templates', 'Figma'],
    discounts: [
      { type: 'percentage', value: 30, condition: 'bundle' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mechanical-keyboard',
    name: 'Mechanical Keyboard',
    description: 'RGB aydınlatmalı mekanik klavye',
    price: 899.99,
    currency: 'TRY',
    category: 'Donanım',
    stock: 30,
    image: '/api/placeholder/400/300',
    seller: {
      id: 'seller-1',
      name: 'Ahmet Yılmaz',
      rating: 4.8,
      avatar: '/api/placeholder/40/40'
    },
    rating: 4.7,
    reviewCount: 203,
    tags: ['Keyboard', 'Gaming', 'RGB'],
    variants: [
      { id: 'v1', name: 'Cherry MX Red', price: 899.99, stock: 15 },
      { id: 'v2', name: 'Cherry MX Blue', price: 899.99, stock: 15 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ai-chatbot-kit',
    name: 'AI Chatbot Kit',
    description: 'Hazır AI chatbot çözümleri',
    price: 699.99,
    currency: 'TRY',
    category: 'Software',
    stock: 75,
    image: '/api/placeholder/400/300',
    seller: {
      id: 'seller-4',
      name: 'Ayşe Şahin',
      rating: 4.6,
      avatar: '/api/placeholder/40/40'
    },
    rating: 4.5,
    reviewCount: 92,
    tags: ['AI', 'Chatbot', 'Automation'],
    discounts: [
      { type: 'fixed', value: 100, condition: 'launch-offer' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'webcam-4k',
    name: 'Webcam 4K',
    description: 'Profesyonel yayın kalitesi',
    price: 1299.99,
    currency: 'TRY',
    category: 'Donanım',
    stock: 20,
    image: '/api/placeholder/400/300',
    seller: {
      id: 'seller-2',
      name: 'Zeynep Kaya',
      rating: 4.7,
      avatar: '/api/placeholder/40/40'
    },
    rating: 4.8,
    reviewCount: 174,
    tags: ['Webcam', 'Streaming', '4K'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
