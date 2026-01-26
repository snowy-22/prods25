'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, QrCode, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onBarcodeMode?: () => void;
  onCameraMode?: () => void;
}

export interface ProductFormData {
  title: string;
  description: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  quantity: number;
  purchasePrice?: number;
  estimatedValue?: number;
  barcode?: string;
  images: string[];
  tags?: string[];
  location?: string;
}

/**
 * AddProductModal - Eşya Ekleme Modal
 */
export function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  onBarcodeMode,
  onCameraMode,
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category: 'other',
    condition: 'good',
    quantity: 1,
    images: [],
    tags: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Elektronik',
    'Kitap & Kütüphaneler',
    'Giyim & Ayakkabı',
    'Ev & Bahçe',
    'Spor & Outdoor',
    'Sanat & Zanaat',
    'Oyuncak',
    'Diğer',
  ];

  const conditions = [
    { value: 'excellent', label: 'Mükemmel' },
    { value: 'good', label: 'İyi' },
    { value: 'fair', label: 'Orta' },
    { value: 'poor', label: 'Kötü' },
  ] as const;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newFiles = Array.from(files);
      setImageFiles((prev) => [...prev, ...newFiles]);

      // Preview images
      const readers = newFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((urls) => {
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Lütfen ürün adını girin');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        condition: 'good',
        quantity: 1,
        images: [],
        tags: [],
      });
      setImageFiles([]);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between border-b border-blue-800">
          <h2 className="text-2xl font-bold">Eşya Ekle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {onCameraMode && (
              <button
                type="button"
                onClick={onCameraMode}
                className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
              >
                <Camera size={18} />
                <span className="font-medium text-sm">Fotoğraf Çek</span>
              </button>
            )}
            {onBarcodeMode && (
              <button
                type="button"
                onClick={onBarcodeMode}
                className="flex items-center justify-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
              >
                <QrCode size={18} />
                <span className="font-medium text-sm">Barkod Tara</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ürün Adı *
            </label>
            <input
              type="text"
              required
              placeholder="Ürün adını girin"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Açıklama
            </label>
            <textarea
              placeholder="Ürün açıklaması..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* Category and Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Durum
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                {conditions.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity and Prices */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Miktar
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Satın Alma Fiyatı
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.purchasePrice || ''}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) * 100 : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tahmini Değer
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.estimatedValue || ''}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? parseFloat(e.target.value) * 100 : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Barkod Numarası
            </label>
            <input
              type="text"
              placeholder="Barkod tarayıcıyla ekleyin veya manuel girin"
              value={formData.barcode || ''}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Fotoğraflar
            </label>

            {/* Image Previews */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-sm font-medium text-gray-900">Fotoğraf yüklemek için tıklayın</p>
              <p className="text-xs text-gray-500 mt-1">veya sürükle ve bırak</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Etiketler (virgülle ayrılmış)
            </label>
            <input
              type="text"
              placeholder="örn: nadir, koleksiyon, satılık"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Konum (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder="örn: Yatak Odası, Depo"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2',
                isSubmitting
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition-shadow'
              )}
            >
              {isSubmitting && <Loader size={16} className="animate-spin" />}
              {isSubmitting ? 'Kaydediliyor...' : 'Eşyayı Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
