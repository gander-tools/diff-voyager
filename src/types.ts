export interface Link {
  href: string;
  text: string;
  internal: boolean;
}

export interface ScrapedPage {
  url: string;
  version: number;
  scraped_at: string;
  title: string;
  lang: string;
  canonical: string;
  description: string;
  og_description: string;
  links: Link[];
  js_errors: string[];
}

export interface RunRecord {
  id: string;
  version: number;
  status: 'open' | 'done' | 'done_with_errors' | 'abandoned';
  pid: number | null;
  created_at: number;
}

export interface UrlRecord {
  id: string;
  url: string;
  host: string;
  path: string;
  query_string: string;
  page_slug: string;
  created_at: number;
}

export interface Config {
  screenshot?: {
    selector?: string;
    exclude?: string[];
    full_page?: boolean;
    format?: 'png' | 'jpeg';
    quality?: number;
  };
  timeout_ms?: number;
  wait_for?: string;
  viewport?: { width: number; height: number };
  user_agent?: string;
  headless?: boolean;
}

export interface UrlRun {
  id: string;
  url_id: string;
  run_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error: string | null;
  created_at: number;
}
