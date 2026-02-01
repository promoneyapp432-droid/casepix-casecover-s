import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BannerBlock } from '@/types/aplus';
import { RectangleHorizontal } from 'lucide-react';
import ImageUploader from '../ImageUploader';

interface BannerBlockEditorProps {
  block: BannerBlock;
  onChange: (block: BannerBlock) => void;
  caseType: string;
}

const BannerBlockEditor = ({ block, onChange, caseType }: BannerBlockEditorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <RectangleHorizontal className="w-4 h-4" />
        Banner Block
      </div>
      
      <div className="space-y-4">
        <ImageUploader
          label="Banner Image (Wide)"
          value={block.imageUrl || undefined}
          onChange={(url) => onChange({ ...block, imageUrl: url || '' })}
          folder={`a-plus/${caseType}/banners`}
        />
        
        <div>
          <Label htmlFor={`alt-${block.id}`}>Alt Text</Label>
          <Input
            id={`alt-${block.id}`}
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Describe the banner..."
          />
        </div>
        
        {/* Preview */}
        {block.imageUrl && (
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="w-full aspect-[3/1] rounded-lg overflow-hidden bg-background">
              <img 
                src={block.imageUrl} 
                alt={block.alt} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerBlockEditor;
