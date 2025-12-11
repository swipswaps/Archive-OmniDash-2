import { API_BASE } from '../constants';
import { WaybackAvailability, CDXRecord } from '../types';
import { getMockAvailability, getMockCDX } from './mockService';

const getSettings = () => {
  try {
    const settings = localStorage.getItem('omnidash_settings');
    return settings ? JSON.parse(settings) : {};
  } catch(e) { return {}; }
};

const isDemoMode = () => !!getSettings().demoMode;

const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (corsProxy && corsProxy.trim().length > 0) {
      return `${corsProxy}${url}`;
  }
  return url;
};

export const checkAvailability = async (url: string): Promise<WaybackAvailability> => {
  if (isDemoMode()) {
     return new Promise(resolve => setTimeout(() => resolve(getMockAvailability(url)), 700));
  }

  try {
    const target = `${API_BASE.WAYBACK_AVAILABLE}?url=${encodeURIComponent(url)}`;
    const res = await fetch(getProxiedUrl(target));
    if (!res.ok) {
        throw new Error(`Availability check failed with status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Availability Check Error (Falling back to mock):", error);
    // Explicitly notify in console that we are mocking due to error
    console.warn("Returning MOCK data because the live API call failed. Check your CORS Proxy settings.");
    return getMockAvailability(url);
  }
};

export const fetchCDX = async (url: string, limit: number = 3000): Promise<CDXRecord[]> => {
  if (isDemoMode()) {
      return new Promise(resolve => setTimeout(() => resolve(getMockCDX(url)), 800));
  }

  try {
    const api = `${API_BASE.CDX}?url=${encodeURIComponent(url)}&output=json&limit=${limit}&fl=urlkey,timestamp,original,mimetype,statuscode,digest,length`;
    const res = await fetch(getProxiedUrl(api));
    if (!res.ok) {
        throw new Error(`CDX fetch failed with status: ${res.status}`);
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        if (text.length === 0) return []; 
        throw new Error("Received non-JSON response from CDX API");
    }

    const json = await res.json();
    if (Array.isArray(json) && json.length > 1) {
       return json.slice(1).map((row: string[]) => ({
         urlkey: row[0],
         timestamp: row[1],
         original: row[2],
         mimetype: row[3],
         statuscode: row[4],
         digest: row[5],
         length: row[6]
       }));
    }
    return [];
  } catch (error) {
    console.error("CDX Error (Falling back to mock):", error);
    return getMockCDX(url);
  }
};

export const savePageNow = async (url: string, accessKey: string, secretKey: string): Promise<{ saved: boolean, message: string }> => {
  if (isDemoMode()) {
      return new Promise(resolve => setTimeout(() => resolve({ saved: true, message: "Mock Mode: URL successfully queued for capture." }), 1000));
  }

  if (!accessKey || !secretKey) {
    throw new Error("Missing Credentials. Please configure API keys in Settings.");
  }

  try {
    // Note: SavePageNow is a POST request. Proxies often handle POST, but some simple ones might not.
    // We attempt to use the proxy here as well.
    const target = API_BASE.WAYBACK_SAVE;
    
    const res = await fetch(getProxiedUrl(target), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `LOW ${accessKey}:${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(url)}&capture_all=1`
    });
    
    if (res.ok) {
       return { saved: true, message: "Capture request submitted." };
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