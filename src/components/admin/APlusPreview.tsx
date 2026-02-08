import { cn } from '@/lib/utils';
import { ContentBlock } from '@/types/aplus';
import { Smartphone, Monitor } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface APlusPreviewProps {
  title: string;
  description: string;
  features: string[];
  price: number;
  comparePrice: number | null;
  contentBlocks: ContentBlock[];
  defaultImages: (string | null)[];
  caseType: string;
}

const PreviewBlock = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case 'title':
      return (
        <div className="text-center px-3">
          <h3 className={cn(
            "font-bold",
            block.size === 'small' && "text-sm",
            block.size === 'medium' && "text-base",
            block.size === 'large' && "text-lg"
          )}>{block.text || <span className="text-muted-foreground/40 italic">Title text...</span>}</h3>
        </div>
      );
    case 'paragraph':
      return (
        <div className="text-center px-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            {block.text || <span className="text-muted-foreground/40 italic">Paragraph text...</span>}
          </p>
        </div>
      );
    case 'banner':
      return (
        <div className="rounded-lg overflow-hidden mx-2">
          {block.imageUrl ? (
            <img src={block.imageUrl} alt={block.alt || 'Banner'} className="w-full h-auto object-cover" />
          ) : (
            <div className="w-full h-16 bg-muted/30 flex items-center justify-center text-muted-foreground/40 text-xs">
              Banner Image
            </div>
          )}
        </div>
      );
    case 'square_image':
      return (
        <div className="flex justify-center px-3">
          <div className="w-28 h-28 rounded-lg overflow-hidden">
            {block.imageUrl ? (
              <img src={block.imageUrl} alt={block.alt || 'Image'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center text-muted-foreground/40 text-xs">
                1:1 Image
              </div>
            )}
          </div>
        </div>
      );
    case 'image_text':
      return (
        <div className={cn(
          "grid grid-cols-2 gap-2 items-center px-3",
          block.imagePosition === 'right' && "[&>*:first-child]:order-2"
        )}>
          <div className="rounded-lg overflow-hidden">
            {block.imageUrl ? (
              <img src={block.imageUrl} alt={block.alt || 'Feature'} className="w-full h-auto object-cover" />
            ) : (
              <div className="w-full h-16 bg-muted/30 flex items-center justify-center text-muted-foreground/40 text-[10px]">
                Image
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-[10px] leading-relaxed">
            {block.text || <span className="text-muted-foreground/40 italic">Text...</span>}
          </p>
        </div>
      );
    default:
      return null;
  }
};

const APlusPreview = ({
  title,
  description,
  features,
  price,
  comparePrice,
  contentBlocks,
  defaultImages,
  caseType,
}: APlusPreviewProps) => {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const hasContent = title || description || features.length > 0 || contentBlocks.length > 0;
  const validImages = defaultImages.filter(Boolean) as string[];

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <h3 className="text-sm font-semibold text-muted-foreground">Live Preview</h3>
        <div className="flex gap-1">
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-muted/20 p-4 flex justify-center">
        <div className={cn(
          "bg-background rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all duration-300",
          previewMode === 'mobile' ? "w-[280px]" : "w-full max-w-[480px]"
        )}>
          {/* Phone Notch - Mobile Only */}
          {previewMode === 'mobile' && (
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-20 h-1 rounded-full bg-muted-foreground/20" />
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Product Preview Header */}
              <div className="space-y-2">
                {/* Mock product image placeholder */}
                <div className="aspect-[3/4] rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden">
                  {validImages.length > 0 ? (
                    <img src={validImages[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground/40 space-y-1">
                      <div className="text-2xl">📱</div>
                      <p className="text-[10px]">Product Image</p>
                    </div>
                  )}
                </div>

                {/* Image thumbnails */}
                {validImages.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {validImages.map((img, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-border">
                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Case type badge */}
                <div className="flex gap-1.5">
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    caseType === 'metal' ? "bg-muted-foreground/10 text-muted-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {caseType === 'metal' ? '🔩 Metal Case' : '📱 Snap Case'}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">₹{price}</span>
                  {comparePrice && comparePrice > price && (
                    <span className="text-xs text-muted-foreground line-through">₹{comparePrice}</span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              {(title || description) && (
                <div className="space-y-1.5 border-t pt-3">
                  {title && <h4 className="text-sm font-semibold">{title}</h4>}
                  {description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
                  )}
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="space-y-1">
                  {features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="text-primary text-[10px]">✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}

              {/* A+ Content Blocks */}
              {contentBlocks.length > 0 && (
                <div className="border-t pt-3 space-y-3">
                  <p className="text-[10px] font-semibold text-center text-muted-foreground uppercase tracking-wider">
                    Product Details
                  </p>
                  {contentBlocks.map((block, idx) => (
                    <PreviewBlock key={block.id || idx} block={block} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!hasContent && (
                <div className="py-8 text-center text-muted-foreground/40 space-y-2">
                  <div className="text-3xl">✨</div>
                  <p className="text-xs">Add content to see preview</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default APlusPreview;
