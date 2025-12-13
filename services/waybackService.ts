import { API_BASE, PROXY_OPTIONS } from '../constants';
import { WaybackAvailability, CDXRecord } from '../types';
import { getMockAvailability, getMockCDX } from './mockService';

const getSettings = () => {
  try {
    const settings = localStorage.getItem('omnidash_settings');
    return settings ? JSON.parse(settings) : {};
  } catch {
    return {};
  }
};

const isDemoMode = () => !!getSettings().demoMode;

const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (!corsProxy || corsProxy.trim().length === 0) {
    return url;
  }

  const proxy = corsProxy.trim();

  // Different CORS proxies handle URLs differently
  // allorigins.win requires the URL to be encoded
  if (proxy.includes('allorigins')) {
    return `${proxy}${encodeURIComponent(url)}`;
  }

  // corsproxy.io can handle raw URLs without encoding
  // This preserves query parameters like collapse=none
  return `${proxy}${url}`;
};

export const checkAvailability = async (url: string): Promise<WaybackAvailability> => {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve(getMockAvailability(url)), 700));
  }

  // Helper to construct response from CDX data
  const createFromCDX = (cdxRow: any[]): WaybackAvailability => {
    const timestamp = cdxRow[1];
    const original = cdxRow[2];
    const status = cdxRow[4];
    return {
      url: url,
      archived_snapshots: {
        closest: {
          available: true,
          status: status,
          timestamp: timestamp,
          url: `http://web.archive.org/web/${timestamp}/${original}`,
        },
      },
    };
  };

  try {
    // 1. Try standard Availability API
    const target = `${API_BASE.WAYBACK_AVAILABLE}?url=${encodeURIComponent(url)}`;
    const res = await fetch(getProxiedUrl(target));

    if (res.ok) {
      const data = await res.json();
      // If successful and has data, return it
      if (data && data.archived_snapshots && data.archived_snapshots.closest) {
        return data;
      }
    }

    // 2. Fallback: If Availability API failed or returned empty, try CDX "Last 1" strategy
    // limit=-1 fetches the most recent capture
    console.log('Standard availability check empty/failed, falling back to CDX...');
    const cdxUrl = `${API_BASE.CDX}?url=${encodeURIComponent(url)}&output=json&limit=-1&fl=urlkey,timestamp,original,mimetype,statuscode,digest,length`;
    const cdxRes = await fetch(getProxiedUrl(cdxUrl));

    if (cdxRes.ok) {
      const cdxJson = await cdxRes.json();
      // CDX JSON is [[headers], [data]]
      if (Array.isArray(cdxJson) && cdxJson.length > 1) {
        return createFromCDX(cdxJson[1]);
      }
    }

    // If both failed to find data, return empty state
    return {
      url,
      archived_snapshots: {},
    };
  } catch (error) {
    console.error('Availability Check Error (Falling back to mock):', error);
    // Explicitly notify in console that we are mocking due to error
    console.warn(
      'Returning MOCK data because the live API call failed. Check your CORS Proxy settings.'
    );
    return getMockAvailability(url);
  }
};

export const fetchCDX = async (url: string, limit: number = 10000): Promise<CDXRecord[]> => {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve(getMockCDX(url)), 800));
  }

  try {
    // Basic clean of URL for CDX to ensure we hit the index
    // CDX is fussy about protocols sometimes, but usually passing the full URL is best.
    const encodedUrl = encodeURIComponent(url);

    // CDX API Documentation: https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server
    //
    // IMPORTANT: There is NO "collapse=none" parameter! That was incorrect.
    //
    // Collapse options:
    // - NO collapse parameter = ALL unique captures (what we want!)
    // - collapse=timestamp:6 = monthly (YYYYMM) - ~12 per year
    // - collapse=timestamp:8 = daily (YYYYMMDD) - ~365 per year
    // - collapse=timestamp:10 = hourly (YYYYMMDDHH)
    // - collapse=digest = unique content only
    //
    // By NOT specifying collapse, we get all captures up to the limit
    const api = `${API_BASE.CDX}?url=${encodedUrl}&output=json&limit=${limit}&fl=urlkey,timestamp,original,mimetype,statuscode,digest,length`;

    const { corsProxy } = getSettings();
    const isProxied = corsProxy && corsProxy.trim().length > 0;

    let res;
    try {
      res = await fetch(getProxiedUrl(api));
    } catch (fetchError: any) {
      // Smart CORS fallback: If direct fetch fails with CORS/network error, auto-retry with proxy
      if (
        !isProxied &&
        (fetchError.message.includes('NetworkError') ||
          fetchError.message.includes('Failed to fetch') ||
          fetchError.name === 'TypeError')
      ) {
        console.log('Direct CDX fetch blocked by CORS. Attempting automatic fallback via AllOrigins...');

        // Try AllOrigins with timeout
        let allOriginsWorked = false;
        try {
          const fallbackUrl = `${PROXY_OPTIONS.ALL_ORIGINS}${encodeURIComponent(api)}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          res = await fetch(fallbackUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          // Check if AllOrigins returned valid JSON response
          const contentType = res.headers.get('content-type');
          let isValidResponse = res.ok && contentType && contentType.includes('application/json');

          // If response looks valid, try to parse it to confirm
          if (isValidResponse) {
            try {
              const testText = await res.clone().text();
              if (testText.includes('Oops') || testText.includes('timeout') || testText.includes('error')) {
                console.warn('AllOrigins returned error message, trying corsproxy.io...');
                isValidResponse = false;
              } else {
                // Try parsing to confirm it's valid JSON
                JSON.parse(testText);
                console.log('✅ CORS fallback successful via AllOrigins');
                allOriginsWorked = true;
              }
            } catch (e) {
              console.warn('AllOrigins returned invalid JSON, trying corsproxy.io...');
              isValidResponse = false;
            }
          }

          if (!isValidResponse && !allOriginsWorked) {
            console.warn(`AllOrigins failed (status: ${res.status}, content-type: ${contentType}), trying corsproxy.io...`);
            const corsProxyUrl = `${PROXY_OPTIONS.CORS_PROXY_IO}${api}`;
            res = await fetch(corsProxyUrl);

            if (!res.ok) {
              throw new Error(`All proxies failed. AllOrigins: invalid response, corsproxy.io: ${res.status}`);
            }
            console.log('✅ CORS fallback successful via corsproxy.io');
          }
        } catch (fallbackError: any) {
          // If AllOrigins timed out or failed, try corsproxy.io
          if (!allOriginsWorked) {
            console.warn(`AllOrigins timed out or failed (${fallbackError.message}), trying corsproxy.io...`);
            try {
              const corsProxyUrl = `${PROXY_OPTIONS.CORS_PROXY_IO}${api}`;
              res = await fetch(corsProxyUrl);

              if (!res.ok) {
                throw new Error(`All proxies failed. AllOrigins: timeout, corsproxy.io: ${res.status}`);
              }
              console.log('✅ CORS fallback successful via corsproxy.io');
            } catch (corsProxyError) {
              console.error('All proxies failed:', corsProxyError);
              throw new Error(
                'CORS Error: Unable to reach CDX API. Try configuring a CORS Proxy in Settings.'
              );
            }
          }
        }
      } else {
        throw fetchError;
      }
    }

    if (!res.ok) {
      throw new Error(`CDX fetch failed with status: ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      if (text.length === 0) return [];
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error('Received non-JSON response from CDX API');
    }

    let json;
    try {
      json = await res.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse CDX API response as JSON');
    }

    if (Array.isArray(json) && json.length > 1) {
      return json.slice(1).map((row: string[]) => ({
        urlkey: row[0],
        timestamp: row[1],
        original: row[2],
        mimetype: row[3],
        statuscode: row[4],
        digest: row[5],
        length: row[6],
      }));
    }
    return [];
  } catch (error: any) {
    console.error('CDX Error:', error);
    // Only fall back to mock if it's a real error, not just CORS
    if (error.message && error.message.includes('CORS Error')) {
      throw error; // Propagate CORS errors to UI
    }
    console.warn('Falling back to mock data due to error');
    return getMockCDX(url);
  }
};

export const downloadSnapshotContent = async (waybackUrl: string): Promise<string> => {
  if (isDemoMode()) {
    return '<html><body><h1>Mock Content</h1><p>This is mock HTML content for demo mode.</p></body></html>';
  }

  // Insert 'id_' into the timestamp to request the raw archived content without the Wayback toolbar.
  // Example: /web/20230101000000/http://... -> /web/20230101000000id_/http://...
  const rawUrl = waybackUrl.replace(/(\/web\/\d+)/, '$1id_');

  const { corsProxy } = getSettings();
  const isProxied = corsProxy && corsProxy.trim().length > 0;

  try {
    const res = await fetch(getProxiedUrl(rawUrl));
    if (!res.ok) {
      throw new Error(`Failed to download content: ${res.statusText} (Status ${res.status})`);
    }
    return await res.text();
  } catch (e: any) {
    // Check for typical CORS/Network errors
    if (
      !isProxied &&
      (e.message.includes('NetworkError') ||
        e.message.includes('Failed to fetch') ||
        e.name === 'TypeError')
    ) {
      console.log('Direct fetch blocked by CORS. Attempting automatic fallback via AllOrigins...');
      try {
        // Fallback to a public proxy specifically for this operation to improve UX
        // AllOrigins is good for simple text content
        const fallbackUrl = `${PROXY_OPTIONS.ALL_ORIGINS}${encodeURIComponent(rawUrl)}`;
        const resFallback = await fetch(fallbackUrl);
        if (resFallback.ok) {
          return await resFallback.text();
        }
      } catch (fallbackError) {
        console.error('Fallback proxy also failed', fallbackError);
      }

      throw new Error(
        'CORS Restriction: You must configure a CORS Proxy in Settings to download raw HTML content.'
      );
    }
    throw e;
  }
};

export const savePageNow = async (
  url: string,
  accessKey: string,
  secretKey: string
): Promise<{ saved: boolean; message: string }> => {
  if (isDemoMode()) {
    return new Promise(resolve =>
      setTimeout(
        () => resolve({ saved: true, message: 'Mock Mode: URL successfully queued for capture.' }),
        1000
      )
    );
  }

  if (!accessKey || !secretKey) {
    throw new Error('Missing Credentials. Please configure API keys in Settings.');
  }

  try {
    // Note: SavePageNow is a POST request. Proxies often handle POST, but some simple ones might not.
    // We attempt to use the proxy here as well.
    const target = API_BASE.WAYBACK_SAVE;

    const res = await fetch(getProxiedUrl(target), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `LOW ${accessKey}:${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}&capture_all=1`,
    });

    if (res.ok) {
      return { saved: true, message: 'Capture request submitted.' };
    } else {
      const text = await res.text();
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error(`Capture failed (Status ${res.status}). CORS Proxy may be required.`);
      }
      throw new Error(text || `Capture failed with status ${res.status}`);
    }
  } catch (e) {
    throw e;
  }
};
