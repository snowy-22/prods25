/**
 * Default E-Commerce Products
 * Lazy loaded to reduce initial bundle size
 */

export const DEFAULT_PRODUCTS: any[] = [
  {
    id: 'premium-video-course',
    title: 'Premium Video Kursu',
    name: 'Premium Video Kursu',
    description: 'React ve Next.js ile modern web geliştirme',
    price: 499.99,
    currency: 'TRY',
    category: 'Eğitim',
    stock: 100,
    image: '/api/placeholder/400/300',
    rating: 4.9,
    reviewCount: 127,
    tags: ['React', 'Next.js', 'Web Development'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'designer-mouse-pad',
    title: 'Designer Mouse Pad',
    name: 'Designer Mouse Pad',
    description: 'Ergonomik ve şık tasarım',
    price: 149.99,
    currency: 'TRY',
    category: 'Aksesuar',
    stock: 50,
    image: '/api/placeholder/400/300',
    rating: 4.6,
    reviewCount: 89,
    tags: ['Aksesuar', 'Gaming', 'Office'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ui-ux-template-pack',
    title: 'UI/UX Template Pack',
    name: 'UI/UX Template Pack',
    description: '50+ profesyonel tasarım şablonu',
    price: 299.99,
    currency: 'TRY',
    category: 'Tasarım',
    stock: 200,
    image: '/api/placeholder/400/300',
    rating: 4.8,
    reviewCount: 156,
    tags: ['UI', 'UX', 'Templates', 'Figma'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mechanical-keyboard',
    title: 'Mechanical Keyboard',
    name: 'Mechanical Keyboard',
    description: 'RGB aydınlatmalı mekanik klavye',
    price: 899.99,
    currency: 'TRY',
    category: 'Donanım',
    stock: 30,
    image: '/api/placeholder/400/300',
    rating: 4.7,
    reviewCount: 203,
    tags: ['Keyboard', 'Gaming', 'RGB'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ai-chatbot-kit',
    title: 'AI Chatbot Kit',
    name: 'AI Chatbot Kit',
    description: 'Hazır AI chatbot çözümleri',
    price: 699.99,
    currency: 'TRY',
    category: 'Software',
    stock: 75,
    image: '/api/placeholder/400/300',
    rating: 4.5,
    reviewCount: 92,
    tags: ['AI', 'Chatbot', 'Automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'webcam-4k',
    title: 'Webcam 4K',
    name: 'Webcam 4K',
    description: 'Profesyonel yayın kalitesi',
    price: 1299.99,
    currency: 'TRY',
    category: 'Donanım',
    stock: 20,
    image: '/api/placeholder/400/300',
    rating: 4.8,
    reviewCount: 174,
    tags: ['Webcam', 'Streaming', '4K'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
