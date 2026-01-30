const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapeResult {
  name?: string;
  image?: string;
  error?: string;
}

async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    console.log(`Scraping URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Fetched HTML, length: ${html.length}`);

    // Extract Open Graph image
    let image: string | undefined;
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      image = ogImageMatch[1];
    }

    // Fallback: Try to find first large image
    if (!image) {
      const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
      if (imgMatches) {
        for (const imgTag of imgMatches) {
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
          if (srcMatch) {
            const src = srcMatch[1];
            // Skip small icons, SVGs, tracking pixels
            if (!src.includes('icon') && 
                !src.includes('logo') && 
                !src.includes('.svg') && 
                !src.includes('pixel') &&
                !src.includes('tracking') &&
                (src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('.jpeg'))) {
              image = src;
              break;
            }
          }
        }
      }
    }

    // Make relative URLs absolute
    if (image && !image.startsWith('http')) {
      const urlObj = new URL(url);
      image = image.startsWith('/') 
        ? `${urlObj.protocol}//${urlObj.host}${image}`
        : `${urlObj.protocol}//${urlObj.host}/${image}`;
    }

    // Extract title/name
    let name: string | undefined;
    
    // Try Open Graph title first
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      name = ogTitleMatch[1];
    }
    
    // Fallback to page title
    if (!name) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        name = titleMatch[1].trim();
      }
    }
    
    // Try H1 as fallback
    if (!name) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        name = h1Match[1].trim();
      }
    }

    // Clean up name - remove site name suffixes
    if (name) {
      name = name.split('|')[0].split('-')[0].trim();
    }

    console.log(`Scraped - Name: ${name}, Image: ${image}`);
    
    return { name, image };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Scrape error for ${url}:`, errorMessage);
    return { error: errorMessage };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await scrapeUrl(url);

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
