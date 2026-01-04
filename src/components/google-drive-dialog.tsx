/**
 * Google Drive Integration Dialog
 * Manage API keys, authenticate, browse and upload files from Google Drive
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Cloud, LogOut, Upload, Download, Share2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleDrive, GoogleDriveFile } from '@/lib/google-drive-client';

interface GoogleDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected?: (file: GoogleDriveFile) => void;
  clientId?: string;
  apiKey?: string;
  onSaveKeys?: (clientId: string, apiKey: string) => void;
}

export function GoogleDriveDialog({
  isOpen,
  onClose,
  onFileSelected,
  clientId: initialClientId,
  apiKey: initialApiKey,
  onSaveKeys,
}: GoogleDriveDialogProps) {
  const [tab, setTab] = useState<'settings' | 'browse' | 'upload'>('settings');
  const [clientId, setClientId] = useState(initialClientId || '');
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [showKeys, setShowKeys] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [uploadProgress, setUploadProgress] = useState(0);

  const drive = useGoogleDrive({ clientId, apiKey });

  const handleSaveKeys = useCallback(() => {
    if (clientId && apiKey) {
      onSaveKeys?.(clientId, apiKey);
    }
  }, [clientId, apiKey, onSaveKeys]);

  const handleAuthenticate = useCallback(async () => {
    const success = await drive.authenticate();
    if (success) {
      setTab('browse');
      const fileList = await drive.listFiles();
      setFiles(fileList);
    }
  }, [drive]);

  const handleListFiles = useCallback(async () => {
    const fileList = await drive.listFiles(selectedFolder);
    setFiles(fileList);
  }, [selectedFolder, drive]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (!file) return;

      const result = await drive.uploadFile(file, selectedFolder, (percent) => {
        setUploadProgress(percent);
      });

      if (result) {
        setUploadProgress(0);
        await handleListFiles();
      }
    },
    [selectedFolder, drive, handleListFiles]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Google Drive</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/20">
          {['settings', 'browse', 'upload'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'settings' && 'Settings'}
              {t === 'browse' && 'Browse'}
              {t === 'upload' && 'Upload'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {tab === 'settings' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-medium mb-1">Get your API keys from Google Cloud Console:</p>
                  <ol className="space-y-0.5 ml-2">
                    <li>1. Go to console.cloud.google.com</li>
                    <li>2. Create a new project or select existing</li>
                    <li>3. Enable Google Drive API</li>
                    <li>4. Create OAuth 2.0 credentials (Desktop app)</li>
                    <li>5. Copy Client ID and API Key</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client ID</label>
                <div className="flex gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your Google Cloud Client ID"
                    className="flex-1 px-3 py-2 rounded border bg-muted/50 text-sm"
                  />
                  <button
                    onClick={() => setShowKeys(!showKeys)}
                    className="p-2 rounded hover:bg-muted transition-colors"
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google Cloud API Key"
                  className="w-full px-3 py-2 rounded border bg-muted/50 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveKeys}
                  disabled={!clientId || !apiKey}
                  className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save Keys
                </button>
                <button
                  onClick={handleAuthenticate}
                  disabled={!clientId || !apiKey || drive.isLoading}
                  className="flex-1 px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {drive.isLoading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </div>

              {drive.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {drive.error}
                </div>
              )}

              {drive.isAuthenticated && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-900 font-medium">✓ Connected to Google Drive</p>
                </div>
              )}
            </div>
          )}

          {tab === 'browse' && (
            <div className="space-y-4">
              {!drive.isAuthenticated ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p className="text-sm">Please authenticate in Settings first</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleListFiles}
                    disabled={drive.isLoading}
                    className="w-full px-4 py-2 rounded border hover:bg-muted transition-colors text-sm"
                  >
                    {drive.isLoading ? 'Loading...' : 'Refresh Files'}
                  </button>

                  <div className="space-y-2 max-h-96 overflow-auto">
                    {files.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No files found</p>
                    ) : (
                      files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded border hover:bg-muted transition-colors cursor-pointer group"
                          onClick={() => onFileSelected?.(file)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.mimeType} •{' '}
                                {file.fileSize ? formatSize(file.fileSize) : 'Unknown size'}
                              </p>
                            </div>
                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              {!drive.isAuthenticated ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p className="text-sm">Please authenticate in Settings first</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select File</label>
                    <input
                      type="file"
                      onChange={handleUpload}
                      disabled={drive.isLoading || uploadProgress > 0}
                      className="w-full px-3 py-2 rounded border bg-muted/50 text-sm"
                    />
                  </div>

                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Upload Progress</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex justify-between">
          <button
            onClick={() => drive.signOut()}
            disabled={!drive.isAuthenticated}
            className="px-4 py-2 rounded text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default GoogleDriveDialog;
