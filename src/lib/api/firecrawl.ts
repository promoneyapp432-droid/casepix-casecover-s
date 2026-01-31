import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapeOptions = {
  formats?: (
    | 'markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot' | 'branding' | 'summary'
    | { type: 'json'; schema?: object; prompt?: string }
  )[];
  onlyMainContent?: boolean;
  waitFor?: number;
  location?: { country?: string; languages?: string[] };
};

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Scrape mobile info specifically (image and name from GSM Arena or other mobile sites)
  async scrapeMobileInfo(url: string): Promise<{ name?: string; image?: string; error?: string }> {
    try {
      // Use rawHtml to get complete page for better image extraction
      const response = await this.scrape(url, {
        formats: ['html', 'rawHtml'],
        onlyMainContent: false, // Get full page to find phone images
        waitFor: 2000, // Wait for dynamic content
      });

      if (!response.success || response.error) {
        return { error: response.error || 'Failed to scrape' };
      }

      // Try to extract from response data - Firecrawl v1 nests in data.data
      const scrapeData = response.data?.data || response.data;
      
      // Get metadata
      const metadata = scrapeData?.metadata || {};
      
      // Get HTML content
      const html = scrapeData?.rawHtml || scrapeData?.html || '';
      
      let image: string | undefined;
      let name: string | undefined;

      // GSM Arena specific extraction
      if (url.includes('gsmarena.com')) {
        // GSM Arena phone image patterns - they use specific classes
        const gsmImagePatterns = [
          // Main phone image on specs page
          /<a[^>]*class="[^"]*specs-photo-main[^"]*"[^>]*href="([^"]+)"/i,
          // Phone image in picture gallery
          /<img[^>]*class="[^"]*specs-photo[^"]*"[^>]*src="([^"]+)"/i,
          // Phone thumbnail in device page
          /<div[^>]*class="[^"]*specs-photo[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i,
          // Device picture link
          /<a[^>]*href="([^"]+)"[^>]*class="[^"]*pics-wide[^"]*"/i,
          // Any image with -0 or _1 suffix (main phone image pattern)
          /<img[^>]*src="(https:\/\/[^"]*gsmarena[^"]*(?:-0|_1)[^"]*\.(?:jpg|png|webp))"/i,
        ];

        for (const pattern of gsmImagePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            image = match[1];
            console.log('Found GSM Arena image with pattern:', pattern.source);
            break;
          }
        }

        // GSM Arena name extraction from h1
        const h1Match = html.match(/<h1[^>]*class="[^"]*specs-phone-name[^"]*"[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
          name = h1Match[1].trim();
        }
      }

      // Fallback to OG image
      if (!image) {
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogImageMatch) {
          image = ogImageMatch[1];
        }
      }

      // Fallback to any suitable image
      if (!image) {
        // Look for large phone images (exclude icons, logos, etc.)
        const imgMatches = [...html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)];
        for (const match of imgMatches) {
          const src = match[1];
          if (src &&
              !src.includes('icon') &&
              !src.includes('logo') &&
              !src.includes('.svg') &&
              !src.includes('pixel') &&
              !src.includes('tracking') &&
              !src.includes('1x1') &&
              !src.includes('flag') &&
              !src.includes('banner') &&
              (src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('.jpeg'))) {
            image = src;
            break;
          }
        }
      }

      // Get name from metadata if not found in HTML
      if (!name) {
        name = metadata.ogTitle || metadata.title || '';
        // Clean up name - remove site name suffixes
        name = name.split('|')[0].split(' - ')[0].trim();
      }

      // Make relative URLs absolute
      if (image && !image.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          image = image.startsWith('/') 
            ? `${urlObj.protocol}//${urlObj.host}${image}`
            : `${urlObj.protocol}//${urlObj.host}/${image}`;
        } catch {
          // Keep original if URL parsing fails
        }
      }

      console.log('Scraped mobile info:', { name, image });

      return {
        name: name || undefined,
        image: image || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  },
};
