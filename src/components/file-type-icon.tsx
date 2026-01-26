/**
 * File Type Icon Component
 * 
 * Provides icons and colors for different file types
 * Supports 50+ file extensions with appropriate visual styling
 */

'use client';

import React from 'react';
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Image,
  Video,
  Music,
  Code,
  Box,
  Globe,
  FileJson,
  Database,
  FileType,
  Presentation,
  Table,
  BookOpen,
  FileQuestion,
  Film,
  Palette,
  Clapperboard,
  Package,
  FileCheck,
  Newspaper,
  FileX,
  Archive,
  Lock,
  Key,
  Settings,
  Terminal,
  FileWarning,
  Layers,
  Cuboid,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// File type categories and their icon/color mappings
export const FILE_TYPE_CONFIG: Record<string, { 
  icon: LucideIcon; 
  color: string; 
  bgColor: string;
  label: string;
  extensions: string[];
}> = {
  // Documents
  pdf: {
    icon: FileText,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'PDF Belgesi',
    extensions: ['pdf'],
  },
  word: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    label: 'Word Belgesi',
    extensions: ['doc', 'docx', 'odt', 'rtf'],
  },
  excel: {
    icon: FileSpreadsheet,
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
    label: 'Excel Tablosu',
    extensions: ['xls', 'xlsx', 'csv', 'ods'],
  },
  powerpoint: {
    icon: Presentation,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'PowerPoint Sunumu',
    extensions: ['ppt', 'pptx', 'odp'],
  },
  text: {
    icon: FileText,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'Metin Dosyası',
    extensions: ['txt', 'md', 'markdown', 'log'],
  },

  // Images
  image: {
    icon: FileImage,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    label: 'Görsel',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif'],
  },
  svg: {
    icon: Palette,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    label: 'SVG Vektör',
    extensions: ['svg'],
  },
  psd: {
    icon: Layers,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    label: 'Photoshop Dosyası',
    extensions: ['psd', 'ai', 'eps'],
  },
  raw: {
    icon: Image,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    label: 'RAW Görsel',
    extensions: ['raw', 'cr2', 'nef', 'arw', 'dng'],
  },

  // Video
  video: {
    icon: FileVideo,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    label: 'Video',
    extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v'],
  },
  video_pro: {
    icon: Clapperboard,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    label: 'Profesyonel Video',
    extensions: ['prproj', 'aep', 'veg', 'mlt'],
  },

  // Audio
  audio: {
    icon: FileAudio,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    label: 'Ses Dosyası',
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff'],
  },
  audio_pro: {
    icon: Music,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    label: 'Profesyonel Ses',
    extensions: ['aup', 'als', 'flp', 'logic', 'band'],
  },

  // 3D Models
  model_3d: {
    icon: Cuboid,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    label: '3D Model',
    extensions: ['glb', 'gltf', 'obj', 'fbx', 'stl', '3ds', 'blend', 'dae', 'usdz'],
  },

  // Code & Development
  code: {
    icon: FileCode,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    label: 'Kaynak Kodu',
    extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt', 'rb', 'php'],
  },
  web: {
    icon: Globe,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    label: 'Web Dosyası',
    extensions: ['html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte'],
  },
  json: {
    icon: FileJson,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'JSON Verisi',
    extensions: ['json', 'jsonl', 'geojson'],
  },
  config: {
    icon: Settings,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    label: 'Konfigürasyon',
    extensions: ['yml', 'yaml', 'toml', 'ini', 'env', 'cfg', 'conf'],
  },
  xml: {
    icon: Code,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    label: 'XML Verisi',
    extensions: ['xml', 'xsl', 'xslt', 'xsd'],
  },
  database: {
    icon: Database,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Veritabanı',
    extensions: ['sql', 'db', 'sqlite', 'sqlite3', 'mdb', 'accdb'],
  },
  script: {
    icon: Terminal,
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-500/10',
    label: 'Script Dosyası',
    extensions: ['sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd'],
  },

  // Archives
  archive: {
    icon: FileArchive,
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    label: 'Arşiv',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'],
  },
  package: {
    icon: Package,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    label: 'Paket',
    extensions: ['deb', 'rpm', 'dmg', 'pkg', 'msi', 'exe', 'app'],
  },

  // eBooks & Documents
  ebook: {
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10',
    label: 'E-Kitap',
    extensions: ['epub', 'mobi', 'azw', 'azw3', 'djvu'],
  },

  // Security
  certificate: {
    icon: FileCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Sertifika',
    extensions: ['crt', 'cer', 'pem', 'p12', 'pfx'],
  },
  key: {
    icon: Key,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-600/10',
    label: 'Anahtar Dosyası',
    extensions: ['key', 'pub', 'ppk'],
  },
  encrypted: {
    icon: Lock,
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    label: 'Şifreli Dosya',
    extensions: ['gpg', 'asc', 'enc'],
  },

  // Folders
  folder: {
    icon: Folder,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Klasör',
    extensions: [],
  },
  folder_open: {
    icon: FolderOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Açık Klasör',
    extensions: [],
  },

  // Default/Unknown
  unknown: {
    icon: FileQuestion,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: 'Bilinmeyen',
    extensions: [],
  },
};

// Extension to type mapping (cached for performance)
const extensionTypeMap: Record<string, string> = {};
Object.entries(FILE_TYPE_CONFIG).forEach(([type, config]) => {
  config.extensions.forEach(ext => {
    extensionTypeMap[ext.toLowerCase()] = type;
  });
});

/**
 * Get file type from file name or extension
 */
export function getFileType(fileName: string): string {
  if (!fileName) return 'unknown';
  
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return extensionTypeMap[ext] || 'unknown';
}

/**
 * Get file type config from file name
 */
export function getFileTypeConfig(fileName: string) {
  const type = getFileType(fileName);
  return FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.unknown;
}

interface FileTypeIconProps {
  /** File name or extension (e.g., "document.pdf" or "pdf") */
  fileName: string;
  /** Icon size class (e.g., "h-4 w-4" or "h-8 w-8") */
  size?: string;
  /** Show background color */
  showBg?: boolean;
  /** Additional class names */
  className?: string;
  /** If true, treats input as a type directly (e.g., "folder", "3dplayer") */
  isType?: boolean;
  /** Force a specific file type */
  forceType?: string;
}

/**
 * FileTypeIcon - Shows appropriate icon with color for file types
 */
export function FileTypeIcon({
  fileName,
  size = 'h-5 w-5',
  showBg = false,
  className,
  isType = false,
  forceType,
}: FileTypeIconProps) {
  // Determine file type
  let type = forceType || (isType ? fileName : getFileType(fileName));
  
  // Map ItemType to file type if needed
  if (isType) {
    const typeMapping: Record<string, string> = {
      'folder': 'folder',
      'list': 'folder',
      'inventory': 'folder',
      'space': 'folder',
      'root': 'folder',
      'video': 'video',
      'audio': 'audio',
      'image': 'image',
      'pdf': 'pdf',
      '3dplayer': 'model_3d',
      'website': 'web',
      'file': 'unknown',
      'player': 'video',
      'notes': 'text',
      'code': 'code',
    };
    type = typeMapping[type] || type;
  }
  
  const config = FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.unknown;
  const IconComponent = config.icon;
  
  if (showBg) {
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-lg p-2',
        config.bgColor,
        className
      )}>
        <IconComponent className={cn(size, config.color)} />
      </div>
    );
  }
  
  return (
    <IconComponent className={cn(size, config.color, className)} />
  );
}

/**
 * FileTypeBadge - Shows file type with label
 */
export function FileTypeBadge({
  fileName,
  showLabel = true,
  size = 'h-4 w-4',
  className,
}: {
  fileName: string;
  showLabel?: boolean;
  size?: string;
  className?: string;
}) {
  const config = getFileTypeConfig(fileName);
  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
      config.bgColor,
      config.color,
      className
    )}>
      <FileTypeIcon fileName={fileName} size={size} />
      {showLabel && <span>{ext}</span>}
    </div>
  );
}

/**
 * Get all supported file extensions
 */
export function getAllSupportedExtensions(): string[] {
  return Object.keys(extensionTypeMap);
}

/**
 * Check if file extension is supported
 */
export function isExtensionSupported(fileName: string): boolean {
  return getFileType(fileName) !== 'unknown';
}

export default FileTypeIcon;
