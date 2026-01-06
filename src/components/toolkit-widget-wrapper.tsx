"use client";

import React, { ReactNode } from 'react';
import { WidgetSize, DEFAULT_WIDGET_SIZE, WIDGET_SIZES } from '@/lib/widget-sizes';
import { cn } from '@/lib/utils';

/**
 * Unified Toolkit Widget Wrapper
 * 
 * Provides consistent UI for all 62 widgets in toolkit library view
 * User requirement: "araç takımları kitaplığı görünümünde de ui uyumlu olsunlar"
 */
interface ToolkitWidgetWrapperProps {
  title: string;
  icon?: ReactNode;
  size?: WidgetSize;
  onSizeChange?: (size: WidgetSize) => void;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  // Optional features
  showSizeSelector?: boolean;
  showHeader?: boolean;
  fullHeight?: boolean;
}

export function ToolkitWidgetWrapper({
  title,
  icon,
  size = DEFAULT_WIDGET_SIZE,
  onSizeChange,
  children,
  className,
  headerClassName,
  contentClassName,
  showSizeSelector = true,
  showHeader = true,
  fullHeight = true,
}: ToolkitWidgetWrapperProps) {
  const dimensions = WIDGET_SIZES[size];

  return (
    <div
      className={cn(
        'toolkit-widget',
        'bg-white dark:bg-gray-900',
        'rounded-xl shadow-lg',
        'border border-gray-200 dark:border-gray-800',
        'overflow-hidden',
        'transition-all duration-300',
        'hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-700',
        fullHeight && 'flex flex-col',
        className
      )}
      style={{
        width: dimensions.width,
        height: fullHeight ? dimensions.height : 'auto',
      }}
    >
      {showHeader && (
        <div
          className={cn(
            'toolkit-widget-header',
            'flex items-center justify-between',
            'px-4 py-3',
            'border-b border-gray-200 dark:border-gray-800',
            'bg-gray-50 dark:bg-gray-800/50',
            headerClassName
          )}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
                {icon}
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h3>
          </div>

          {showSizeSelector && onSizeChange && (
            <WidgetSizeSelector currentSize={size} onChange={onSizeChange} />
          )}
        </div>
      )}

      <div
        className={cn(
          'toolkit-widget-content',
          dimensions.padding,
          fullHeight && 'flex-1 overflow-auto',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Widget Size Selector Component
 */
interface WidgetSizeSelectorProps {
  currentSize: WidgetSize;
  onChange: (size: WidgetSize) => void;
  showLabels?: boolean;
}

function WidgetSizeSelector({ currentSize, onChange, showLabels = false }: WidgetSizeSelectorProps) {
  const sizes: WidgetSize[] = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <div className="flex items-center gap-1">
      {showLabels && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Size:</span>
      )}
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onChange(size)}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium transition-all',
            currentSize === size
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          )}
          title={WIDGET_SIZES[size].label}
        >
          {WIDGET_SIZES[size].displayLabel}
        </button>
      ))}
    </div>
  );
}

/**
 * Centered Player Container (for video/audio players)
 * User requirement: "oynatıcılara ortalı hizanlansınlar"
 */
interface CenteredPlayerContainerProps {
  size?: WidgetSize;
  children: ReactNode;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  className?: string;
}

export function CenteredPlayerContainer({
  size = DEFAULT_WIDGET_SIZE,
  children,
  aspectRatio = '16:9',
  className,
}: CenteredPlayerContainerProps) {
  const aspectRatios = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  };

  return (
    <div className={cn(
      'flex items-center justify-center',
      'w-full h-full',
      'bg-black/5 dark:bg-white/5',
      'rounded-lg',
      className
    )}>
      <div className={cn(
        'max-w-full max-h-full',
        aspectRatios[aspectRatio],
        'flex items-center justify-center',
        'overflow-hidden rounded-md'
      )}>
        {children}
      </div>
    </div>
  );
}

/**
 * Widget Empty State
 */
interface WidgetEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function WidgetEmptyState({ icon, title, description, action }: WidgetEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      {icon && (
        <div className="text-gray-400 dark:text-gray-600 mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-[200px]">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Widget Loading State
 */
export function WidgetLoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mb-2" />
      <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

/**
 * Widget Error State
 */
interface WidgetErrorStateProps {
  error: string;
  retry?: () => void;
}

export function WidgetErrorState({ error, retry }: WidgetErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="text-red-500 dark:text-red-400 mb-2">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Error
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {error}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
