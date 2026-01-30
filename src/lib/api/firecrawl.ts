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
      const response = await this.scrape(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      if (!response.success || response.error) {
        return { error: response.error || 'Failed to scrape' };
      }

      // Try to extract from response data
      const scrapeData = response.data?.data || response.data;
      
      // Get metadata
      const metadata = scrapeData?.metadata || {};
      
      // Try to get image from metadata first
      let image = metadata.ogImage || metadata.image;
      
      // If no OG image, try to find in HTML
      if (!image && scrapeData?.html) {
        const html = scrapeData.html;
        
        // Look for phone image in GSM Arena style pages
        const imgPatterns = [
          /<img[^>]*class=\"[^"]*specs-photo[^"]*"[^>]*src="([^"]+)"/i,
          /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
          /<img[^>]*id="[^"]*phone[^"]*"[^>]*src="([^"]+)"/i,
        ];
        
        for (const pattern of imgPatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            image = match[1];
            break;
          }
        }
      }

      // Get name from title or OG title
      const name = metadata.ogTitle || metadata.title || '';
      
      // Clean up name - remove site name suffixes
      const cleanName = name.split('|')[0].split('-')[0].trim();

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

      return {
        name: cleanName || undefined,
        image: image || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  },
};
