/**
 * E-Commerce Lazy Loading Hooks
 * Reduces initial bundle size by loading product data on demand
 */

'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Lazy load e-commerce products
 * Loads DEFAULT_PRODUCTS only when component mounts
 */
export function useEcommerceProducts(): any[] {
  const [products, setProducts] = useState<any[]>([]);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      
      // Dynamic import to reduce initial bundle
      import('./default-products').then(({ DEFAULT_PRODUCTS }) => {
        setProducts(DEFAULT_PRODUCTS);
      });
    }
  }, []);

  return products;
}
