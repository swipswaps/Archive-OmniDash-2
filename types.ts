export interface IAMetadata {
  created?: number;
  d1?: string;
  d2?: string;
  dir?: string;
  files_count?: number;
  item_size?: number;
  metadata?: Record<string, unknown>;
  files?: Array<{
    name: string;
    source: string;
    format: string;
    size?: string;
    md5?: string;
    crc32?: string;
    sha1?: string;
  }>;
  server?: string;
  uniq?: number;
  workable_servers?: string[];
}

export interface IASearchResult {
  identifier: string;
  title?: string;
  mediatype?: string;
  date?: string;
  downloads?: number;
  description?: string;
}

export interface WaybackAvailability {
  url: string;
  archived_snapshots: {
    closest?: {
      status: string;
      available: boolean;
      url: string;
      timestamp: string;
    };
  };
}

export interface CDXRecord {
  urlkey: string;
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
  length: string;
}

export interface SavedSnapshot {
  id: string;
  url: string;
  originalUrl: string;
  timestamp: string;
  savedAt: number;
  content: string;
  mimetype: string;
}

export type ViewCountData = Record<string, unknown>;

export interface AppSettings {
  accessKey: string;
  secretKey: string;
  demoMode: boolean;
  corsProxy?: string;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  METADATA = 'metadata',
  SCRAPING = 'scraping',
  ANALYTICS = 'analytics',
  WAYBACK = 'wayback',
  SETTINGS = 'settings',
}
