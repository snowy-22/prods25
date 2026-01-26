'use client';

import React, { useState } from 'react';
import { Plus, Camera, QrCode, Edit2, Trash2, Heart, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  title: string;
  images: string[];
  category: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  quantity?: number;
  estimatedValue?: number;
  location?: string;
  isFavorite?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  onSell?: () => void;
  isCompact?: boolean;
}

/**
 * StandardProductCard - Eşya Kartı (Inventory Product Card)
 * Used in: Eşyalarım folder, Canvas, Profiles
 */
export function ProductCard({
  id,
  title,
  images,
  category,
  condition = 'good',
  quantity = 1,
  estimatedValue,
  location,
  isFavorite = false,
  onEdit,
  onDelete,
  onFavorite,
  onSell,
  isCompact = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const primaryImage = images?.[0];

  const conditionColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
  };

  if (isCompact) {
    return (
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden group">
        {/* Image */}
        <div className="relative w-full h-32 bg-gray-100 overflow-hidden">
          {primaryImage && !imageError ? (
            <img
              src={primaryImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-2xl">📦</span>
            </div>
          )}
          
          {/* Quantity Badge */}
          {quantity > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
              ×{quantity}
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={onFavorite}
            className="absolute top-2 left-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">{title}</h3>
          
          <div className="flex items-center justify-between mt-2">
            <span className={cn('text-xs px-2 py-1 rounded-full', conditionColors[condition])}>
              {condition}
            </span>
            {location && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <MapPin size={12} /> {location}
              </span>
            )}
          </div>

          {estimatedValue && (
            <div className="mt-2 text-sm font-semibold text-gray-900">
              ${(estimatedValue / 100).toFixed(2)}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 p-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
              >
                <Edit2 size={12} /> Düzenle
              </button>
            )}
            {onSell && (
              <button
                onClick={onSell}
                className="flex-1 p-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              >
                Sat
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full size card
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden group">
      {/* Image Gallery */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-5xl">📦</span>
          </div>
        )}

        {/* Badge: Quantity */}
        {quantity > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Qty: {quantity}
          </div>
        )}

        {/* Badge: Condition */}
        <div className={cn('absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold', conditionColors[condition])}>
          {condition}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{title}</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
            {category}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
              <MapPin size={12} /> {location}
            </span>
          )}
        </div>

        {estimatedValue && (
          <div className="mb-3">
            <p className="text-2xl font-bold text-gray-900">
              ${(estimatedValue / 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Tahmini Değer</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={onEdit}
              className="py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Edit2 size={16} /> Düzenle
            </button>
          )}
          {onSell && (
            <button
              onClick={onSell}
              className="py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Sat
            </button>
          )}
          {onFavorite && (
            <button
              onClick={onFavorite}
              className={cn(
                'py-2 px-3 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2',
                isFavorite
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
              Favorim
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Sil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AddProductButton - Quick add product button with multiple options
 */
export function AddProductButton({
  onManualAdd,
  onCameraCapture,
  onBarcodeScanning,
}: {
  onManualAdd: () => void;
  onCameraCapture: () => void;
  onBarcodeScanning: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
      >
        <Plus size={20} />
        Eşya Ekle
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-48">
          <button
            onClick={() => {
              onManualAdd();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
          >
            <Plus size={18} className="text-blue-600" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Manuel Ekle</p>
              <p className="text-xs text-gray-500">Bilgileri manuel olarak girin</p>
            </div>
          </button>

          <button
            onClick={() => {
              onCameraCapture();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
          >
            <Camera size={18} className="text-green-600" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Fotoğraf Çek</p>
              <p className="text-xs text-gray-500">Kamerayla görseller ekle</p>
            </div>
          </button>

          <button
            onClick={() => {
              onBarcodeScanning();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <QrCode size={18} className="text-orange-600" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Barkod Tara</p>
              <p className="text-xs text-gray-500">Barkod tarayıcısını kullan</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
