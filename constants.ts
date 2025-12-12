export const API_BASE = {
  METADATA: 'https://archive.org/metadata',
  SEARCH: 'https://archive.org/advancedsearch.php',
  SCRAPE: 'https://archive.org/services/search/v1/scrape',
  WAYBACK_AVAILABLE: 'https://archive.org/wayback/available',
  WAYBACK_SAVE: 'https://web.archive.org/save',
  CDX: 'https://web.archive.org/cdx/search/cdx',
  VIEWS: 'https://be-api.us.archive.org/views/v1/short',
};

export const DEFAULT_SETTINGS = {
  accessKey: '',
  secretKey: '',
  demoMode: false,
  corsProxy: '',
};

export const PROXY_OPTIONS = {
  ALL_ORIGINS: 'https://api.allorigins.win/raw?url=',
  CORS_PROXY_IO: 'https://corsproxy.io/?',
};
