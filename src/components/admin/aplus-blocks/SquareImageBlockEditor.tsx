import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SquareImageBlock } from '@/types/aplus';
import { Square } from 'lucide-react';
import ImageUploader from '../ImageUploader';

interface SquareImageBlockEditorProps {
  block: SquareImageBlock;
  onChange: (block: SquareImageBlock) => void;
  caseType: string;
}

const SquareImageBlockEditor = ({ block, onChange, caseType }: SquareImageBlockEditorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Square className="w-4 h-4" />
        Square Image Block
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <ImageUploader
            label="Square Image (1:1)"
            value={block.imageUrl || undefined}
            onChange={(url) => onChange({ ...block, imageUrl: url || '' })}
            folder={`a-plus/${caseType}/squares`}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor={`alt-${block.id}`}>Alt Text</Label>
            <Input
              id={`alt-${block.id}`}
              value={block.alt}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              placeholder="Describe the image..."
            />
          </div>
          
          {/* Preview */}
          {block.imageUrl && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-background">
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
    </div>
  );
};

export default SquareImageBlockEditor;
