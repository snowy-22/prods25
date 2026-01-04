/**
 * Google Drive Integration Client
 * Manages OAuth authentication, file fetching, and preview URLs
 */

import React from 'react';

export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  fileSize?: number;
  modifiedTime?: string;
  createdTime?: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  files: GoogleDriveFile[];
}

/**
 * Google Drive API Client
 * Handles authentication, file operations, and preview generation
 */
export class GoogleDriveClient {
  private config: GoogleDriveConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: GoogleDriveConfig) {
    this.config = {
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive',
      ],
      ...config,
    };
  }

  /**
   * Initialize Google API library
   */
  async initializeGAPI(): Promise<void> {
    if ((window as any).gapi?.client) {
      return; // Already initialized
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/client.js';
      script.onload = async () => {
        try {
          await (window as any).gapi.load('client:auth2', async () => {
            await (window as any).gapi.client.init({
              apiKey: this.config.apiKey,
              clientId: this.config.clientId,
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              ],
              scope: this.config.scopes?.join(' '),
            });
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Authenticate user with Google
   */
  async authenticate(): Promise<boolean> {
    try {
      await this.initializeGAPI();
      const auth = (window as any).gapi.auth2.getAuthInstance();

      if (!auth.isSignedIn.get()) {
        await auth.signIn();
      }

      const user = auth.currentUser.get();
      const response = user.getAuthResponse(true);
      this.accessToken = response.id_token;
      this.tokenExpiry = response.expires_in
        ? Date.now() + response.expires_in * 1000
        : null;

      return true;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      return false;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      const auth = (window as any).gapi.auth2.getAuthInstance();
      await auth.signOut();
      this.accessToken = null;
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.accessToken) return false;
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      this.accessToken = null;
      return false;
    }
    return true;
  }

  /**
   * Get file from Google Drive
   */
  async getFile(fileId: string): Promise<GoogleDriveFile | null> {
    try {
      const gapi = (window as any).gapi;
      const response = await gapi.client.drive.files.get({
        fileId,
        fields:
          'id,name,mimeType,webViewLink,size,modifiedTime,createdTime,owners',
      });

      return {
        id: response.result.id,
        name: response.result.name,
        mimeType: response.result.mimeType,
        webViewLink: response.result.webViewLink,
        fileSize: response.result.size ? parseInt(response.result.size) : undefined,
        modifiedTime: response.result.modifiedTime,
        createdTime: response.result.createdTime,
        owners: response.result.owners,
      };
    } catch (error) {
      console.error('Failed to get file:', error);
      return null;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(
    folderId: string = 'root',
    pageSize: number = 50
  ): Promise<GoogleDriveFile[]> {
    try {
      const gapi = (window as any).gapi;
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        pageSize,
        fields:
          'nextPageToken,files(id,name,mimeType,webViewLink,size,modifiedTime,owners)',
      });

      return (response.result.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        fileSize: file.size ? parseInt(file.size) : undefined,
        modifiedTime: file.modifiedTime,
        owners: file.owners,
      }));
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Get preview URL for a file
   * Returns Google Docs/Sheets/Slides embedded viewer URL or direct download
   */
  getPreviewUrl(fileId: string, viewMode: 'preview' | 'edit' = 'preview'): string {
    if (viewMode === 'edit') {
      return `https://docs.google.com/document/d/${fileId}/edit`;
    }
    return `https://docs.google.com/gview?url=https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${this.config.apiKey}&embedded=true`;
  }

  /**
   * Get web view link (open in browser)
   */
  getWebViewLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Download file from Google Drive
   */
  async downloadFile(fileId: string): Promise<Blob | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download file:', error);
      return null;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    file: File,
    folderId: string = 'root',
    onProgress?: (percent: number) => void
  ): Promise<GoogleDriveFile | null> {
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent);
          }
        });
      }

      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            resolve({
              id: result.id,
              name: result.name,
              mimeType: result.mimeType,
              webViewLink: result.webViewLink,
              fileSize: result.size ? parseInt(result.size) : undefined,
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload error'));
        });

        xhr.open(
          'POST',
          `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${this.config.apiKey}`,
          true
        );
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        xhr.send(form);
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      return null;
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(name: string, parentId: string = 'root'): Promise<string | null> {
    try {
      const gapi = (window as any).gapi;
      const response = await gapi.client.drive.files.create({
        resource: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create folder:', error);
      return null;
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const gapi = (window as any).gapi;
      await gapi.client.drive.files.delete({
        fileId,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Share file with users
   */
  async shareFile(
    fileId: string,
    emailAddress: string,
    role: 'reader' | 'commenter' | 'writer' = 'reader'
  ): Promise<boolean> {
    try {
      const gapi = (window as any).gapi;
      await gapi.client.drive.permissions.create({
        fileId,
        resource: {
          type: 'user',
          role,
          emailAddress,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to share file:', error);
      return false;
    }
  }
}

/**
 * React Hook for Google Drive integration
 */
export function useGoogleDrive(config: GoogleDriveConfig) {
  const [client] = React.useState(() => new GoogleDriveClient(config));
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const authenticate = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.authenticate();
      setIsAuthenticated(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const signOut = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await client.signOut();
      setIsAuthenticated(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const getFile = React.useCallback(
    async (fileId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        return await client.getFile(fileId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get file';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const listFiles = React.useCallback(
    async (folderId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        return await client.listFiles(folderId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list files';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const downloadFile = React.useCallback(
    async (fileId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        return await client.downloadFile(fileId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to download file';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const uploadFile = React.useCallback(
    async (file: File, folderId?: string, onProgress?: (percent: number) => void) => {
      setIsLoading(true);
      setError(null);
      try {
        return await client.uploadFile(file, folderId, onProgress);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload file';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  return {
    client,
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    signOut,
    getFile,
    listFiles,
    downloadFile,
    uploadFile,
  };
}

export default GoogleDriveClient;
