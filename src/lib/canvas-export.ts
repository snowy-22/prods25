/**
 * Canvas Export Utilities
 * HTML ve JSON olarak canvas'ı dışa aktarma
 */

import { ContentItem } from '@/lib/initial-content';
import { extractSpotifyInfo, isSpotifyUrl } from '@/lib/spotify-player';

export interface CanvasExportOptions {
  title?: string;
  description?: string;
  includeStyles?: boolean;
  responsive?: boolean;
  inlineCSS?: boolean;
}

/**
 * Canvas'ı HTML olarak dışa aktar
 */
export function exportCanvasAsHTML(
  items: ContentItem[],
  options: CanvasExportOptions = {}
): string {
  const {
    title = 'CanvasFlow Export',
    description = '',
    includeStyles = true,
    responsive = true,
    inlineCSS = true,
  } = options;

  const itemsHTML = items
    .map((item) => generateItemHTML(item, inlineCSS))
    .join('\n');

  const styles = includeStyles ? generateCSS(responsive) : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${responsive ? 'width=device-width, initial-scale=1.0' : 'width=1200'}">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  ${inlineCSS ? `<style>\n${styles}\n</style>` : ''}
</head>
<body>
  <div class="canvas-container">
    <header class="canvas-header">
      <h1>${escapeHtml(title)}</h1>
      ${description ? `<p class="canvas-description">${escapeHtml(description)}</p>` : ''}
      <p class="canvas-meta">Exported from CanvasFlow on ${new Date().toLocaleString()}</p>
    </header>
    
    <main class="canvas-content">
      ${itemsHTML}
    </main>
    
    <footer class="canvas-footer">
      <p>Created with CanvasFlow - Digital Canvas Platform</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Canvas'ı JSON olarak dışa aktar
 */
export function exportCanvasAsJSON(
  items: ContentItem[],
  options: CanvasExportOptions = {}
): string {
  const {
    title = 'CanvasFlow Export',
    description = '',
  } = options;

  const exportData = {
    metadata: {
      title,
      description,
      exportDate: new Date().toISOString(),
      exportedFrom: 'CanvasFlow',
      version: '1.0',
    },
    items,
    statistics: {
      totalItems: items.length,
      itemsByType: items.reduce(
        (acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Tekil öğeyi HTML'e dönüştür
 */
function generateItemHTML(item: ContentItem, inlineCSS: boolean): string {
  const containerStyle = inlineCSS
    ? `style="
      position: ${item.x !== undefined && item.y !== undefined ? 'absolute' : 'relative'};
      ${item.x !== undefined ? `left: ${item.x}px;` : ''}
      ${item.y !== undefined ? `top: ${item.y}px;` : ''}
      width: ${item.width || 300}px;
      height: ${item.height || 200}px;
      ${item.styles?.backgroundColor ? `background-color: ${item.styles.backgroundColor};` : ''}
      ${item.styles?.borderColor ? `border: 2px solid ${item.styles.borderColor};` : ''}
      border-radius: ${item.styles?.borderRadius || 8}px;
      padding: 16px;
      ${item.styles?.boxShadow ? `box-shadow: ${item.styles.boxShadow};` : ''}
    "`
    : 'class="canvas-item"';

  let content = '';

  switch (item.type) {
    case 'video':
      content = `
      <div class="item-video" ${containerStyle}>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        ${item.thumbnail_url ? `<img src="${item.thumbnail_url}" alt="${escapeHtml(item.title || 'Video')}" style="max-width: 100%; height: auto; margin: 8px 0;">` : ''}
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Watch Video</a>` : ''}
      </div>`;
      break;

    case 'image':
      content = `
      <div class="item-image" ${containerStyle}>
        ${item.url ? `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title || 'Image')}" style="max-width: 100%; height: auto;">` : ''}
        ${item.title ? `<p>${escapeHtml(item.title)}</p>` : ''}
      </div>`;
      break;

    case 'website':
      content = `
      <div class="item-website" ${containerStyle}>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        ${item.content ? `<p>${escapeHtml(item.content)}</p>` : ''}
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title || item.url)}</a>` : ''}
      </div>`;
      break;

    case 'audio':
      content = `
      <div class="item-audio" ${containerStyle}>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        ${item.url ? `<audio controls style="width: 100%;"><source src="${escapeHtml(item.url)}" type="audio/mpeg">Your browser does not support the audio element.</audio>` : ''}
      </div>`;
      break;

    case 'text':
    case 'notes':
      content = `
      <div class="item-text" ${containerStyle}>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        <div class="item-content">${escapeHtml(item.content || '')}</div>
      </div>`;
      break;

    // Spotify
    case 'spotify':
    default:
      if (item.url && isSpotifyUrl(item.url)) {
        const spotifyInfo = extractSpotifyInfo(item.url);
        if (spotifyInfo) {
          const { id, type } = spotifyInfo;
          const spotifyUrl = `https://open.spotify.com/${type}/${id}`;
          content = `
      <div class="item-spotify" ${containerStyle}>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1DB954; border-radius: 8px; color: white;">
          <span style="font-weight: 600;">♪ Spotify ${type.toUpperCase()}</span>
        </div>
        <h3 style="margin-top: 12px;">${escapeHtml(item.title || 'Spotify')}</h3>
        <a href="${escapeHtml(spotifyUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #1DB954; color: white; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600;">Play on Spotify</a>
      </div>`;
        }
      }
      break;

    case 'folder':
    case 'list':
      content = `
      <div class="item-folder" ${containerStyle}>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        ${item.content ? `<p>${escapeHtml(item.content)}</p>` : ''}
        ${item.children && item.children.length > 0 ? `<p class="item-meta">Contains ${item.children.length} items</p>` : ''}
      </div>`;
      break;

    default:
      content = `
      <div class="item-default" ${containerStyle}>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        ${item.content ? `<p>${escapeHtml(item.content)}</p>` : ''}
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank">Open</a>` : ''}
      </div>`;
  }

  return content;
}

/**
 * CSS şablonu oluştur
 */
function generateCSS(responsive: boolean): string {
  return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #333;
  background: #f5f5f5;
}

body {
  padding: 20px;
}

.canvas-container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.canvas-header {
  padding: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.canvas-header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  font-weight: 700;
}

.canvas-description {
  font-size: 1.1em;
  opacity: 0.9;
  margin-bottom: 10px;
}

.canvas-meta {
  font-size: 0.9em;
  opacity: 0.8;
}

.canvas-content {
  padding: 40px;
  position: relative;
  min-height: 400px;
  ${responsive ? 'display: flex; flex-direction: column; gap: 24px;' : 'position: relative; height: 1200px;'}
}

.canvas-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.canvas-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.item-video, .item-image, .item-website, .item-audio, .item-text, .item-folder, .item-default {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.item-video h3, .item-image h3, .item-website h3, .item-audio h3, .item-text h3, .item-folder h3, .item-default h3 {
  margin-bottom: 12px;
  color: #1f2937;
  font-size: 1.25em;
}

.item-content {
  line-height: 1.6;
  color: #4b5563;
}

.item-meta {
  font-size: 0.9em;
  color: #9ca3af;
  margin-top: 8px;
}

.item-video img, .item-image img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 8px 0;
}

.item-audio audio, .item-video video {
  width: 100%;
  margin-top: 8px;
}

a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.canvas-footer {
  padding: 20px 40px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
  font-size: 0.9em;
}

${responsive ? `
@media (max-width: 768px) {
  .canvas-header {
    padding: 20px;
  }
  
  .canvas-header h1 {
    font-size: 1.8em;
  }
  
  .canvas-content {
    padding: 20px;
  }
  
  .item-video, .item-image, .item-website, .item-audio, .item-text, .item-folder, .item-default {
    width: 100% !important;
    height: auto !important;
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
  }
}
` : ''}
`;
}

/**
 * HTML özel karakterleri escape et
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Canvas'ı indir (HTML veya JSON)
 */
export function downloadCanvasFile(
  content: string,
  filename: string,
  mimeType: string = 'text/html'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
