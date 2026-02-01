import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageTextBlock } from '@/types/aplus';
import { LayoutPanelLeft } from 'lucide-react';
import ImageUploader from '../ImageUploader';

interface ImageTextBlockEditorProps {
  block: ImageTextBlock;
  onChange: (block: ImageTextBlock) => void;
  caseType: string;
}

const ImageTextBlockEditor = ({ block, onChange, caseType }: ImageTextBlockEditorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <LayoutPanelLeft className="w-4 h-4" />
        Image with Text Block
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <ImageUploader
            label="Side Image"
            value={block.imageUrl || undefined}
            onChange={(url) => onChange({ ...block, imageUrl: url || '' })}
            folder={`a-plus/${caseType}/image-text`}
          />
          
          <div>
            <Label htmlFor={`alt-${block.id}`}>Alt Text</Label>
            <Input
              id={`alt-${block.id}`}
              value={block.alt}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              placeholder="Describe the image..."
            />
          </div>
          
          <div>
            <Label>Image Position</Label>
            <Select
              value={block.imagePosition}
              onValueChange={(pos: 'left' | 'right') => onChange({ ...block, imagePosition: pos })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor={`text-${block.id}`}>Text Content</Label>
          <Textarea
            id={`text-${block.id}`}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Enter your text content..."
            rows={8}
          />
        </div>
      </div>
      
      {/* Preview */}
      {(block.imageUrl || block.text) && (
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <div className={`flex gap-4 items-start ${block.imagePosition === 'right' ? 'flex-row-reverse' : ''}`}>
            {block.imageUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-background flex-shrink-0">
                <img 
                  src={block.imageUrl} 
                  alt={block.alt} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {block.text && (
              <p className="text-sm text-muted-foreground flex-1">{block.text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTextBlockEditor;
