/**
 * Backend API Service
 * Communicates with the secure backend for credential storage
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';

export interface CredentialsStatus {
  hasCredentials: boolean;
  accessKeyPreview: string | null;
  validated: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}

export const backendService = {
  /**
   * Save credentials to backend (encrypted server-side)
   */
  async saveCredentials(accessKey: string, secretKey: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessKey, secretKey })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save credentials');
    }
    
    return await response.json();
  },

  /**
   * Get credentials status (not the actual credentials)
   */
  async getCredentialsStatus(): Promise<CredentialsStatus> {
    const response = await fetch(`${BACKEND_URL}/api/credentials/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get credentials status');
    }
    
    return await response.json();
  },

  /**
   * Delete credentials from backend
   */
  async deleteCredentials(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/credentials`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete credentials');
    }
    
    return await response.json();
  },

  /**
   * Proxy an Archive.org API call through the backend
   * The backend will add credentials if requiresAuth is true
   */
  async proxyArchiveRequest(
    url: string,
    options: {
      method?: string;
      body?: any;
      requiresAuth?: boolean;
    } = {}
  ): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/proxy/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method: options.method || 'GET',
        body: options.body,
        requiresAuth: options.requiresAuth || false
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Proxy request failed');
    }
    
    return await response.json();
  },

  /**
   * Validate credentials with Archive.org API
   */
  async validateCredentials(): Promise<ValidationResult> {
    const response = await fetch(`${BACKEND_URL}/api/credentials/validate`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to validate credentials');
    }

    return await response.json();
  },

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
