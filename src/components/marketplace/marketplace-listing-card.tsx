'use client';

import React, { useState } from 'react';
import { MessageCircle, Heart, Share2, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceListingCardProps {
  id: string;
  title: string;
  images: string[];
  price: number;
  quantity?: number;
  sellerName: string;
  sellerRating?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  shippingPrice?: number;
  estimatedDeliveryDays?: number;
  isFavorite?: boolean;
  viewCount?: number;
  onClick?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  isCompact?: boolean;
}

/**
 * MarketplaceListingCard - Satış Kartı (Sales/Marketplace Listing Card)
 * Used in: Marketplace page, Seller profiles, Canvas marketplace
 */
export function MarketplaceListingCard({
  id,
  title,
  images,
  price,
  quantity = 1,
  sellerName,
  sellerRating = 4.5,
  condition = 'good',
  shippingPrice = 0,
  estimatedDeliveryDays,
  isFavorite = false,
  viewCount = 0,
  onClick,
  onFavorite,
  onShare,
  isCompact = false,
}: MarketplaceListingCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const primaryImage = images?.[currentImageIndex];

  const conditionColors = {
    excellent: 'bg-emerald-100 text-emerald-800',
    good: 'bg-sky-100 text-sky-800',
    fair: 'bg-amber-100 text-amber-800',
    poor: 'bg-rose-100 text-rose-800',
  };

  const totalPrice = price + (shippingPrice || 0);

  if (isCompact) {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-lg shadow hover:shadow-lg transition-all border border-gray-200 overflow-hidden group cursor-pointer"
      >
        {/* Image */}
        <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
          {primaryImage && !imageError ? (
            <img
              src={primaryImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-3xl">🛍️</span>
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">
            ${(totalPrice / 100).toFixed(2)}
          </div>

          {/* View Count */}
          {viewCount > 0 && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <TrendingUp size={12} /> {viewCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">{title}</h3>

          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={cn('px-2 py-1 rounded-full', conditionColors[condition])}>
              {condition}
            </span>
            {quantity > 1 && <span className="text-gray-600">Qty: {quantity}</span>}
          </div>

          {/* Seller Info */}
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{sellerName}</p>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < Math.floor(sellerRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">{sellerRating}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className="flex-1 p-1 text-xs rounded hover:bg-red-50 transition-colors"
            >
              <Heart
                size={14}
                className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
              className="flex-1 p-1 text-xs text-blue-600 rounded hover:bg-blue-50 transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full size card
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-200 overflow-hidden group cursor-pointer"
    >
      {/* Image Gallery */}
      <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-6xl">🛍️</span>
          </div>
        )}

        {/* Price Badge - Large */}
        <div className="absolute top-4 right-4 bg-gradient-to-br from-red-600 to-red-700 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
          ${(totalPrice / 100).toFixed(2)}
        </div>

        {/* Condition Badge */}
        <div className={cn('absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold', conditionColors[condition])}>
          {condition.charAt(0).toUpperCase() + condition.slice(1)}
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">{title}</h2>

        {/* Stock and Shipping Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quantity > 1 && (
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              {quantity} Adet Mevcut
            </span>
          )}
          {shippingPrice > 0 && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              Kargo: ${(shippingPrice / 100).toFixed(2)}
            </span>
          )}
          {estimatedDeliveryDays && (
            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
              {estimatedDeliveryDays} gün
            </span>
          )}
        </div>

        {/* Seller Info */}
        <div className="border-t border-gray-200 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
              <div>
                <p className="font-semibold text-gray-900">{sellerName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.floor(sellerRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{sellerRating}</span>
                </div>
              </div>
            </div>
            {viewCount > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <TrendingUp size={12} />
                  {viewCount} görüntü
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.();
            }}
            className={cn(
              'py-2 px-3 rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2',
              isFavorite
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceListingCard;
