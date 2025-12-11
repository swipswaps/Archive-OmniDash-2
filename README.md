# Archive OmniDash

**⚠️ DEVELOPMENT PREVIEW - NOT PRODUCTION READY**

A comprehensive React-based dashboard for interacting with various Internet Archive services. This tool provides a unified interface for metadata research, deep scraping, popularity analytics, and Wayback Machine operations.

**Note:** This application runs entirely on the client-side. Due to CORS (Cross-Origin Resource Sharing) policies on some Internet Archive endpoints, certain features employ "Smart Fallback" strategies or may require a browser extension to function 100% reliably in a development environment.

## Features

- **Item Search (Metadata Explorer)**: 
  - Fetch detailed metadata, file listings, and statistics.
  - Auto-extracts Identifiers from Archive.org URLs.
  - View formatted data or raw JSON.

- **Deep Search (Scraping)**: 
  - **Smart Fallback**: Automatically switches from the Advanced Search API to the Scrape API if CORS errors are detected.
  - Cursor-based iteration for infinite scrolling.
  - Export results to JSON.

- **Wayback Machine Tools**:
  - **Availability**: Check if a URL is archived.
  - **Visual History**: View a timeline bar chart of captures over time.
  - **SavePageNow**: Submit URLs to be crawled immediately (Requires API Keys).
  - **CDX Inspector**: View raw capture data (timestamps, status codes).

- **View Analytics**: 
  - Visualize daily view counts and trends for items over the last 30 days.

- **Settings & Demo Mode**: 
  - Configure S3 API credentials for authenticated actions.
  - **Demo Mode**: Toggle explicitly to use mock data for UI testing if API connections fail.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   *Alternatively, you can run `npm run dev`*

4. Open your browser to `http://localhost:3000` (or the port shown in the terminal).

## User Guide

### 1. API Configuration
To use write-access features like **SavePageNow**, you must provide your Internet Archive S3 API keys.

1. Go to the **Settings** tab in the application.
2. Click the link provided to visit [archive.org/account/s3.php](https://archive.org/account/s3.php).
3. Log in to your Internet Archive account.
4. Copy your **Access Key** and **Secret Key**.
5. Paste them into the respective fields in Settings and click **Save**.
   - *Security Note: Credentials are stored locally in your browser (LocalStorage). Do not use this on public computers.*

### 2. Deep Search Strategy
The app attempts to use the standard `advancedsearch.php` endpoint first. If this fails (often due to CORS in modern browsers), it automatically falls back to the `services/search/v1/scrape` API. 
- You can also manually toggle between **Standard** and **Scrape** modes in the Deep Search interface.

### 3. Wayback Machine
- Navigate to "Wayback Machine".
- Enter a URL (e.g., `google.com`).
- Use the tabs to switch between:
  - **Latest Snapshot**: Quick status check.
  - **History**: Visualization of capture frequency over years.
  - **Save Page Now**: Submit current version for archiving.

## Known Limitations (Why it is not production ready)

1. **CORS Restrictions**: The Internet Archive's Advanced Search and View Count APIs do not consistently send CORS headers for localhost or third-party domains. This app implements fallbacks, but some queries may fail without a backend proxy.
2. **Client-Side Secrets**: API keys are stored in LocalStorage. In a production environment, these should be proxied through a secure backend server to prevent exposure.
3. **Rate Limiting**: The client connects directly to IA APIs. Heavy usage of the Scraping Browser or SavePageNow may trigger IP-based rate limits.

## License

MIT