/**
 * E-Commerce Lazy Loading Hooks
 * Reduces initial bundle size by loading product data on demand
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { Product } from './ecommerce-types';

/**
 * Lazy load e-commerce products
 * Loads DEFAULT_PRODUCTS only when component mounts
 */
export function useEcommerceProducts(): Product[] {
  const products = useAppStore(state => state.products);
  const addProduct = useAppStore(state => state.addProduct);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current && products.length === 0) {
      hasLoaded.current = true;
      
      // Dynamic import to reduce initial bundle
      import('./default-products').then(({ DEFAULT_PRODUCTS }) => {
        DEFAULT_PRODUCTS.forEach(product => addProduct(product));
      });
    }
  }, [products.length, addProduct]);

  return products;
}
