/**
 * Archive OmniDash Backend Server
 * Secure credential storage and API proxy
 */
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration for development and production
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://swipswaps.github.io',  // GitHub Pages
    process.env.FRONTEND_URL  // Custom frontend URL
  ].filter(Boolean),  // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Encryption setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const CREDENTIALS_FILE = path.join(__dirname, 'credentials.enc');

// Encrypt data
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

// Decrypt data
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encrypted.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Save credentials
async function saveCredentials(accessKey, secretKey) {
  const data = JSON.stringify({ accessKey, secretKey });
  const encrypted = encrypt(data);
  await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(encrypted), 'utf8');
}

// Load credentials
async function loadCredentials() {
  try {
    const encryptedData = await fs.readFile(CREDENTIALS_FILE, 'utf8');
    const encrypted = JSON.parse(encryptedData);
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
}

// Delete credentials
async function deleteCredentials() {
  try {
    await fs.unlink(CREDENTIALS_FILE);
  } catch (error) {
    // File doesn't exist, that's fine
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Save credentials
app.post('/api/credentials', async (req, res) => {
  try {
    const { accessKey, secretKey } = req.body;
    
    if (!accessKey || !secretKey) {
      return res.status(400).json({ error: 'Access key and secret key are required' });
    }
    
    await saveCredentials(accessKey, secretKey);
    res.json({ success: true, message: 'Credentials saved securely' });
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

// Get credentials status (not the actual credentials)
app.get('/api/credentials/status', async (req, res) => {
  try {
    const creds = await loadCredentials();
    res.json({
      hasCredentials: !!creds,
      accessKeyPreview: creds ? `${creds.accessKey.substring(0, 4)}...` : null,
      validated: false  // Validation is separate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check credentials' });
  }
});

// Validate credentials with Archive.org API
// Based on official Archive.org API documentation:
// https://archive.org/developers/md-write.html
// Authorization format: LOW <access_key>:<secret_key>
app.post('/api/credentials/validate', async (req, res) => {
  try {
    const creds = await loadCredentials();

    if (!creds) {
      return res.json({ valid: false, error: 'No credentials stored' });
    }

    // Test credentials with Archive.org metadata API
    // Use a known public item that always exists: 'internetarchive'
    // This is a read-only operation that requires authentication
    const testUrl = 'https://archive.org/metadata/internetarchive';

    try {
      // Make request with proper Archive.org S3 authentication header
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `LOW ${creds.accessKey}:${creds.secretKey}`,
          'User-Agent': 'Archive-OmniDash/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // If we get valid JSON back with metadata, credentials work
        if (data && data.metadata) {
          console.log(`✅ Credentials validated for access key: ${creds.accessKey.substring(0, 4)}...`);
          return res.json({
            valid: true,
            message: 'Credentials validated successfully with Archive.org API'
          });
        } else {
          return res.json({
            valid: false,
            error: 'Unexpected response format from Archive.org'
          });
        }
      } else if (response.status === 401) {
        console.log(`❌ Credentials rejected (401 Unauthorized) for access key: ${creds.accessKey.substring(0, 4)}...`);
        return res.json({
          valid: false,
          error: 'Invalid credentials - Archive.org returned 401 Unauthorized'
        });
      } else if (response.status === 403) {
        console.log(`❌ Credentials rejected (403 Forbidden) for access key: ${creds.accessKey.substring(0, 4)}...`);
        return res.json({
          valid: false,
          error: 'Invalid credentials - Archive.org returned 403 Forbidden'
        });
      } else {
        console.log(`⚠️  Archive.org returned status ${response.status} for access key: ${creds.accessKey.substring(0, 4)}...`);
        return res.json({
          valid: false,
          error: `Archive.org API returned status ${response.status}`
        });
      }
    } catch (fetchError) {
      console.error('Network error during validation:', fetchError);
      return res.json({
        valid: false,
        error: `Network error: ${fetchError.message}`
      });
    }

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ valid: false, error: error.message });
  }
});

// Delete credentials
app.delete('/api/credentials', async (req, res) => {
  try {
    await deleteCredentials();
    res.json({ success: true, message: 'Credentials deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete credentials' });
  }
});

// Proxy Archive.org API calls with credentials
app.post('/api/proxy/archive', async (req, res) => {
  try {
    const { url, method = 'GET', body, requiresAuth = false } = req.body;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add credentials if required
    if (requiresAuth) {
      const creds = await loadCredentials();
      if (!creds) {
        return res.status(401).json({ error: 'Credentials not configured' });
      }
      // Add Archive.org S3 authentication headers
      headers['Authorization'] = `LOW ${creds.accessKey}:${creds.secretKey}`;
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Archive OmniDash Backend running on port ${PORT}`);
  console.log(`🔐 Encryption key: ${ENCRYPTION_KEY.substring(0, 8)}...`);
  console.log(`📁 Credentials file: ${CREDENTIALS_FILE}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.filter(Boolean).join(', ')}`);
});
